import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, AlertCircle, CheckCircle, MailOpen, RotateCcw } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('register') // 'register' | 'verify' | 'success'
  const [userId, setUserId] = useState(null)
  const [resending, setResending] = useState(false)
  const navigate = useNavigate()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      
      setUserId(data.userId)
      setStep('verify')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const verifyEmail = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed')
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setStep('success')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const resendCode = async () => {
    setError(''); setResending(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Resend failed')
      setUserId(data.userId)
      alert('Verification code sent! Check server console.')
    } catch (err) {
      setError(err.message)
    } finally { setResending(false) }
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)' }}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--green)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>Email Verified!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MailOpen size={28} color="#000" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Verify your email</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
              We've sent a verification code to<br />
              <strong>{form.email}</strong>
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={verifyEmail}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Verification Code</label>
              <input className="input" type="text" placeholder="Enter 6-digit code" value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ fontSize: 20, textAlign: 'center', letterSpacing: '0.3em', fontWeight: 600 }} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || verificationCode.length !== 6} style={{ width: '100%', height: 44 }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Didn't receive the code?</p>
            <button onClick={resendCode} disabled={resending} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={12} /> {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'var(--green)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Zap size={26} color="#000" fill="#000" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--green)', letterSpacing: 2 }}>TRADEBOT PRO</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Create your account</div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Register</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>You'll receive a verification code via email</p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(255,61,87,0.3)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} /> Full name
              </label>
              <input className="input" name="name" type="text" placeholder="John Doe" value={form.name} onChange={handle} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} /> Email address
              </label>
              <input className="input" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handle} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} /> Password
              </label>
              <input className="input" name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required minLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', height: 44, fontSize: 15 }}>
              {loading ? 'Creating account...' : 'Create Account'}
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
