import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10kb' }))

const JWT_SECRET = process.env.JWT_SECRET || 'insiderx_secret_key_2024'

const ASSETS = {
  forex: { name: 'Forex (Currency Pairs)', description: 'The most liquid market with tight spreads', pairs: [
    { id: 'EUR/USD', name: 'EUR/USD', pip: 0.0001, spread: 0.8 },
    { id: 'USD/JPY', name: 'USD/JPY', pip: 0.01, spread: 0.6 },
    { id: 'GBP/USD', name: 'GBP/USD', pip: 0.0001, spread: 1.2 },
    { id: 'XAU/USD', name: 'Gold (XAU/USD)', pip: 0.01, spread: 0.8 },
    { id: 'AUD/USD', name: 'AUD/USD', pip: 0.0001, spread: 1.0 },
    { id: 'USD/CAD', name: 'USD/CAD', pip: 0.0001, spread: 1.0 },
    { id: 'USD/CHF', name: 'USD/CHF', pip: 0.0001, spread: 1.2 },
    { id: 'NZD/USD', name: 'NZD/USD', pip: 0.0001, spread: 1.4 },
    { id: 'EUR/GBP', name: 'EUR/GBP', pip: 0.0001, spread: 1.0 },
    { id: 'GBP/JPY', name: 'GBP/JPY', pip: 0.01, spread: 1.5 },
    { id: 'EUR/JPY', name: 'EUR/JPY', pip: 0.01, spread: 0.8 },
  ]},
  indices: { name: 'Stock Indices', description: 'Track global stock market performance', pairs: [
    { id: 'US500', name: 'S&P 500', pip: 0.1, spread: 3 },
    { id: 'US100', name: 'NASDAQ 100', pip: 0.1, spread: 4 },
    { id: 'US30', name: 'Dow Jones 30', pip: 1, spread: 5 },
    { id: 'UK100', name: 'FTSE 100', pip: 0.5, spread: 4 },
    { id: 'GER40', name: 'DAX 40', pip: 0.5, spread: 4 },
    { id: 'FRA40', name: 'CAC 40', pip: 0.5, spread: 4 },
    { id: 'JPN225', name: 'Nikkei 225', pip: 5, spread: 6 },
  ]},
  commodities: { name: 'Commodities', description: 'Trade raw materials and energy', pairs: [
    { id: 'WTI', name: 'Crude Oil (WTI)', pip: 0.01, spread: 2 },
    { id: 'BRENT', name: 'Brent Crude', pip: 0.01, spread: 2 },
    { id: 'XAU/USD', name: 'Gold', pip: 0.01, spread: 0.8 },
    { id: 'XAG/USD', name: 'Silver', pip: 0.001, spread: 1.5 },
    { id: 'NGAS', name: 'Natural Gas', pip: 0.001, spread: 3 },
    { id: 'COPPER', name: 'Copper', pip: 0.0001, spread: 2 },
  ]},
  crypto: { name: 'Cryptocurrencies', description: '24/7 digital asset trading', pairs: [
    { id: 'BTC/USD', name: 'Bitcoin (BTC)', pip: 1, spread: 15 },
    { id: 'ETH/USD', name: 'Ethereum (ETH)', pip: 0.01, spread: 8 },
    { id: 'SOL/USD', name: 'Solana (SOL)', pip: 0.001, spread: 12 },
    { id: 'XRP/USD', name: 'XRP', pip: 0.0001, spread: 3 },
    { id: 'ADA/USD', name: 'Cardano (ADA)', pip: 0.0001, spread: 4 },
    { id: 'DOGE/USD', name: 'Dogecoin', pip: 0.00001, spread: 5 },
  ]},
  synthetic: { name: 'Synthetic Indices', description: 'Algorithmic indices with constant volatility', pairs: [
    { id: 'Volatility_10', name: 'Volatility 10 Index', pip: 0.01, spread: 1 },
    { id: 'Volatility_25', name: 'Volatility 25 Index', pip: 0.01, spread: 1 },
    { id: 'Volatility_50', name: 'Volatility 50 Index', pip: 0.01, spread: 1 },
    { id: 'Volatility_75', name: 'Volatility 75 Index', pip: 0.01, spread: 1 },
    { id: 'Volatility_100', name: 'Volatility 100 Index', pip: 0.01, spread: 1 },
    { id: 'Crash_500', name: 'Crash 500', pip: 0.01, spread: 1 },
    { id: 'Boom_1000', name: 'Boom 1000', pip: 0.01, spread: 1 },
  ]}
}

const TRADE_TYPES = {
  'rise-fall': { name: 'Rise/Fall', multiplier: 1.85 },
  'higher-lower': { name: 'Higher/Lower', multiplier: 1.85 },
  'over-under': { name: 'Over/Under', multiplier: 1.85 },
  'even-odd': { name: 'Even/Odd', multiplier: 1.85 },
  'touch-no-touch': { name: 'Touch/No Touch', multiplier: 2 },
  'match-miss': { name: 'Match/Differs', multiplier: 2 },
}

const DURATIONS = {
  ticks: { name: 'Ticks', options: [5, 10, 25, 50, 100, 200, 500, 1000] },
  seconds: { name: 'Seconds', options: [5, 10, 15, 30, 45, 60] },
  minutes: { name: 'Minutes', options: [1, 2, 3, 5, 10, 15, 30, 45, 60, 120] },
  hours: { name: 'Hours', options: [1, 2, 4, 8, 12, 24] }
}

const globalForDb = global
if (!globalForDb.insiderxDb) {
  globalForDb.insiderxDb = {
    users: [{
      id: 1, name: 'Demo User', email: 'demo@test.com',
      password: bcrypt.hashSync('password123', 10),
      accountType: 'demo', demoBalance: 10000.00, realBalance: 0.00,
      isVerified: true, verificationCode: null, verificationExpires: null,
      kycStatus: 'none', notifications: { email: true, tradeAlerts: true, priceAlerts: true, marketing: false },
      deposits: [], withdrawals: [], createdAt: new Date().toISOString()
    }],
    trades: [],
    nextUserId: 2,
    nextTradeId: 1,
    priceStore: new Map(),
    alerts: [],
    chatMessages: []
  }
}
const db = globalForDb.insiderxDb

function generateInitialPrice(symbolId) {
  const presets = { 'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'AUD/USD': 0.6520, 'EUR/GBP': 0.8560,
    'US_100': 18500, 'US_30': 38500, 'US_500': 5200, 'UK_100': 8100, 'GER_40': 18500,
    'Gold': 2350, 'Silver': 28.50, 'Oil': 85.00, 'Copper': 4.20,
    'BTC/USD': 67000, 'ETH/USD': 3450, 'LTC/USD': 85,
    'Volatility_10': 1000, 'Volatility_25': 1000, 'Volatility_50': 1000, 'Volatility_75': 1000, 'Volatility_100': 1000,
    'Crash_500': 1000, 'Boom_1000': 1000
  }
  const base = presets[symbolId] || 1000
  return +(base + (Math.random() - 0.5) * base * 0.002).toFixed(4)
}

function getAssetPrice(symbolId) {
  if (!db.priceStore.has(symbolId)) db.priceStore.set(symbolId, generateInitialPrice(symbolId))
  let price = db.priceStore.get(symbolId)
  const volatilityMap = {
    'Volatility_10': 0.5, 'Volatility_25': 1, 'Volatility_50': 2, 'Volatility_75': 3, 'Volatility_100': 4,
    'Crash_500': 5, 'Boom_1000': 5, 'BTC/USD': 50, 'ETH/USD': 2, 'Gold': 1.5, 'Silver': 0.05, 'Oil': 0.3,
    'EUR/USD': 0.0003, 'GBP/USD': 0.0004, 'USD/JPY': 0.05, 'AUD/USD': 0.0003, 'EUR/GBP': 0.0003,
    'US_100': 3, 'US_30': 5, 'US_500': 1, 'UK_100': 2, 'GER_40': 3
  }
  const volatility = volatilityMap[symbolId] || 1
  const direction = Math.random() > 0.48 ? 1 : -1
  const change = direction * volatility * (0.5 + Math.random())
  price = Math.max(price * 0.9, price + change)
  db.priceStore.set(symbolId, price)
  return +price.toFixed(4)
}

function getUser(id) { return db.users.find(u => u.id === id) }

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format' })
    
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing) return res.status(409).json({ message: 'Email already registered' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    const user = {
      id: db.nextUserId++, name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword,
      accountType: 'demo', demoBalance: 10000.00, realBalance: 0.00, isVerified: false,
      verificationCode, verificationExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      deposits: [], withdrawals: [], createdAt: new Date().toISOString()
    }
    db.users.push(user)
    
    console.log(`\n📧 EMAIL VERIFICATION: ${email} Code: ${verificationCode}\n`)
    res.status(201).json({ message: 'Registration successful. Check console for verification code.', userId: user.id })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body
    if (!userId || !code) return res.status(400).json({ message: 'User ID and verification code required' })
    
    const user = db.users.find(u => u.id === parseInt(userId))
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' })
    if (user.verificationCode !== code) return res.status(400).json({ message: 'Invalid verification code' })
    if (new Date() > new Date(user.verificationExpires)) return res.status(400).json({ message: 'Verification code expired' })

    user.isVerified = true
    user.verificationCode = null
    user.verificationExpires = null

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password, ...safeUser } = user
    safeUser.balance = user.demoBalance
    res.json({ message: 'Email verified successfully!', token, user: safeUser })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email required' })
    
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' })

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    user.verificationCode = verificationCode
    user.verificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    
    console.log(`\n📧 NEW VERIFICATION CODE: ${email} Code: ${verificationCode}\n`)
    res.json({ message: 'Verification code sent.', userId: user.id })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified. Check console for code.', needsVerification: true, userId: user.id })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user
    safeUser.balance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
    res.json({ token, user: safeUser })
  } catch { res.status(500).json({ message: 'Server error' }) }
})

app.get('/api/users/me', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { password, ...safeUser } = user
  safeUser.balance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  res.json(safeUser)
})

app.put('/api/users/profile', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { name, email } = req.body
  if (name) user.name = name.trim()
  if (email) {
    const conflict = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id)
    if (conflict) return res.status(409).json({ message: 'Email already in use' })
    user.email = email.toLowerCase().trim()
  }
  const { password, ...safeUser } = user
  res.json(safeUser)
})

app.post('/api/users/reset-balance', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (user.accountType !== 'demo') return res.status(400).json({ message: 'Can only reset demo balance' })
  user.demoBalance = 10000.00
  res.json({ balance: user.demoBalance, message: 'Demo balance reset to $10,000' })
})

app.post('/api/users/deposit', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { amount } = req.body
  const depositAmount = parseFloat(amount)
  if (!depositAmount || depositAmount <= 0) return res.status(400).json({ message: 'Valid amount required' })
  if (depositAmount < 10) return res.status(400).json({ message: 'Minimum deposit is $10' })
  if (depositAmount > 50000) return res.status(400).json({ message: 'Maximum deposit is $50,000' })
  
  const deposit = { id: Date.now(), amount: depositAmount, method: 'bank_transfer', status: 'completed', createdAt: new Date().toISOString() }
  user.deposits.push(deposit)
  user.realBalance = +(user.realBalance + depositAmount).toFixed(2)
  res.json({ balance: user.realBalance, deposit, message: `Deposited $${depositAmount}` })
})

app.get('/api/users/deposits', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.deposits || [])
})

app.post('/api/users/withdraw', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { amount } = req.body
  const withdrawAmount = parseFloat(amount)
  if (!withdrawAmount || withdrawAmount <= 0) return res.status(400).json({ message: 'Valid amount required' })
  if (withdrawAmount < 10) return res.status(400).json({ message: 'Minimum withdrawal is $10' })
  if (user.realBalance < withdrawAmount) return res.status(400).json({ message: 'Insufficient balance' })
  
  const withdrawal = { id: Date.now(), amount: withdrawAmount, method: 'bank_transfer', status: 'pending', createdAt: new Date().toISOString() }
  user.withdrawals.push(withdrawal)
  user.realBalance = +(user.realBalance - withdrawAmount).toFixed(2)
  res.json({ balance: user.realBalance, withdrawal, message: `Withdrawal of $${withdrawAmount} submitted` })
})

app.get('/api/users/withdrawals', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.withdrawals || [])
})

app.get('/api/users/wallet', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ demoBalance: user.demoBalance, realBalance: user.realBalance, totalDeposits: user.deposits?.reduce((s, d) => s + d.amount, 0) || 0, deposits: user.deposits || [], withdrawals: user.withdrawals || [] })
})

app.get('/api/users/kyc/status', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ status: user.kycStatus || 'none', submittedAt: user.kycSubmittedAt, verifiedAt: user.kycVerifiedAt })
})

app.post('/api/users/kyc/start', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  user.kycStatus = 'pending'
  user.kycSubmittedAt = new Date().toISOString()
  res.json({ status: 'pending', message: 'KYC verification started' })
})

app.get('/api/users/notifications', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.notifications || { email: true, tradeAlerts: true, priceAlerts: true, marketing: false })
})

app.put('/api/users/notifications', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { email, tradeAlerts, priceAlerts, marketing } = req.body
  user.notifications = { email: email ?? user.notifications?.email ?? true, tradeAlerts: tradeAlerts ?? user.notifications?.tradeAlerts ?? true, priceAlerts: priceAlerts ?? user.notifications?.priceAlerts ?? true, marketing: marketing ?? user.notifications?.marketing ?? false }
  res.json(user.notifications)
})

app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' })
  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) return res.status(400).json({ message: 'Current password is incorrect' })
  if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })
  user.password = await bcrypt.hash(newPassword, 10)
  res.json({ message: 'Password changed successfully' })
})

app.get('/api/markets', (req, res) => {
  const markets = Object.entries(ASSETS).map(([key, category]) => ({ id: key, name: category.name, description: category.description, assets: category.pairs.map(a => ({ id: a.id, name: a.name, pip: a.pip, spread: a.spread })) }))
  res.json(markets)
})

app.get('/api/markets/:category', (req, res) => {
  const { category } = req.params
  const cat = ASSETS[category]
  if (!cat) return res.status(404).json({ message: 'Market category not found' })
  res.json({ id: category, name: cat.name, assets: cat.pairs })
})

app.get('/api/trade/types', (req, res) => res.json(Object.entries(TRADE_TYPES).map(([key, t]) => ({ id: key, ...t }))))

app.get('/api/trade/durations', (req, res) => res.json(Object.entries(DURATIONS).map(([key, d]) => ({ id: key, ...d }))))

app.get('/api/price/:symbol', (req, res) => {
  const { symbol } = req.params
  const price = getAssetPrice(symbol)
  const asset = Object.values(ASSETS).flatMap(c => c.pairs).find(a => a.id === symbol)
  if (!asset) return res.status(404).json({ message: 'Symbol not found' })
  res.json({ symbol, price, pip: asset.pip, timestamp: Date.now() })
})

app.post('/api/prices', (req, res) => {
  const { symbols } = req.body
  if (!Array.isArray(symbols)) return res.status(400).json({ message: 'symbols array required' })
  res.json(symbols.map(s => ({ symbol: s, price: getAssetPrice(s), timestamp: Date.now() })))
})

function calculatePayout(stake, tradeType, won) {
  if (!won) return 0
  const type = TRADE_TYPES[tradeType]
  return type ? +(stake * type.multiplier).toFixed(2) : +(stake * 1.85).toFixed(2)
}

app.post('/api/contracts', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { symbol, tradeType, direction, stake, duration, durationType } = req.body
  if (!symbol || !tradeType || direction == null || !stake || !duration || !durationType) return res.status(400).json({ message: 'All fields required' })
  
  const currentBalance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  if (currentBalance < parseFloat(stake)) return res.status(400).json({ message: 'Insufficient balance' })

  const stakeNum = parseFloat(stake)
  const tradeInfo = TRADE_TYPES[tradeType]
  if (!tradeInfo) return res.status(400).json({ message: 'Invalid trade type' })

  const entryPrice = getAssetPrice(symbol)

  if (user.accountType === 'demo') user.demoBalance = +(user.demoBalance - stakeNum).toFixed(2)
  else user.realBalance = +(user.realBalance - stakeNum).toFixed(2)

  const contract = { id: db.nextTradeId++, userId: user.id, accountType: user.accountType, symbol, tradeType, direction, stake: stakeNum, entryPrice, duration, durationType, createdAt: new Date().toISOString(), status: 'pending' }
  db.trades.push(contract)
  const newBalance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  res.status(201).json({ contract: { ...contract, entryPrice, payout: stakeNum * tradeInfo.multiplier }, balance: newBalance })
})

app.post('/api/contracts/:id/expire', authMiddleware, (req, res) => {
  const { id } = req.params
  const contract = db.trades.find(t => t.id === parseInt(id) && t.userId === req.userId)
  if (!contract) return res.status(404).json({ message: 'Contract not found' })
  if (contract.status !== 'pending') return res.status(400).json({ message: 'Contract already settled' })

  const exitPrice = getAssetPrice(contract.symbol)
  const won = (contract.direction === 'rise' && exitPrice > contract.entryPrice) || (contract.direction === 'fall' && exitPrice < contract.entryPrice) || (Math.random() > 0.48)
  const payout = calculatePayout(contract.stake, contract.tradeType, won)
  const pl = payout - contract.stake

  const user = getUser(req.userId)
  if (contract.accountType === 'demo') user.demoBalance = +(user.demoBalance + payout).toFixed(2)
  else user.realBalance = +(user.realBalance + payout).toFixed(2)

  contract.status = 'settled'
  contract.result = won ? 'won' : 'lost'
  contract.exitPrice = exitPrice
  contract.payout = payout
  contract.pl = pl
  contract.settledAt = new Date().toISOString()

  const newBalance = contract.accountType === 'demo' ? user.demoBalance : user.realBalance
  res.json({ contract, balance: newBalance })
})

app.get('/api/contracts', authMiddleware, (req, res) => {
  const pending = db.trades.filter(t => t.userId === req.userId && t.status === 'pending')
  res.json(pending)
})

app.get('/api/trades', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const userTrades = db.trades.filter(t => t.userId === req.userId).slice(-limit).reverse()
  res.json(userTrades)
})

app.get('/api/trades/stats', authMiddleware, (req, res) => {
  const userTrades = db.trades.filter(t => t.userId === req.userId)
  const won = userTrades.filter(t => t.result === 'won')
  const lost = userTrades.filter(t => t.result === 'lost')
  const totalStake = userTrades.reduce((s, t) => s + t.stake, 0)
  const totalPayout = userTrades.reduce((s, t) => s + (t.payout || 0), 0)
  res.json({ totalTrades: userTrades.length, won: won.length, lost: lost.length, winRate: userTrades.length ? +((won.length / userTrades.length) * 100).toFixed(1) : 0, totalStake: +totalStake.toFixed(2), totalPayout: +totalPayout.toFixed(2), netPL: +(totalPayout - totalStake).toFixed(2) })
})

app.delete('/api/trades', authMiddleware, (req, res) => {
  db.trades = db.trades.filter(t => t.userId !== req.userId)
  res.json({ message: 'Trade history cleared' })
})

app.get('/api/alerts', authMiddleware, (req, res) => {
  const userAlerts = db.alerts.filter(a => a.userId === req.userId)
  res.json(userAlerts)
})

app.post('/api/alerts', authMiddleware, (req, res) => {
  const { symbol, condition, price } = req.body
  if (!symbol || !condition || !price) return res.status(400).json({ message: 'symbol, condition, and price are required' })
  const alert = { id: Date.now(), userId: req.userId, symbol, condition, targetPrice: parseFloat(price), active: true, triggered: false, createdAt: new Date().toISOString() }
  db.alerts.push(alert)
  res.status(201).json(alert)
})

app.put('/api/alerts/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const { active } = req.body
  const alert = db.alerts.find(a => a.id === parseInt(id) && a.userId === req.userId)
  if (!alert) return res.status(404).json({ message: 'Alert not found' })
  alert.active = active
  res.json(alert)
})

app.delete('/api/alerts/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const index = db.alerts.findIndex(a => a.id === parseInt(id) && a.userId === req.userId)
  if (index === -1) return res.status(404).json({ message: 'Alert not found' })
  db.alerts.splice(index, 1)
  res.json({ message: 'Alert deleted' })
})

app.get('/api/chat/messages', authMiddleware, (req, res) => {
  const userMessages = db.chatMessages.filter(m => m.userId === req.userId).slice(-50)
  res.json(userMessages)
})

app.post('/api/chat/message', authMiddleware, (req, res) => {
  const { message } = req.body
  if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' })
  const userMessage = { id: Date.now(), userId: req.userId, text: message.trim(), sender: 'user', timestamp: new Date().toISOString() }
  db.chatMessages.push(userMessage)
  
  const responses = { greeting: "Hello! I'm TradeBot Pro Assistant. How can I help you?", balance: "Your current balance is shown in the dashboard.", trading: "To trade: 1) Select a market 2) Choose trade type 3) Set duration & stake 4) Click BUY RISE or BUY FALL", markets: "We offer Forex, Indices, Commodities, Crypto, and Synthetic Indices.", help: "I can help with: trading questions, platform features, account inquiries, market information", default: "Thank you for your message. Describe your issue for faster help." }
  const msg = message.toLowerCase()
  let responseText = responses.default
  if (msg.includes('hello') || msg.includes('hi')) responseText = responses.greeting
  else if (msg.includes('balance') || msg.includes('money')) responseText = responses.balance
  else if (msg.includes('trade') || msg.includes('buy')) responseText = responses.trading
  else if (msg.includes('market') || msg.includes('forex')) responseText = responses.markets
  else if (msg.includes('help')) responseText = responses.help
  
  const aiResponse = { id: Date.now() + 1, userId: req.userId, text: responseText, sender: 'ai', timestamp: new Date().toISOString() }
  db.chatMessages.push(aiResponse)
  res.status(201).json([userMessage, aiResponse])
})

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', users: db.users.length, trades: db.trades.length }))

export default app
