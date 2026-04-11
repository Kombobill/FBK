const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'tradebot_secret_key_2024'
const PORT = process.env.PORT || 5000

// ─── In-Memory Database ───────────────────────────────────────────────────────
const db = {
  users: [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@test.com',
      password: bcrypt.hashSync('password123', 10),
      balance: 10000.00,
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

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existing)
      return res.status(409).json({ message: 'Email already registered' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = {
      id: db.nextUserId++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      balance: 10000.00,
      createdAt: new Date().toISOString()
    }
    db.users.push(user)

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user

    res.status(201).json({ token, user: safeUser })
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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    const { password: _, ...safeUser } = user

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

// POST /api/users/reset-balance
app.post('/api/users/reset-balance', authMiddleware, (req, res) => {
  const user = getUser(req.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  user.balance = 10000.00
  res.json({ balance: user.balance, message: 'Balance reset to $10,000' })
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

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    users: db.users.length,
    trades: db.trades.length,
    uptime: process.uptime().toFixed(0) + 's'
  })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  TradeBotPro API running on http://localhost:${PORT}`)
  console.log(`  Demo login: demo@test.com / password123\n`)
})
