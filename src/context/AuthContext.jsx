import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accountType, setAccountType] = useState('demo')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedAccountType = localStorage.getItem('accountType')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      setAccountType(storedAccountType || 'demo')
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('accountType')
    setUser(null)
    setAccountType('demo')
  }

  const updateBalance = (newBalance) => {
    setUser(u => u ? { ...u, balance: newBalance } : null)
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      localStorage.setItem('user', JSON.stringify({ ...parsed, balance: newBalance }))
    }
  }

  const switchAccountType = (type) => {
    setAccountType(type)
    localStorage.setItem('accountType', type)
    if (type === 'demo') {
      setUser(u => u ? { ...u, balance: 10000, accountType: 'demo' } : null)
    }
  }

  const updateUser = (updates) => {
    setUser(u => u ? { ...u, ...updates } : null)
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      localStorage.setItem('user', JSON.stringify({ ...parsed, ...updates }))
    }
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      }
    } catch (e) { console.error(e) }
  }

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, updateBalance, loading, accountType, 
      switchAccountType, updateUser, refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
