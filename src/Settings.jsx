import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { 
  User, Mail, Lock, Bell, Shield, CreditCard, 
  Check, X, ChevronRight, AlertTriangle, Upload,
  Camera, FileText, Eye, EyeOff, BadgeCheck
} from 'lucide-react'
import axios from 'axios'

export default function Settings() {
  const { user, updateUser, refreshUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })
  
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  
  const [notifications, setNotifications] = useState({
    email: true,
    tradeAlerts: true,
    priceAlerts: true,
    marketing: false
  })

  const [kyc, setKyc] = useState({
    status: user?.kycStatus || 'none',
    submittedAt: null,
    verifiedAt: null
  })

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    loadKycStatus()
  }, [])

  const loadKycStatus = async () => {
    try {
      const res = await axios.get('/api/users/kyc/status')
      setKyc(res.data)
    } catch (e) { console.error(e) }
  }

  const handleProfileSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await axios.put('/api/users/profile', profile)
      updateUser({ name: profile.name, email: profile.email })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to update profile' })
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (password.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await axios.post('/api/users/change-password', {
        currentPassword: password.current,
        newPassword: password.new
      })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPassword({ current: '', new: '', confirm: '' })
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to change password' })
    }
    setSaving(false)
  }

  const handleNotificationSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/users/notifications', notifications)
      setMessage({ type: 'success', text: 'Preferences saved!' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    }
    setSaving(false)
  }

  const startKyc = () => {
    setKyc({ ...kyc, status: 'pending' })
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'kyc', label: 'Verification', icon: BadgeCheck },
    { id: 'legal', label: 'Legal', icon: FileText }
  ]

  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', gap: 20, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: activeTab === tab.id ? 'var(--bg-2)' : 'transparent',
                border: 'none', borderRadius: 8, color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 500
              }}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {message && (
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 16,
            background: message.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
            color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Profile Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Full Name</label>
                <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email Address</label>
                <input className="input" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Account Type</label>
                <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 8, fontSize: 14 }}>
                  {user?.accountType === 'demo' ? 'Demo Account' : 'Real Trading Account'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Member Since</label>
                <div style={{ padding: 10, background: 'var(--bg-2)', borderRadius: 8, fontSize: 14 }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <button onClick={handleProfileSave} disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword.current ? 'text' : 'password'} value={password.current}
                    onChange={e => setPassword({ ...password, current: e.target.value })} />
                  <button onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword.new ? 'text' : 'password'} value={password.new}
                    onChange={e => setPassword({ ...password, new: e.target.value })} />
                  <button onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword.confirm ? 'text' : 'password'} value={password.confirm}
                    onChange={e => setPassword({ ...password, confirm: e.target.value })} />
                  <button onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button onClick={handlePasswordChange} disabled={saving || !password.current || !password.new} 
                className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Two-Factor Authentication</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-2)', borderRadius: 8, maxWidth: 400 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>2FA Status</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add an extra layer of security</div>
                </div>
                <span className="tag-red">Not Enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Notification Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive important updates via email' },
                { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Get notified when trades expire' },
                { key: 'priceAlerts', label: 'Price Alerts', desc: 'Receive price target notifications' },
                { key: 'marketing', label: 'Marketing Emails', desc: 'Promotions and platform updates' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-2)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                    <input type="checkbox" checked={notifications[item.key]} onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: notifications[item.key] ? 'var(--green)' : 'var(--bg-3)',
                      borderRadius: 24, transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute', top: 2, left: notifications[item.key] ? 22 : 2,
                        width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: '0.2s'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
              <button onClick={handleNotificationSave} disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Payment Methods</h3>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Bank Cards</h4>
              <div style={{ padding: 20, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}>
                <CreditCard size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Add a new card</div>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Crypto Wallets</h4>
              <div style={{ padding: 20, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}>
                <Upload size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Connect a crypto wallet</div>
              </div>
            </div>
          </div>
        )}

        {/* KYC Verification Tab */}
        {activeTab === 'kyc' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Identity Verification</h3>
            
            {kyc.status === 'none' && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <BadgeCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <h4 style={{ fontSize: 16, marginBottom: 8 }}>Verify Your Identity</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                  Complete identity verification to unlock full trading features and enable withdrawals.
                </p>
                <button onClick={startKyc} className="btn btn-primary">Start Verification</button>
              </div>
            )}

            {kyc.status === 'pending' && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Clock size={28} color="var(--amber)" />
                </div>
                <h4 style={{ fontSize: 16, marginBottom: 8 }}>Verification In Progress</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Your documents are being reviewed. This usually takes 1-2 business days.
                </p>
                <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 8, maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status</span>
                    <span style={{ fontSize: 13, color: 'var(--amber)' }}>Pending Review</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Submitted</span>
                    <span style={{ fontSize: 13 }}>Just now</span>
                  </div>
                </div>
              </div>
            )}

            {kyc.status === 'verified' && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Check size={28} color="var(--green)" />
                </div>
                <h4 style={{ fontSize: 16, marginBottom: 8, color: 'var(--green)' }}>Identity Verified</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Your account is fully verified. You can now trade and withdraw funds.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Legal Tab */}
        {activeTab === 'legal' && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Legal Documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Terms of Service', date: 'Updated Jan 2024' },
                { title: 'Privacy Policy', date: 'Updated Jan 2024' },
                { title: 'Risk Warning', date: 'Updated Jan 2024' },
                { title: 'AML Policy', date: 'Updated Jan 2024' }
              ].map(doc => (
                <div key={doc.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-2)', borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileText size={18} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.date}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 24, padding: 16, background: 'var(--red-dim)', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="var(--red)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Risk Warning</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Trading involves significant risk. You may lose your entire investment. 
                    This platform is for demo purposes only.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
