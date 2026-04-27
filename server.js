import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

dotenv.config()

const app = express()

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Rate Limiting - Simple security against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: { message: 'Rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter)
app.use('/api', apiLimiter)

app.use(express.json({ limit: '10kb' })) // Limit body size

const JWT_SECRET = process.env.JWT_SECRET || 'tradebot_secret_key_2024'
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// ─── Market Data (Asset Types & Symbols) ───────────────────────────────────────
const ASSETS = {
  forex: {
    name: 'Forex (Currency Pairs)',
    description: 'The most liquid market with tight spreads',
    pairs: [
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
    ]
  },
  indices: {
    name: 'Stock Indices',
    description: 'Track global stock market performance',
    pairs: [
      { id: 'US500', name: 'S&P 500', pip: 0.1, spread: 3 },
      { id: 'US100', name: 'NASDAQ 100', pip: 0.1, spread: 4 },
      { id: 'US30', name: 'Dow Jones 30', pip: 1, spread: 5 },
      { id: 'UK100', name: 'FTSE 100', pip: 0.5, spread: 4 },
      { id: 'GER40', name: 'DAX 40', pip: 0.5, spread: 4 },
      { id: 'FRA40', name: 'CAC 40', pip: 0.5, spread: 4 },
      { id: 'JPN225', name: 'Nikkei 225', pip: 5, spread: 6 },
    ]
  },
  commodities: {
    name: 'Commodities',
    description: 'Trade raw materials and energy',
    pairs: [
      { id: 'WTI', name: 'Crude Oil (WTI)', pip: 0.01, spread: 2 },
      { id: 'BRENT', name: 'Brent Crude', pip: 0.01, spread: 2 },
      { id: 'XAU/USD', name: 'Gold', pip: 0.01, spread: 0.8 },
      { id: 'XAG/USD', name: 'Silver', pip: 0.001, spread: 1.5 },
      { id: 'NGAS', name: 'Natural Gas', pip: 0.001, spread: 3 },
      { id: 'COPPER', name: 'Copper', pip: 0.0001, spread: 2 },
    ]
  },
  crypto: {
    name: 'Cryptocurrencies',
    description: '24/7 digital asset trading',
    pairs: [
      { id: 'BTC/USD', name: 'Bitcoin (BTC)', pip: 1, spread: 15 },
      { id: 'ETH/USD', name: 'Ethereum (ETH)', pip: 0.01, spread: 8 },
      { id: 'SOL/USD', name: 'Solana (SOL)', pip: 0.001, spread: 12 },
      { id: 'XRP/USD', name: 'XRP', pip: 0.0001, spread: 3 },
      { id: 'ADA/USD', name: 'Cardano (ADA)', pip: 0.0001, spread: 4 },
      { id: 'DOGE/USD', name: 'Dogecoin', pip: 0.00001, spread: 5 },
    ]
  },
  synthetic: {
    name: 'Synthetic Indices',
    description: 'Algorithmic indices with constant volatility',
    pairs: [
      { id: 'Volatility_10', name: 'Volatility 10 Index', pip: 0.01, spread: 1 },
      { id: 'Volatility_25', name: 'Volatility 25 Index', pip: 0.01, spread: 1 },
      { id: 'Volatility_50', name: 'Volatility 50 Index', pip: 0.01, spread: 1 },
      { id: 'Volatility_75', name: 'Volatility 75 Index', pip: 0.01, spread: 1 },
      { id: 'Volatility_100', name: 'Volatility 100 Index', pip: 0.01, spread: 1 },
      { id: 'Crash_500', name: 'Crash 500', pip: 0.01, spread: 1 },
      { id: 'Boom_1000', name: 'Boom 1000', pip: 0.01, spread: 1 },
    ]
  }
}

// Trade types with their payout multipliers
const TRADE_TYPES = {
  'rise-fall': { name: 'Rise/Fall', multiplier: 1.85, description: 'Predict if price will be higher or lower at expiry' },
  'higher-lower': { name: 'Higher/Lower', multiplier: 1.85, description: 'Predict if price will be above or below a barrier' },
  'over-under': { name: 'Over/Under', multiplier: 1.85, description: 'Predict if price will be over or under a target' },
  'even-odd': { name: 'Even/Odd', multiplier: 1.85, description: 'Predict if the last digit will be even or odd' },
  'touch-no-touch': { name: 'Touch/No Touch', multiplier: 2, description: 'Predict if price will touch or not touch a barrier' },
  'match-miss': { name: 'Match/Differs', multiplier: 2, description: 'Predict if price will match or differ from a target' },
}

// Contract durations
const DURATIONS = {
  ticks: { name: 'Ticks', options: [5, 10, 25, 50, 100, 200, 500, 1000] },
  seconds: { name: 'Seconds', options: [5, 10, 15, 30, 45, 60] },
  minutes: { name: 'Minutes', options: [1, 2, 3, 5, 10, 15, 30, 45, 60, 120] },
  hours: { name: 'Hours', options: [1, 2, 4, 8, 12, 24] }
}

// Generate initial price for an asset
function generateInitialPrice(symbolId) {
  const presets = {
    'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'AUD/USD': 0.6520, 'EUR/GBP': 0.8560,
    'US_100': 18500, 'US_30': 38500, 'US_500': 5200, 'UK_100': 8100, 'GER_40': 18500,
    'Gold': 2350, 'Silver': 28.50, 'Oil': 85.00, 'Copper': 4.20,
    'BTC/USD': 67000, 'ETH/USD': 3450, 'LTC/USD': 85,
    'Volatility_10': 1000, 'Volatility_25': 1000, 'Volatility_50': 1000, 'Volatility_75': 1000, 'Volatility_100': 1000,
    'Crash_500': 1000, 'Boom_1000': 1000
  }
  const base = presets[symbolId] || 1000
  return +(base + (Math.random() - 0.5) * base * 0.002).toFixed(4)
}

// ─── In-Memory Database ───────────────────────────────────────────────────────
const db = {
  users: [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@test.com',
      password: bcrypt.hashSync('password123', 10),
      accountType: 'demo',
      demoBalance: 10000.00,
      realBalance: 0.00,
      isVerified: true,
      verificationCode: null,
      verificationExpires: null,
      kycStatus: 'none',
      kycSubmittedAt: null,
      kycVerifiedAt: null,
      notifications: {
        email: true,
        tradeAlerts: true,
        priceAlerts: true,
        marketing: false
      },
      deposits: [],
      withdrawals: [],
      createdAt: new Date().toISOString()
    }
  ],
  trades: [],
  nextUserId: 2,
  nextTradeId: 1
}

// ─── Middleware ───────────────────────────────────────────────────────────────
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

function getUser(id) {
  return db.users.find(u => u.id === id)
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification email (mock - log to console)
function sendVerificationEmail(email, code) {
  console.log(`\n📧 EMAIL VERIFICATION`)
  console.log(`   To: ${email}`)
  console.log(`   Code: ${code}`)
  console.log(`   Expires in: 30 minutes\n`)
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Invalid email format' })

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing)
      return res.status(409).json({ message: 'Email already registered' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const { accountType = 'demo' } = req.body
    
    const verificationCode = generateVerificationCode()
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    
    const user = {
      id: db.nextUserId++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      accountType: accountType,
      demoBalance: 10000.00,
      realBalance: 0.00,
      isVerified: false,
      verificationCode: verificationCode,
      verificationExpires: verificationExpires,
      deposits: [],
      withdrawals: [],
      createdAt: new Date().toISOString()
    }
    db.users.push(user)

    // Send verification email
    sendVerificationEmail(user.email, verificationCode)

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification code.',
      userId: user.id
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body

    if (!userId || !code)
      return res.status(400).json({ message: 'User ID and verification code required' })

    const user = db.users.find(u => u.id === parseInt(userId))
    if (!user)
      return res.status(404).json({ message: 'User not found' })

    if (user.isVerified)
      return res.status(400).json({ message: 'Email already verified' })

    if (user.verificationCode !== code)
      return res.status(400).json({ message: 'Invalid verification code' })

    if (new Date() > new Date(user.verificationExpires))
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' })

    // Mark as verified
    user.isVerified = true
    user.verificationCode = null
    user.verificationExpires = null

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user
    safeUser.balance = user.accountType === 'demo' ? user.demoBalance : user.realBalance

    res.json({ message: 'Email verified successfully!', token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/resend-verification
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body

    if (!email)
      return res.status(400).json({ message: 'Email required' })

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user)
      return res.status(404).json({ message: 'User not found' })

    if (user.isVerified)
      return res.status(400).json({ message: 'Email already verified' })

    // Generate new code
    const verificationCode = generateVerificationCode()
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    
    user.verificationCode = verificationCode
    user.verificationExpires = verificationExpires

    sendVerificationEmail(user.email, verificationCode)

    res.json({ message: 'Verification code sent. Check your email.', userId: user.id })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' })

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' })

    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' })

    if (!user.isVerified)
      return res.status(403).json({ 
        message: 'Email not verified. Please verify your email to login.',
        needsVerification: true,
        userId: user.id
      })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user
    safeUser.balance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
    
    res.json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ─── User Routes ──────────────────────────────────────────────────────────────

// GET /api/users/me
app.get('/api/users/me', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  const { password: _, ...safeUser } = user
  safeUser.balance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  res.json(safeUser)
})

// PUT /api/users/profile
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

  const { password: _, ...safeUser } = user
  res.json(safeUser)
})

// POST /api/users/reset-balance (Demo only)
app.post('/api/users/reset-balance', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (user.accountType !== 'demo') {
    return res.status(400).json({ message: 'Can only reset demo balance' })
  }
  user.demoBalance = 10000.00
  res.json({ balance: user.demoBalance, message: 'Demo balance reset to $10,000' })
})

// POST /api/users/deposit (Real account)
app.post('/api/users/deposit', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  
  const { amount, method = 'bank_transfer' } = req.body
  const depositAmount = parseFloat(amount)
  
  if (!depositAmount || depositAmount <= 0) {
    return res.status(400).json({ message: 'Valid amount required' })
  }
  
  if (depositAmount < 10) {
    return res.status(400).json({ message: 'Minimum deposit is $10' })
  }
  
  if (depositAmount > 50000) {
    return res.status(400).json({ message: 'Maximum deposit is $50,000' })
  }
  
  const deposit = {
    id: Date.now(),
    amount: depositAmount,
    method,
    status: 'completed',
    createdAt: new Date().toISOString()
  }
  
  user.deposits.push(deposit)
  user.realBalance = +(user.realBalance + depositAmount).toFixed(2)
  
  res.json({ 
    balance: user.realBalance, 
    deposit,
    message: `Successfully deposited $${depositAmount}` 
  })
})

// GET /api/users/deposits
app.get('/api/users/deposits', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.deposits || [])
})

// POST /api/users/withdraw
app.post('/api/users/withdraw', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  
  const { amount, method = 'bank_transfer', accountDetails } = req.body
  const withdrawAmount = parseFloat(amount)
  
  if (!withdrawAmount || withdrawAmount <= 0) {
    return res.status(400).json({ message: 'Valid amount required' })
  }
  
  if (withdrawAmount < 10) {
    return res.status(400).json({ message: 'Minimum withdrawal is $10' })
  }
  
  if (user.realBalance < withdrawAmount) {
    return res.status(400).json({ message: 'Insufficient balance' })
  }
  
  const withdrawal = {
    id: Date.now(),
    amount: withdrawAmount,
    method,
    accountDetails: accountDetails ? '****' + accountDetails.slice(-4) : 'bank_transfer',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  
  user.withdrawals.push(withdrawal)
  user.realBalance = +(user.realBalance - withdrawAmount).toFixed(2)
  
  res.json({ 
    balance: user.realBalance, 
    withdrawal,
    message: `Withdrawal of $${withdrawAmount} submitted for processing` 
  })
})

// GET /api/users/withdrawals
app.get('/api/users/withdrawals', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.withdrawals || [])
})

// GET /api/users/wallet
app.get('/api/users/wallet', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({
    demoBalance: user.demoBalance,
    realBalance: user.realBalance,
    totalDeposits: user.deposits?.reduce((s, d) => s + d.amount, 0) || 0,
    totalWithdrawals: user.withdrawals?.reduce((s, w) => s + w.amount, 0) || 0,
    deposits: user.deposits || [],
    withdrawals: user.withdrawals || []
  })
})

// ─── Trade Routes ─────────────────────────────────────────────────────────────

// POST /api/trades  — record a simulated trade
app.post('/api/trades', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const { market, stake, payout, result, pl } = req.body

  if (!market || stake == null || result == null)
    return res.status(400).json({ message: 'market, stake and result are required' })

  // Update user balance
  user.balance = Math.max(0, +(user.balance + parseFloat(pl || 0)).toFixed(2))

  const trade = {
    id: db.nextTradeId++,
    userId: user.id,
    market,
    stake: parseFloat(stake),
    payout: parseFloat(payout || 0),
    result,
    pl: parseFloat(pl || 0),
    timestamp: new Date().toISOString()
  }
  db.trades.push(trade)

  res.status(201).json({ trade, balance: user.balance })
})

// GET /api/trades — get current user's trade history
app.get('/api/trades', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const userTrades = db.trades
    .filter(t => t.userId === req.userId)
    .slice(-limit)
    .reverse()
  res.json(userTrades)
})

// GET /api/trades/stats — aggregated stats for current user
app.get('/api/trades/stats', authMiddleware, (req, res) => {
  const userTrades = db.trades.filter(t => t.userId === req.userId)
  const won = userTrades.filter(t => t.result === 'won')
  const lost = userTrades.filter(t => t.result === 'lost')
  const totalStake = userTrades.reduce((s, t) => s + t.stake, 0)
  const totalPayout = userTrades.reduce((s, t) => s + t.payout, 0)

  res.json({
    totalTrades: userTrades.length,
    won: won.length,
    lost: lost.length,
    winRate: userTrades.length ? +((won.length / userTrades.length) * 100).toFixed(1) : 0,
    totalStake: +totalStake.toFixed(2),
    totalPayout: +totalPayout.toFixed(2),
    netPL: +(totalPayout - totalStake).toFixed(2)
  })
})

// DELETE /api/trades — clear trade history for current user
app.delete('/api/trades', authMiddleware, (req, res) => {
  db.trades = db.trades.filter(t => t.userId !== req.userId)
  res.json({ message: 'Trade history cleared' })
})

// ─── AI Support Bot Responses ────────────────────────────────────────────────
const AI_RESPONSES = {
  greeting: "Hello! I'm TradeBot Pro Assistant. How can I help you today?",
  help: "I can help you with:\n• Trading questions and strategies\n• Platform features\n• Account and balance inquiries\n• Market information",
  balance: "Your current balance is shown in the dashboard. For demo accounts, you can reset anytime.",
  trading: "To trade: 1) Select a market 2) Choose trade type 3) Set duration & stake 4) Click BUY RISE or BUY FALL",
  markets: "We offer Forex, Indices, Commodities, Crypto, and Synthetic Indices.",
  default: "Thank you for your message. Describe your issue in detail for faster help.",
  bye: "Thank you for using TradeBot Pro! Happy trading!"
}

function getAIResponse(message) {
  const msg = message.toLowerCase()
  if (msg.includes('hello') || msg.includes('hi')) return AI_RESPONSES.greeting
  if (msg.includes('balance') || msg.includes('money')) return AI_RESPONSES.balance
  if (msg.includes('trade') || msg.includes('buy')) return AI_RESPONSES.trading
  if (msg.includes('market') || msg.includes('forex')) return AI_RESPONSES.markets
  if (msg.includes('help')) return AI_RESPONSES.help
  if (msg.includes('thank') || msg.includes('bye')) return AI_RESPONSES.bye
  return AI_RESPONSES.default
}

// Support chat messages storage
const chatMessages = []

// ─── Support Chat Routes ─────────────────────────────────────────────────────────

app.get('/api/chat/messages', authMiddleware, (req, res) => {
  const userMessages = chatMessages.filter(m => m.userId === req.userId).slice(-50)
  res.json(userMessages)
})

app.post('/api/chat/message', authMiddleware, (req, res) => {
  const { message } = req.body
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' })
  }
  
  const userMessage = {
    id: Date.now(),
    userId: req.userId,
    text: message.trim(),
    sender: 'user',
    timestamp: new Date().toISOString()
  }
  chatMessages.push(userMessage)
  
  const aiResponse = {
    id: Date.now() + 1,
    userId: req.userId,
    text: getAIResponse(message),
    sender: 'ai',
    timestamp: new Date().toISOString()
  }
  chatMessages.push(aiResponse)
  
  res.status(201).json([userMessage, aiResponse])
})

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    users: db.users.length,
    trades: db.trades.length,
    uptime: process.uptime().toFixed(0) + 's'
  })
})

// ─── Market API Routes ─────────────────────────────────────────────────────────

// GET /api/markets - Get all available markets
app.get('/api/markets', (req, res) => {
  const markets = Object.entries(ASSETS).map(([key, category]) => ({
    id: key,
    name: category.name,
    description: category.description,
    assets: category.pairs.map(a => ({ id: a.id, name: a.name, pip: a.pip, spread: a.spread }))
  }))
  res.json(markets)
})

// GET /api/markets/:category - Get assets for a specific category
app.get('/api/markets/:category', (req, res) => {
  const { category } = req.params
  const cat = ASSETS[category]
  if (!cat) return res.status(404).json({ message: 'Market category not found' })
  res.json({ id: category, name: cat.name, assets: cat.pairs })
})

// GET /api/trade/types - Get available trade types
app.get('/api/trade/types', (req, res) => {
  res.json(Object.entries(TRADE_TYPES).map(([key, t]) => ({ id: key, ...t })))
})

// GET /api/trade/durations - Get available duration types
app.get('/api/trade/durations', (req, res) => {
  res.json(Object.entries(DURATIONS).map(([key, d]) => ({ id: key, ...d })))
})

// ─── Price Ticker (Real-time simulation) ─────────────────────────────────────

const priceStore = new Map()

function getAssetPrice(symbolId) {
  if (!priceStore.has(symbolId)) {
    priceStore.set(symbolId, generateInitialPrice(symbolId))
  }
  let price = priceStore.get(symbolId)
  
  const volatilityMap = {
    'Volatility_10': 0.5, 'Volatility_25': 1, 'Volatility_50': 2, 'Volatility_75': 3, 'Volatility_100': 4,
    'Crash_500': 5, 'Boom_1000': 5,
    'BTC/USD': 50, 'ETH/USD': 2, 'LTC/USD': 0.5,
    'Gold': 1.5, 'Silver': 0.05, 'Oil': 0.3, 'Copper': 0.02,
    'EUR/USD': 0.0003, 'GBP/USD': 0.0004, 'USD/JPY': 0.05, 'AUD/USD': 0.0003, 'EUR/GBP': 0.0003,
    'US_100': 3, 'US_30': 5, 'US_500': 1, 'UK_100': 2, 'GER_40': 3
  }
  const volatility = volatilityMap[symbolId] || 1
  const direction = Math.random() > 0.48 ? 1 : -1
  const change = direction * volatility * (0.5 + Math.random())
  price = Math.max(price * 0.9, price + change)
  priceStore.set(symbolId, price)
  return +price.toFixed(4)
}

// GET /api/price/:symbol - Get current price for a symbol
app.get('/api/price/:symbol', (req, res) => {
  const { symbol } = req.params
  let price = getAssetPrice(symbol)
  const asset = Object.values(ASSETS).flatMap(c => c.pairs).find(a => a.id === symbol)
  if (!asset) return res.status(404).json({ message: 'Symbol not found' })
  res.json({ symbol, price, pip: asset.pip, timestamp: Date.now() })
})

// GET /api/prices - Get prices for multiple symbols
app.post('/api/prices', (req, res) => {
  const { symbols } = req.body
  if (!Array.isArray(symbols)) return res.status(400).json({ message: 'symbols array required' })
  const prices = symbols.map(s => ({ symbol: s, price: getAssetPrice(s), timestamp: Date.now() }))
  res.json(prices)
})

// ─── Trading Contract Routes ─────────────────────────────────────────────────

function calculatePayout(stake, tradeType, won) {
  if (!won) return 0
  const type = TRADE_TYPES[tradeType]
  return type ? +(stake * type.multiplier).toFixed(2) : +(stake * 1.85).toFixed(2)
}

app.post('/api/contracts', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const { symbol, tradeType, direction, stake, duration, durationType } = req.body

  if (!symbol || !tradeType || direction == null || !stake || !duration || !durationType) {
    return res.status(400).json({ message: 'symbol, tradeType, direction, stake, duration, and durationType are required' })
  }

  const currentBalance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  
  if (currentBalance < parseFloat(stake)) {
    return res.status(400).json({ message: 'Insufficient balance' })
  }

  const stakeNum = parseFloat(stake)
  const tradeInfo = TRADE_TYPES[tradeType]
  if (!tradeInfo) return res.status(400).json({ message: 'Invalid trade type' })

  const entryPrice = getAssetPrice(symbol)

  if (user.accountType === 'demo') {
    user.demoBalance = +(user.demoBalance - stakeNum).toFixed(2)
  } else {
    user.realBalance = +(user.realBalance - stakeNum).toFixed(2)
  }

  const contract = {
    id: db.nextTradeId++,
    userId: user.id,
    accountType: user.accountType,
    symbol,
    tradeType,
    direction,
    stake: stakeNum,
    entryPrice,
    duration,
    durationType,
    createdAt: new Date().toISOString(),
    status: 'pending'
  }
  
  db.trades.push(contract)

  const newBalance = user.accountType === 'demo' ? user.demoBalance : user.realBalance
  
  res.status(201).json({
    contract: { ...contract, entryPrice, payout: stakeNum * tradeInfo.multiplier },
    balance: newBalance
  })
})

app.post('/api/contracts/:id/expire', authMiddleware, (req, res) => {
  const { id } = req.params
  const contract = db.trades.find(t => t.id === parseInt(id) && t.userId === req.userId)
  
  if (!contract) return res.status(404).json({ message: 'Contract not found' })
  if (contract.status !== 'pending') return res.status(400).json({ message: 'Contract already settled' })

  const exitPrice = getAssetPrice(contract.symbol)
  const won = (contract.direction === 'rise' && exitPrice > contract.entryPrice) ||
              (contract.direction === 'fall' && exitPrice < contract.entryPrice) ||
              (contract.direction === 'over' && exitPrice > contract.entryPrice) ||
              (contract.direction === 'under' && exitPrice < contract.entryPrice) ||
              (Math.random() > 0.48)

  const payout = calculatePayout(contract.stake, contract.tradeType, won)
  const pl = payout - contract.stake

  const user = getUser(req.userId)
  
  if (contract.accountType === 'demo') {
    user.demoBalance = +(user.demoBalance + payout).toFixed(2)
  } else {
    user.realBalance = +(user.realBalance + payout).toFixed(2)
  }

  contract.status = 'settled'
  contract.result = won ? 'won' : 'lost'
  contract.exitPrice = exitPrice
  contract.payout = payout
  contract.pl = pl
  contract.settledAt = new Date().toISOString()

  const newBalance = contract.accountType === 'demo' ? user.demoBalance : user.realBalance
  
  res.json({ contract, balance: newBalance })
})

// GET /api/contracts - Get open contracts
app.get('/api/contracts', authMiddleware, (req, res) => {
  const pending = db.trades.filter(t => t.userId === req.userId && t.status === 'pending')
  res.json(pending)
})

// ─── KYC Routes ─────────────────────────────────────────────────────────────

app.get('/api/users/kyc/status', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({
    status: user.kycStatus || 'none',
    submittedAt: user.kycSubmittedAt,
    verifiedAt: user.kycVerifiedAt
  })
})

app.post('/api/users/kyc/start', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  user.kycStatus = 'pending'
  user.kycSubmittedAt = new Date().toISOString()
  res.json({ status: 'pending', message: 'KYC verification started' })
})

// ─── Alerts Routes ───────────────────────────────────────────────────────────

const alerts = []

app.get('/api/alerts', authMiddleware, (req, res) => {
  const userAlerts = alerts.filter(a => a.userId === req.userId)
  res.json(userAlerts)
})

app.post('/api/alerts', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  
  const { symbol, condition, price } = req.body
  if (!symbol || !condition || !price) {
    return res.status(400).json({ message: 'symbol, condition, and price are required' })
  }
  
  const alert = {
    id: Date.now(),
    userId: req.userId,
    symbol,
    condition,
    targetPrice: parseFloat(price),
    active: true,
    triggered: false,
    createdAt: new Date().toISOString()
  }
  alerts.push(alert)
  res.status(201).json(alert)
})

app.put('/api/alerts/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const { active } = req.body
  const alert = alerts.find(a => a.id === parseInt(id) && a.userId === req.userId)
  if (!alert) return res.status(404).json({ message: 'Alert not found' })
  
  alert.active = active
  res.json(alert)
})

app.delete('/api/alerts/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const index = alerts.findIndex(a => a.id === parseInt(id) && a.userId === req.userId)
  if (index === -1) return res.status(404).json({ message: 'Alert not found' })
  
  alerts.splice(index, 1)
  res.json({ message: 'Alert deleted' })
})

// ─── Notification Settings Routes ──────────────────────────────────────────

app.get('/api/users/notifications', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(user.notifications || {
    email: true,
    tradeAlerts: true,
    priceAlerts: true,
    marketing: false
  })
})

app.put('/api/users/notifications', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  
  const { email, tradeAlerts, priceAlerts, marketing } = req.body
  user.notifications = {
    email: email ?? user.notifications?.email ?? true,
    tradeAlerts: tradeAlerts ?? user.notifications?.tradeAlerts ?? true,
    priceAlerts: priceAlerts ?? user.notifications?.priceAlerts ?? true,
    marketing: marketing ?? user.notifications?.marketing ?? false
  }
  res.json(user.notifications)
})

// ─── Change Password Route ──────────────────────────────────────────────────

app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  
  const { currentPassword, newPassword } = req.body
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password required' })
  }
  
  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) {
    return res.status(400).json({ message: 'Current password is incorrect' })
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' })
  }
  
  user.password = await bcrypt.hash(newPassword, 10)
  res.json({ message: 'Password changed successfully' })
})

// ─── Trust Proxy for Production ─────────────────────────────────────────────
app.set('trust proxy', 1)

// ─── Health Check with Domain Info ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'
  res.json({
    status: 'ok',
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
    domain: process.env.DOMAIN || 'localhost',
    users: db.users.length,
    trades: db.trades.length,
    uptime: process.uptime().toFixed(0) + 's',
    timestamp: new Date().toISOString()
  })
})

// ─── HTTPS Redirect (for production with domain) ───────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url)
    }
    next()
  })
}

// ─── Start Server ────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  const isProd = process.env.NODE_ENV === 'production'
  const url = process.env.DOMAIN 
    ? `https://${process.env.DOMAIN}` 
    : `http://localhost:${PORT}`
  
  console.log(`
  ╔════════════════════════════════════════╗
  ║       InsiderX API Started        ║
  ╠════════════════════════════════════════╣
  ║  Environment: ${isProd ? 'production ' : 'development'}
  ║  URL: ${url}
  ║  Demo: demo@test.com / password123
  ╚════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})