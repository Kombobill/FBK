import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts'
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, 
  Clock, RefreshCw, Target, BarChart2, Activity, Calendar, 
  Filter, Download, ChevronDown, X, Bell
} from 'lucide-react'
import axios from 'axios'

const COLORS = ['#00e676', '#ff3d57', '#58a6ff', '#ffab00', '#a371f7']

export default function Portfolio() {
  const { user, accountType } = useAuth()
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [timeFilter, setTimeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [timeFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        axios.get(`/api/trades?limit=100`),
        axios.get(`/api/trades/stats`)
      ])
      setTrades(tradesRes.data)
      setStats(statsRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filteredTrades = trades.filter(t => {
    if (timeFilter === 'all') return true
    const now = new Date()
    const tradeDate = new Date(t.timestamp || t.createdAt)
    if (timeFilter === 'today') return tradeDate.toDateString() === now.toDateString()
    if (timeFilter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return tradeDate > weekAgo
    }
    if (timeFilter === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      return tradeDate > monthAgo
    }
    return true
  })

  const winLossData = stats ? [
    { name: 'Won', value: stats.won, color: '#00e676' },
    { name: 'Lost', value: stats.lost, color: '#ff3d57' }
  ] : []

  const dailyData = filteredTrades.reduce((acc, t) => {
    const date = new Date(t.timestamp || t.createdAt).toLocaleDateString()
    const existing = acc.find(a => a.date === date)
    if (existing) {
      if (t.result === 'won') existing.won++
      else existing.lost++
      existing.pl += t.pl || 0
    } else {
      acc.push({
        date,
        won: t.result === 'won' ? 1 : 0,
        lost: t.result === 'lost' ? 1 : 0,
        pl: t.pl || 0
      })
    }
    return acc
  }, []).slice(-14)

  const assetData = filteredTrades.reduce((acc, t) => {
    const symbol = t.symbol || 'Unknown'
    const existing = acc.find(a => a.symbol === symbol)
    if (existing) {
      existing.trades++
      existing.pl += t.pl || 0
    } else {
      acc.push({ symbol, trades: 1, pl: t.pl || 0 })
    }
    return acc
  }, []).sort((a, b) => b.trades - a.trades).slice(0, 8)

  const currentBalance = accountType === 'demo' ? (user?.demoBalance || 10000) : (user?.realBalance || 0)
  const totalDeposited = user?.deposits?.reduce((s, d) => s + d.amount, 0) || 0
  const totalWithdrawn = user?.withdrawals?.reduce((s, w) => s + w.amount, 0) || 0

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Portfolio Overview</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" style={{ width: 'auto', padding: '8px 12px' }} value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button onClick={loadData} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Wallet size={16} color="var(--green)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
            ${currentBalance.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {accountType === 'demo' ? 'Demo Account' : 'Real Account'}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={16} color="var(--blue)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total P/L</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: (stats?.netPL || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(stats?.netPL || 0) >= 0 ? '+' : ''}${(stats?.netPL || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {stats?.totalTrades || 0} total trades
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={16} color="var(--amber)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
            {stats?.winRate || 0}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {stats?.won || 0} won / {stats?.lost || 0} lost
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Activity size={16} color="var(--blue)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Staked</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            ${(stats?.totalStake || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            ${(stats?.totalPayout || 0).toFixed(2)} payouts
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Win/Loss Pie */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Win / Loss Distribution</h3>
          {stats && stats.totalTrades > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} 
                  dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No trades yet
            </div>
          )}
        </div>

        {/* P/L by Day */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>P/L by Day</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={false} tickLine={false} 
                  tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={v => [`$${v.toFixed(2)}`, 'P/L']} />
                <Bar dataKey="pl" fill="#00e676" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={index} fill={entry.pl >= 0 ? '#00e676' : '#ff3d57'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data available
            </div>
          )}
        </div>

        {/* Trades by Asset */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Trades by Asset</h3>
          {assetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assetData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={false} />
                <YAxis dataKey="symbol" type="category" tick={{ fontSize: 10, fill: '#8b949e' }} width={60} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="trades" fill="#58a6ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No trades yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Trades</h3>
          <button className="btn btn-ghost btn-sm">
            <Download size={14} /> Export
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Asset</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Stake</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Payout</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Result</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>P/L</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.slice(0, 20).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    {new Date(t.timestamp || t.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500 }}>{t.symbol}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>{t.tradeType || 'Rise/Fall'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12 }}>${t.stake?.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12 }}>${t.payout?.toFixed(2) || '0.00'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span className={t.result === 'won' ? 'tag-green' : 'tag-red'}>
                      {t.result?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: (t.pl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(t.pl || 0) >= 0 ? '+' : ''}{t.pl?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No trades found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
