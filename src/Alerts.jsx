import { useState, useEffect } from 'react'
import { 
  Bell, BellOff, Trash2, Plus, AlertTriangle, 
  TrendingUp, TrendingDown, Check, X, Clock
} from 'lucide-react'
import axios from 'axios'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [markets, setMarkets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newAlert, setNewAlert] = useState({
    symbol: 'EUR/USD',
    condition: 'above',
    price: ''
  })

  useEffect(() => {
    loadAlerts()
    loadMarkets()
  }, [])

  const loadAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts')
      setAlerts(res.data)
    } catch (e) { console.error(e) }
  }

  const loadMarkets = async () => {
    try {
      const res = await axios.get('/api/markets')
      const allAssets = res.data.flatMap(cat => cat.assets)
      setMarkets(allAssets)
      if (allAssets.length > 0) {
        setNewAlert(prev => ({ ...prev, symbol: allAssets[0].id }))
      }
    } catch (e) { console.error(e) }
  }

  const createAlert = async () => {
    if (!newAlert.price) return
    setCreating(true)
    try {
      const res = await axios.post('/api/alerts', newAlert)
      setAlerts(prev => [...prev, res.data])
      setNewAlert({ ...newAlert, price: '' })
      setShowForm(false)
    } catch (e) { console.error(e) }
    setCreating(false)
  }

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`/api/alerts/${id}`)
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
  }

  const toggleAlert = async (id, active) => {
    try {
      await axios.put(`/api/alerts/${id}`, { active: !active })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !active } : a))
    } catch (e) { console.error(e) }
  }

  const activeAlerts = alerts.filter(a => a.active)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Price Alerts</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus size={14} /> New Alert
        </button>
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Create Price Alert</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Asset</label>
              <select className="select" value={newAlert.symbol} onChange={e => setNewAlert({ ...newAlert, symbol: e.target.value })}>
                {markets.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Condition</label>
              <select className="select" value={newAlert.condition} onChange={e => setNewAlert({ ...newAlert, condition: e.target.value })}>
                <option value="above">Price Above</option>
                <option value="below">Price Below</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Target Price</label>
              <input className="input" type="number" step="0.0001" placeholder="e.g. 1.0850" value={newAlert.price}
                onChange={e => setNewAlert({ ...newAlert, price: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button onClick={createAlert} disabled={creating || !newAlert.price} className="btn btn-primary" style={{ flex: 1 }}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <Bell size={20} color="var(--blue)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{activeAlerts.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Alerts</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <BellOff size={20} color="var(--text-muted)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{alerts.length - activeAlerts.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inactive Alerts</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <AlertTriangle size={20} color="var(--amber)" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 700 }}>{triggeredAlerts.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Triggered</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Your Alerts</h3>
        </div>
        {alerts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No alerts set</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Create an alert to get notified when prices hit your targets</div>
          </div>
        ) : (
          <div>
            {alerts.map(alert => (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: '1px solid var(--border)', background: alert.triggered ? 'var(--green-dim)' : 'transparent'
              }}>
                <button onClick={() => toggleAlert(alert.id, alert.active)} style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none',
                  background: alert.active ? 'var(--green)' : 'var(--bg-2)',
                  color: alert.active ? '#000' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {alert.active ? <Bell size={16} /> : <BellOff size={16} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{alert.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {alert.condition === 'above' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {' '}Alert when price is {alert.condition} ${alert.targetPrice}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {alert.triggered ? (
                    <span className="tag-green"><Check size={10} /> Triggered</span>
                  ) : alert.active ? (
                    <span className="tag-green">Active</span>
                  ) : (
                    <span className="tag-red">Inactive</span>
                  )}
                </div>
                <button onClick={() => deleteAlert(alert.id)} style={{
                  width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent',
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
