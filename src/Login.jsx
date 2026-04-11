import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 60% 20%, rgba(0,230,118,0.05) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--green)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
          }}>
            <Zap size={26} color="#000" fill="#000" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--green)', letterSpacing: 2 }}>TRADEBOT PRO</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Algorithmic trading, simplified</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Log in to access your trading bots</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'var(--red-dim)', border: '1px solid rgba(255,61,87,0.3)',
              borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--red)'
            }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} /> Email address
              </label>
              <input className="input" name="email" type="email" placeholder="you@email.com"
                value={form.email} onChange={handle} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} /> Password
              </label>
              <input className="input" name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={handle} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 44, fontSize: 15 }}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            No account? <Link to="/register" style={{ color: 'var(--green)', fontWeight: 500 }}>Create one free</Link>
          </p>

          <div style={{ marginTop: 20, padding: '12px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--amber)' }}>Demo:</span> demo@test.com / password123
          </div>
        </div>
      </div>
    </div>
  )
}
