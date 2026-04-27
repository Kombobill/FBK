import { useState, useEffect } from 'react'
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Activity, Clock, Calendar,
  RefreshCw, Filter, Zap, Target, Award
} from 'lucide-react'
import axios from 'axios'

export default function Analytics() {
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        axios.get(`/api/trades?limit=500`),
        axios.get(`/api/trades/stats`)
      ])
      setTrades(tradesRes.data)
      setStats(statsRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filteredTrades = trades.filter(t => {
    const now = new Date()
    const tradeDate = new Date(t.timestamp || t.createdAt)
    if (period === 'today') return tradeDate.toDateString() === now.toDateString()
    if (period === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return tradeDate > weekAgo
    }
    if (period === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
      return tradeDate > monthAgo
    }
    return true
  })

  const equityCurve = filteredTrades.reduce((acc, t, i) => {
    const prev = i === 0 ? 10000 : acc[i - 1].equity
    const change = t.pl || 0
    acc.push({
      trade: i + 1,
      equity: +(prev + change).toFixed(2),
      date: new Date(t.timestamp || t.createdAt).toLocaleDateString()
    })
    return acc
  }, [])

  const pnlByHour = Array.from({ length: 24 }, (_, i => ({
    hour: `${i}:00`,
    won: 0,
    lost: 0,
    net: 0
  })))
  filteredTrades.forEach(t => {
    const hour = new Date(t.timestamp || t.createdAt).getHours()
    if (pnlByHour[hour]) {
      if (t.result === 'won') pnlByHour[hour].won++
      else pnlByHour[hour].lost++
      pnlByHour[hour].net += t.pl || 0
    }
  })

  const pnlByDay = {}
  filteredTrades.forEach(t => {
    const day = new Date(t.timestamp || t.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
    if (!pnlByDay[day]) pnlByDay[day] = { won: 0, lost: 0, net: 0 }
    if (t.result === 'won') pnlByDay[day].won++
    else pnlByDay[day].lost++
    pnlByDay[day].net += t.pl || 0
  })
  const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayChartData = dayOrder.map(day => ({ day, ...(pnlByDay[day] || { won: 0, lost: 0, net: 0 }) }))

  const assetPerformance = filteredTrades.reduce((acc, t) => {
    const symbol = t.symbol || 'Unknown'
    if (!acc[symbol]) acc[symbol] = { trades: 0, won: 0, lost: 0, netPL: 0 }
    acc[symbol].trades++
    if (t.result === 'won') acc[symbol].won++
    else acc[symbol].lost++
    acc[symbol].netPL += t.pl || 0
    return acc
  }, {})
  const assetData = Object.entries(assetPerformance)
    .map(([symbol, data]) => ({ 
      symbol, 
      ...data, 
      winRate: data.trades ? Math.round((data.won / data.trades) * 100) : 0 
    }))
    .sort((a, b) => b.trades - a.trades)
    .slice(0, 10)

  const tradeTypePerf = filteredTrades.reduce((acc, t) => {
    const type = t.tradeType || 'rise-fall'
    if (!acc[type]) acc[type] = { trades: 0, won: 0, lost: 0, netPL: 0 }
    acc[type].trades++
    if (t.result === 'won') acc[type].won++
    else acc[type].lost++
    acc[type].netPL += t.pl || 0
    return acc
  }, {})
  const tradeTypeData = Object.entries(tradeTypePerf).map(([type, data]) => ({
    type: type.replace('-', ' ').toUpperCase(),
    ...data,
    winRate: data.trades ? Math.round((data.won / data.trades) * 100) : 0
  }))

  const avgStake = filteredTrades.length ? filteredTrades.reduce((s, t) => s + t.stake, 0) / filteredTrades.length : 0
  const avgWin = filteredTrades.filter(t => t.result === 'won').length ? 
    filteredTrades.filter(t => t.result === 'won').reduce((s, t) => s + (t.pl || 0), 0) / filteredTrades.filter(t => t.result === 'won').length : 0
  const avgLoss = filteredTrades.filter(t => t.result === 'lost').length ?
    filteredTrades.filter(t => t.result === 'lost').reduce((s, t) => s + (t.pl || 0), 0) / filteredTrades.filter(t => t.result === 'lost').length : 0

  const riskReward = avgWin && Math.abs(avgLoss) ? (avgWin / Math.abs(avgLoss)).toFixed(2) : '0'

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Trading Analytics</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" style={{ width: 'auto', padding: '8px 12px' }} value={period}
            onChange={e => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={loadData} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Activity size={14} color="var(--blue)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Trades</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{filteredTrades.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Target size={14} color="var(--green)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>
            {stats?.winRate || 0}%
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={14} color="var(--green)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net P/L</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: (stats?.netPL || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {(stats?.netPL || 0) >= 0 ? '+' : ''}${(stats?.netPL || 0).toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={14} color="var(--amber)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk/Reward</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{riskReward}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Award size={14} color="var(--blue)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Stake</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>${avgStake.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Trade</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            ${((stats?.totalStake || 0) / (filteredTrades.length || 1)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Equity Curve</h3>
        {equityCurve.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="trade" tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={v => [`$${v}`, 'Equity']} labelFormatter={v => `Trade #${v}`} />
              <Area type="monotone" dataKey="equity" stroke="#00e676" fill="url(#equityGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No trade data available
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* P/L by Hour */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Performance by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
              <YAxis tick={{ fontSize: 9, fill: '#8b949e' }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="won" stackId="a" fill="#00e676" />
              <Bar dataKey="lost" stackId="a" fill="#ff3d57" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* P/L by Day */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Performance by Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={{ stroke: '#30363d' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b949e' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={v => [`$${v.toFixed(2)}`, 'P/L']} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {dayOrder.map((day, index) => (
                  <Cell key={index} fill={(pnlByDay[day]?.net || 0) >= 0 ? '#00e676' : '#ff3d57'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset & Trade Type Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
        {/* Asset Performance */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Asset Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assetData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No data</div>
            ) : assetData.map((asset, i) => (
              <div key={asset.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--bg-2)', borderRadius: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{asset.symbol}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{asset.trades} trades • {asset.winRate}% win</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: asset.netPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {asset.netPL >= 0 ? '+' : ''}${asset.netPL.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Type Performance */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Trade Type Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tradeTypeData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No data</div>
            ) : tradeTypeData.map(type => (
              <div key={type.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--bg-2)', borderRadius: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{type.type}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{type.trades} trades • {type.winRate}% win</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: type.netPL >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {type.netPL >= 0 ? '+' : ''}${type.netPL.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
