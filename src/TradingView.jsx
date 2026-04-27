import { useState, useEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  ChevronUp, ChevronDown, RefreshCw, MessageCircle, X, Send, 
  Briefcase, HelpCircle, Wallet, ArrowUpRight, ArrowDownLeft, History, Zap
} from 'lucide-react'
import axios from 'axios'

export default function TradingView() {
  const { user, updateBalance, accountType } = useAuth()
  const [markets, setMarkets] = useState([])
  const [tradeTypes, setTradeTypes] = useState([])
  const [durations, setDurations] = useState({})
  
  const [selectedCategory, setSelectedCategory] = useState('forex')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [selectedTradeType, setSelectedTradeType] = useState('rise-fall')
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [selectedDurationType, setSelectedDurationType] = useState('ticks')
  const [stake, setStake] = useState(10)
  
  const [price, setPrice] = useState(1000)
  const [chartData, setChartData] = useState([])
  const [contracts, setContracts] = useState([])
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState({ runs: 0, won: 0, lost: 0, stake: 0, payout: 0 })
  
  const [buying, setBuying] = useState(false)
  const [priceInterval, setPriceInterval] = useState(null)

  const priceRef = useRef(null)

  useEffect(() => {
    loadMarkets()
    loadTradeTypes()
    loadDurations()
    loadContracts()
    loadTrades()
  }, [])

  useEffect(() => {
    if (selectedAsset) {
      startPriceStream()
    }
    return () => stopPriceStream()
  }, [selectedAsset])

  const loadMarkets = async () => {
    try {
      const res = await axios.get('/api/markets')
      setMarkets(res.data)
      if (res.data.length > 0) {
        setSelectedCategory('forex')
        const cat = res.data.find(c => c.id === 'forex')
        if (cat && cat.assets.length > 0) {
          setSelectedAsset(cat.assets[0].id)
        }
      }
    } catch (e) { console.error(e) }
  }

  const loadTradeTypes = async () => {
    try {
      const res = await axios.get('/api/trade/types')
      setTradeTypes(res.data)
    } catch (e) { console.error(e) }
  }

  const loadDurations = async () => {
    try {
      const res = await axios.get('/api/trade/durations')
      const durMap = {}
      res.data.forEach(d => durMap[d.id] = d)
      setDurations(durMap)
      setSelectedDurationType('ticks')
      setSelectedDuration(5)
    } catch (e) { console.error(e) }
  }

  const loadContracts = async () => {
    try {
      const res = await axios.get('/api/contracts')
      setContracts(res.data)
    } catch (e) { console.error(e) }
  }

  const loadTrades = async () => {
    try {
      const res = await axios.get('/api/trades?limit=50')
      setTrades(res.data)
      const settled = res.data.filter(t => t.status === 'settled')
      setStats({
        runs: settled.length,
        won: settled.filter(t => t.result === 'won').length,
        lost: settled.filter(t => t.result === 'lost').length,
        stake: settled.reduce((s, t) => s + t.stake, 0),
        payout: settled.reduce((s, t) => s + (t.payout || 0), 0)
      })
    } catch (e) { console.error(e) }
  }

  const startPriceStream = async () => {
    stopPriceStream()
    if (!selectedAsset) return
    
    try {
      const res = await axios.get(`/api/price/${selectedAsset}`)
      setPrice(res.data.price)
      initChart(res.data.price)
    } catch (e) { console.error(e) }

    priceRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/price/${selectedAsset}`)
        setPrice(res.data.price)
        updateChart(res.data.price)
      } catch (e) {}
    }, 500)
    setPriceInterval(priceRef.current)
  }

  const stopPriceStream = () => {
    if (priceRef.current) {
      clearInterval(priceRef.current)
      priceRef.current = null
    }
  }

  const initChart = (initialPrice) => {
    let p = initialPrice
    const data = []
    for (let i = 60; i >= 0; i--) {
      p = p + (Math.random() - 0.5) * (p * 0.001)
      data.push({ t: i, v: +p.toFixed(4) })
    }
    setChartData(data)
  }

  const updateChart = (newPrice) => {
    setChartData(prev => {
      const last = prev[prev.length - 1].v
      const next = +((last + (newPrice - last) * 0.3).toFixed(4))
      const newData = [...prev.slice(-79), { t: Date.now(), v: next }]
      return newData
    })
  }

  const buyContract = async (direction) => {
    if (buying || !selectedAsset) return
    setBuying(true)
    try {
      const res = await axios.post('/api/contracts', {
        symbol: selectedAsset,
        tradeType: selectedTradeType,
        direction,
        stake,
        duration: selectedDuration,
        durationType: selectedDurationType
      })
      
      updateBalance(res.data.balance)
      setContracts(prev => [...prev, res.data.contract])
      
      setTimeout(async () => {
        try {
          const settleRes = await axios.post(`/api/contracts/${res.data.contract.id}/expire`)
          updateBalance(settleRes.data.balance)
          setContracts(prev => prev.filter(c => c.id !== res.data.contract.id))
          loadTrades()
        } catch (e) {}
      }, getDurationMs(selectedDuration, selectedDurationType))
      
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to place trade')
    } finally {
      setBuying(false)
    }
  }

  const getDurationMs = (duration, type) => {
    const ms = { ticks: 100, seconds: 1000, minutes: 60000, hours: 3600000 }
    return duration * (ms[type] || 1000)
  }

  const currentCategory = markets.find(m => m.id === selectedCategory)
  const currentAsset = currentCategory?.assets.find(a => a.id === selectedAsset)
  const currentTradeType = tradeTypes.find(t => t.id === selectedTradeType)
  const currentDuration = durations[selectedDurationType]

  const pl = +(stats.payout - stats.stake).toFixed(2)
  const winRate = stats.runs ? Math.round((stats.won / stats.runs) * 100) : 0

  const potentialPayout = stake * (currentTradeType?.multiplier || 1.85)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)

  const [showWallet, setShowWallet] = useState(false)
  const [walletData, setWalletData] = useState({ demoBalance: 10000, realBalance: 0, deposits: [], withdrawals: [] })
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadWallet = async () => {
    try {
      const res = await axios.get('/api/users/wallet')
      setWalletData(res.data)
    } catch (e) { console.error(e) }
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    setProcessing(true)
    try {
      const res = await axios.post('/api/users/deposit', { amount: depositAmount, method: 'bank_transfer' })
      setWalletData(prev => ({
        ...prev,
        realBalance: res.data.balance,
        deposits: [...prev.deposits, res.data.deposit]
      }))
      setDepositAmount('')
      alert(res.data.message)
    } catch (e) { alert(e.response?.data?.message || 'Deposit failed') }
    setProcessing(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    setProcessing(true)
    try {
      const res = await axios.post('/api/users/withdraw', { amount: withdrawAmount, method: 'bank_transfer' })
      setWalletData(prev => ({
        ...prev,
        realBalance: res.data.balance,
        withdrawals: [...prev.withdrawals, res.data.withdrawal]
      }))
      setWithdrawAmount('')
      alert(res.data.message)
    } catch (e) { alert(e.response?.data?.message || 'Withdrawal failed') }
    setProcessing(false)
  }

  const loadChatMessages = async () => {
    try {
      const res = await axios.get('/api/chat/messages')
      setChatMessages(res.data)
    } catch (e) { console.error(e) }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || sending) return
    setSending(true)
    try {
      const res = await axios.post('/api/chat/message', { message: chatInput })
      setChatMessages(prev => [...prev, ...res.data])
      setChatInput('')
    } catch (e) { console.error(e) }
    setSending(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, height: '100%' }}>
      {/* Left panel - Chart & Asset selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Asset selector */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {markets.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`btn btn-ghost btn-sm ${selectedCategory === cat.id ? 'btn-primary' : ''}`}
                style={{ fontSize: 11, padding: '6px 12px', background: selectedCategory === cat.id ? 'var(--green)' : '', color: selectedCategory === cat.id ? '#000' : '' }}>
                {cat.name}
              </button>
            ))}
          </div>
          {currentCategory && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {currentCategory.assets.map(asset => (
                <button key={asset.id} onClick={() => setSelectedAsset(asset.id)} className="btn btn-sm"
                  style={{ fontSize: 11, padding: '6px 12px', background: selectedAsset === asset.id ? 'var(--bg-3)' : '', border: selectedAsset === asset.id ? '1px solid var(--green)' : '1px solid var(--border)' }}>
                  {asset.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price chart */}
        <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{currentAsset?.name || 'Select asset'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{price.toFixed(currentAsset?.pip < 0.01 ? 4 : 2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {currentDuration?.options?.slice(0, 4).map(d => (
                <button key={d} onClick={() => setSelectedDuration(d)} className="btn btn-ghost btn-sm"
                  style={{ fontSize: 10, padding: '4px 8px', background: selectedDuration === d ? 'var(--bg-3)' : '' }}>
                  {d} {selectedDurationType === 'ticks' ? 't' : ''}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: '8px 0', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <XAxis dataKey="t" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#3a4a6a' }} axisLine={false} tickLine={false} width={55} tickFormatter={v => v.toFixed(1)} />
                <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={() => ''} formatter={v => [v.toFixed(4), 'Price']} />
                <Line type="monotoneX" dataKey="v" stroke="#00e676" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right panel - Trade interface */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Trade type selector */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Trade Type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tradeTypes.map(t => (
              <button key={t.id} onClick={() => setSelectedTradeType(t.id)} className="btn btn-sm"
                style={{ fontSize: 10, padding: '6px 10px', background: selectedTradeType === t.id ? 'var(--green)' : '', color: selectedTradeType === t.id ? '#000' : '' }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Stake */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Duration Type</div>
              <select className="select" style={{ width: '100%', fontSize: 12 }} value={selectedDurationType}
                onChange={e => { setSelectedDurationType(e.target.value); setSelectedDuration(durations[e.target.value]?.options?.[0] || 5) }}>
                {Object.keys(durations).map(k => (
                  <option key={k} value={k}>{durations[k]?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Duration</div>
              <select className="select" style={{ width: '100%', fontSize: 12 }} value={selectedDuration}
                onChange={e => setSelectedDuration(parseInt(e.target.value))}>
                {currentDuration?.options?.map(d => (
                  <option key={d} value={d}>{d} {selectedDurationType === 'ticks' ? 'ticks' : selectedDurationType === 'seconds' ? 's' : selectedDurationType === 'minutes' ? 'm' : 'h'}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Stake (USD)</div>
            <input className="input" type="number" min="0.35" max="10000" step="0.5" value={stake}
              onChange={e => setStake(e.target.value)} style={{ fontSize: 14, fontWeight: 600 }} />
          </div>
          <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-2)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Potential payout</span>
              <span style={{ fontWeight: 600, color: 'var(--green)' }}>${potentialPayout.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Multiplier</span>
              <span style={{ fontWeight: 600 }}>{currentTradeType?.multiplier || 1.85}x</span>
            </div>
          </div>
        </div>

        {/* Buy buttons */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <button onClick={() => buyContract('rise')} disabled={buying || !selectedAsset}
              style={{ padding: 20, border: 'none', background: 'var(--green)', color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ChevronUp size={20} /> BUY RISE
            </button>
            <button onClick={() => buyContract('fall')} disabled={buying || !selectedAsset}
              style={{ padding: 20, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ChevronDown size={20} /> BUY FALL
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ padding: 12, background: 'var(--bg-1)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>TRADES</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{stats.runs}</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-1)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>WIN</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)' }}>{winRate}%</div>
          </div>
          <div style={{ padding: 12, background: 'var(--bg-1)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>P/L</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{pl >= 0 ? '+' : ''}${pl}</div>
          </div>
        </div>

        {/* Recent trades */}
        <div className="card" style={{ flex: 1, padding: 12, overflow: 'auto', minHeight: 150 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recent Trades</div>
          {trades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No trades yet</div>
          ) : (
            trades.slice(0, 10).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span className={t.result === 'won' ? 'tag-green' : 'tag-red'} style={{ fontSize: 9 }}>{t.result?.toUpperCase()}</span>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.symbol}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {t.pl >= 0 ? '+' : ''}{t.pl?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>${t.stake}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Support Popup */}
      {showChat && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, width: 360, height: 480,
          background: 'var(--bg-0)', borderRadius: 16, border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
          zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#000' }}>
              <MessageCircle size={18} />
              <span style={{ fontWeight: 600 }}>Support Chat</span>
            </div>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                <HelpCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div>Start a conversation</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Our AI assistant is here to help</div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                  background: msg.sender === 'user' ? 'var(--green)' : msg.sender === 'support' ? 'var(--blue)' : 'var(--bg-2)',
                  color: msg.sender === 'user' ? '#000' : 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.4
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {msg.sender === 'ai' ? 'AI Assistant' : msg.sender === 'support' ? 'Support' : 'You'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Type your message..." value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              style={{ flex: 1 }} />
            <button onClick={sendChatMessage} className="btn btn-primary" style={{ padding: '8px 12px' }} disabled={sending}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Wallet Popup */}
      {showWallet && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, width: 400, height: 520,
          background: 'var(--bg-0)', borderRadius: 16, border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column',
          zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#000' }}>
              <Wallet size={18} />
              <span style={{ fontWeight: 600 }}>Wallet</span>
            </div>
            <button onClick={() => setShowWallet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 14, background: 'var(--green-dim)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Demo Balance</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>${walletData.demoBalance?.toFixed(2)}</div>
              </div>
              <div style={{ padding: 14, background: 'var(--amber-dim)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Real Balance</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)' }}>${walletData.realBalance?.toFixed(2)}</div>
              </div>
            </div>

            {/* Deposit Form */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowDownLeft size={12} /> Deposit Funds
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="number" placeholder="Amount ($10 - $50,000)" value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)} style={{ flex: 1 }} />
                <button onClick={handleDeposit} className="btn btn-primary" disabled={processing || !depositAmount}>
                  Deposit
                </button>
              </div>
            </div>

            {/* Withdraw Form */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpRight size={12} /> Withdraw Funds
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="number" placeholder="Amount (min $10)" value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)} style={{ flex: 1 }} />
                <button onClick={handleWithdraw} className="btn btn-danger" disabled={processing || !withdrawAmount}>
                  Withdraw
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={12} /> Recent Transactions
              </div>
              {walletData.deposits?.length === 0 && walletData.withdrawals?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                  No transactions yet
                </div>
              ) : (
                <>
                  {walletData.deposits?.slice(-3).reverse().map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowDownLeft size={12} color="var(--green)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12 }}>Deposit</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(d.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>+${d.amount}</div>
                    </div>
                  ))}
                  {walletData.withdrawals?.slice(-3).reverse().map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ArrowUpRight size={12} color="var(--red)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12 }}>Withdrawal</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>-${w.amount}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
