import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Play, Square, TrendingUp, TrendingDown, Activity, DollarSign, Target, Zap } from 'lucide-react'
import axios from 'axios'

function generateTick(prev) {
  const change = (Math.random() - 0.485) * 3
  return Math.max(900, Math.min(1100, prev + change))
}

export default function Dashboard() {
  const { user, updateBalance } = useAuth()
  const [running, setRunning] = useState(false)
  const [chartData, setChartData] = useState(() => {
    let v = 1000; const d = []
    for (let i = 60; i >= 0; i--) { v = generateTick(v); d.push({ t: i, v: +v.toFixed(3) }) }
    return d
  })
  const [stats, setStats] = useState({ runs: 0, won: 0, lost: 0, stake: 0, payout: 0 })
  const [trades, setTrades] = useState([])
  const [activeTab, setActiveTab] = useState('summary')
  const [settings, setSettings] = useState({ stake: 1, market: 'Volatility 10 Index', strategy: 'Over/Under' })
  const runRef = useRef(false)
  const intervalRef = useRef(null)
  const tickRef = useRef(null)
  const balanceRef = useRef(user?.balance || 10000)

  // Live chart ticking
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1].v
        const next = +generateTick(last).toFixed(3)
        const newData = [...prev.slice(-79), { t: Date.now(), v: next }]
        return newData
      })
    }, 800)
    return () => clearInterval(tickRef.current)
  }, [])

  const simulateTrade = useCallback(async () => {
    if (!runRef.current) return
    const stake = parseFloat(settings.stake)
    const win = Math.random() > 0.45
    const payout = win ? +(stake * 1.85).toFixed(2) : 0
    const pl = +(payout - stake).toFixed(2)
    const newBalance = +(balanceRef.current + pl).toFixed(2)
    balanceRef.current = newBalance

    const trade = {
      id: Date.now(), result: win ? 'won' : 'lost',
      stake, payout, pl, market: settings.market,
      time: new Date().toLocaleTimeString(), price: chartData[chartData.length - 1]?.v
    }

    setTrades(prev => [trade, ...prev].slice(0, 50))
    setStats(prev => ({
      runs: prev.runs + 1,
      won: prev.won + (win ? 1 : 0),
      lost: prev.lost + (win ? 0 : 1),
      stake: +(prev.stake + stake).toFixed(2),
      payout: +(prev.payout + payout).toFixed(2),
    }))

    updateBalance(newBalance)
    try { await axios.post('/api/trades', { market: settings.market, stake, payout, result: win ? 'won' : 'lost', pl }) } catch {}
  }, [settings, chartData, updateBalance])

  const toggleRun = () => {
    if (running) {
      runRef.current = false
      clearInterval(intervalRef.current)
      setRunning(false)
    } else {
      runRef.current = true
      setRunning(true)
      intervalRef.current = setInterval(simulateTrade, 2500)
    }
  }

  useEffect(() => {
    if (running) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(simulateTrade, 2500)
    }
    return () => clearInterval(intervalRef.current)
  }, [simulateTrade, running])

  const current = chartData[chartData.length - 1]?.v || 1000
  const prev = chartData[chartData.length - 2]?.v || 1000
  const change = +(current - prev).toFixed(3)
  const pl = +(stats.payout - stats.stake).toFixed(2)
  const winRate = stats.runs ? Math.round((stats.won / stats.runs) * 100) : 0

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Live market & bot performance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right', marginRight: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BALANCE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--green)' }}>${Number(user?.balance || 10000).toFixed(2)}</div>
          </div>
          <button onClick={toggleRun} className={`btn ${running ? 'btn-danger' : 'btn-primary'}`} style={{ gap: 8, minWidth: 110 }}>
            {running ? <><Square size={14} /> Stop Bot</> : <><Play size={14} fill="currentColor" /> Run Bot</>}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Runs', value: stats.runs, icon: Activity, color: 'var(--blue)' },
          { label: 'Win Rate', value: winRate + '%', icon: Target, color: 'var(--green)' },
          { label: 'Total Staked', value: '$' + stats.stake.toFixed(2), icon: DollarSign, color: 'var(--amber)' },
          { label: 'Profit / Loss', value: (pl >= 0 ? '+$' : '-$') + Math.abs(pl).toFixed(2), icon: pl >= 0 ? TrendingUp : TrendingDown, color: pl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{label.toUpperCase()}</span>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Chart + Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Chart */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{settings.market}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{current.toFixed(3)}</span>
                <span style={{ fontSize: 12, color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(3)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Volatility 10 Index', 'Volatility 25 Index', 'Volatility 50 Index'].map(m => (
                <button key={m} onClick={() => setSettings(s => ({ ...s, market: m }))} className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, padding: '4px 10px', background: settings.market === m ? 'var(--green-dim)' : '', color: settings.market === m ? 'var(--green)' : '' }}>
                  {m.replace(' Index', '').replace('Volatility ', 'V')}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 0', height: 'calc(100% - 80px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <XAxis dataKey="t" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#3a4a6a' }} axisLine={false} tickLine={false} width={55} tickFormatter={v => v.toFixed(1)} />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={() => ''} formatter={v => [v.toFixed(3), 'Price']} />
                <Line type="monotoneX" dataKey="v" stroke="#00e676" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right panel */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Bot settings */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.08em' }}>BOT SETTINGS</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Stake per trade (USD)</label>
              <input className="input" type="number" min="0.35" max="100" step="0.5" value={settings.stake}
                onChange={e => setSettings(s => ({ ...s, stake: e.target.value }))}
                style={{ fontSize: 13 }} disabled={running} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Strategy</label>
              <select className="select" style={{ width: '100%' }} value={settings.strategy}
                onChange={e => setSettings(s => ({ ...s, strategy: e.target.value }))} disabled={running}>
                <option>Over/Under</option>
                <option>Even/Odd</option>
                <option>Rise/Fall</option>
                <option>Higher/Lower</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['summary', 'trades'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 500, background: 'none',
                border: 'none', borderBottom: `2px solid ${activeTab === t ? 'var(--green)' : 'transparent'}`,
                color: activeTab === t ? 'var(--green)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s'
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {activeTab === 'summary' && (
              <div>
                {[
                  { label: 'Contracts won', value: stats.won, color: 'var(--green)' },
                  { label: 'Contracts lost', value: stats.lost, color: 'var(--red)' },
                  { label: 'Win rate', value: winRate + '%', color: winRate >= 50 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Total staked', value: '$' + stats.stake.toFixed(2), color: 'var(--text-primary)' },
                  { label: 'Total payout', value: '$' + stats.payout.toFixed(2), color: 'var(--text-primary)' },
                  { label: 'Net P/L', value: (pl >= 0 ? '+$' : '-$') + Math.abs(pl).toFixed(2), color: pl >= 0 ? 'var(--green)' : 'var(--red)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-display)', color }}>{value}</span>
                  </div>
                ))}
                {!running && stats.runs === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <Zap size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    Hit Run Bot to start trading
                  </div>
                )}
              </div>
            )}
            {activeTab === 'trades' && (
              <div>
                {trades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No trades yet</div>
                ) : trades.map(trade => (
                  <div key={trade.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <span className={trade.result === 'won' ? 'tag-green' : 'tag-red'} style={{ fontSize: 10 }}>{trade.result.toUpperCase()}</span>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{trade.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: trade.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {trade.pl >= 0 ? '+' : ''}{trade.pl.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>stake: ${trade.stake}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}
              onClick={() => { setStats({ runs: 0, won: 0, lost: 0, stake: 0, payout: 0 }); setTrades([]) }}>
              Reset stats
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
