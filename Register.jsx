import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 60% 20%, rgba(0,230,118,0.05) 0%, transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-in">
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
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Start trading with $10,000 demo funds</p>

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
                <User size={12} /> Full name
              </label>
              <input className="input" name="name" type="text" placeholder="John Doe"
                value={form.name} onChange={handle} required />
            </div>
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
                value={form.password} onChange={handle} required minLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 44, fontSize: 15 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 500 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}