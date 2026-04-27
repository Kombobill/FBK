import { Link } from 'react-router-dom'
import { Zap, TrendingUp, Shield, Bot, BarChart3, Users } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', position: 'absolute', width: '100%', top: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'var(--green)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#000" fill="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--green)', letterSpacing: 2 }}>INSIDERX</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </header>

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 40px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: 'var(--green-dim)', borderRadius: 20, fontSize: 12, color: 'var(--green)', marginBottom: 24, fontWeight: 500 }}>
            ✓ Automated Trading Platform
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 24, background: 'linear-gradient(135deg, #fff 0%, #8b949e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trade Like an<br />Insider
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>
            Access elite trading insights. Execute trades with precision. Be part of the inner circle.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ height: 50, padding: '0 32px', fontSize: 16 }}>Start Trading Free</Link>
            <a href="#features" className="btn btn-ghost" style={{ height: 50, padding: '0 32px', fontSize: 16 }}>See How It Works</a>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>No credit card required · $10,000 demo account</p>
        </div>
      </section>

      <section id="features" style={{ padding: '80px 40px', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>Everything You Need to Trade</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 40 }}>
            {[{icon:Bot, title:'Insider Signals', desc:'Get exclusive trading signals'},{icon:BarChart3, title:'Live Charts', desc:'Real-time market data with indicators'},{icon:TrendingUp, title:'Quick Trades', desc:'Fast execution on global markets'},{icon:Shield, title:'Risk Controls', desc:'Set your limits, trade safe'},{icon:Zap, title:'Instant Access', desc:'Start trading in seconds'},{icon:Users, title:'Track Record', desc:'Full trade history & analytics'}].map(x => (
              <div key={x.title} className="card" style={{ padding: 28 }}>
                <div style={{ width: 48, height: 48, background: 'var(--green-dim)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <x.icon size={22} color="var(--green)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{x.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{x.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>Ready to Start?</h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>Create free account with $10,000 demo funds.</p>
        <Link to="/register" className="btn btn-primary" style={{ height: 50, padding: '0 40px', fontSize: 16 }}>Create Free Account</Link>
      </section>
    </div>
  )
}
