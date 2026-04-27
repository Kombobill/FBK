import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './Landing'
import Login from './Login'
import Register from './Register'
import TradingView from './TradingView'
import Portfolio from './Portfolio'
import Analytics from './Analytics'
import Alerts from './Alerts'
import Settings from './Settings'
import Legal from './Legal'
import { Zap, LayoutDashboard, BarChart, Bell, Settings as SettingsIcon, FileText, LogOut } from 'lucide-react'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-0)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout({ children, activeView, setActiveView }) {
  const { user, switchAccountType, logout, accountType } = useAuth()
  
  const navItems = [
    { id: 'trade', icon: Zap, label: 'Trade' },
    { id: 'portfolio', icon: LayoutDashboard, label: 'Portfolio' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'legal', icon: FileText, label: 'Legal' },
  ]

  const renderView = () => {
    switch (activeView) {
      case 'portfolio':
        return <Portfolio />
      case 'analytics':
        return <Analytics />
      case 'alerts':
        return <Alerts />
      case 'settings':
        return <Settings />
      case 'legal':
        return <Legal />
      default:
        return children
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 72, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '12px 8px' }}>
        <div style={{ padding: '8px 0', marginBottom: 16, textAlign: 'center' }}>
          <Zap size={24} color="var(--green)" />
        </div>
        
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveView(item.id)}
            style={{
              width: '100%', padding: '12px 0', border: 'none', background: activeView === item.id ? 'var(--green)' : 'transparent',
              borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: activeView === item.id ? '#000' : 'var(--text-muted)', marginBottom: 4, transition: 'all 0.15s'
            }}>
            <item.icon size={20} />
            <span style={{ fontSize: 9 }}>{item.label}</span>
          </button>
        ))}
        
        <div style={{ flex: 1 }} />
        
        <button onClick={logout} style={{
          width: '100%', padding: '12px 0', border: 'none', background: 'transparent', borderRadius: 10,
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--text-muted)'
        }}>
          <LogOut size={20} />
          <span style={{ fontSize: 9 }}>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { switchAccountType('demo'); setActiveView('trade') }} className={`btn btn-sm ${accountType === 'demo' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> Demo
            </button>
            <button onClick={() => { switchAccountType('real'); setActiveView('trade') }} className={`btn btn-sm ${accountType === 'real' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>💼</span> Real
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {accountType === 'demo' ? 'Demo Balance' : 'Real Account'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: accountType === 'demo' ? 'var(--green)' : 'var(--amber)' }}>
              {accountType === 'demo' ? `$${Number(user?.balance || 10000).toFixed(2)}` : 'Trading'}
            </div>
          </div>
        </div>

        {/* View Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderView()}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState('trade')
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <TradingView />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <Portfolio />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <Analytics />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <Alerts />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/legal" element={
        <ProtectedRoute>
          <AppLayout activeView={activeView} setActiveView={setActiveView}>
            <Legal />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
