const API_BASE = import.meta.env.VITE_API_URL || ''

export const API = {
  base: API_BASE,
  
  auth: {
    login: `${API_BASE}/api/auth/login`,
    register: `${API_BASE}/api/auth/register`,
    verifyEmail: `${API_BASE}/api/auth/verify-email`,
    resendVerification: `${API_BASE}/api/auth/resend-verification`,
  },
  
  users: {
    me: `${API_BASE}/api/users/me`,
    profile: `${API_BASE}/api/users/profile`,
    wallet: `${API_BASE}/api/users/wallet`,
    deposits: `${API_BASE}/api/users/deposits`,
    withdrawals: `${API_BASE}/api/users/withdrawals`,
    deposit: `${API_BASE}/api/users/deposit`,
    withdraw: `${API_BASE}/api/users/withdraw`,
    resetBalance: `${API_BASE}/api/users/reset-balance`,
    changePassword: `${API_BASE}/api/users/change-password`,
    notifications: `${API_BASE}/api/users/notifications`,
    kycStatus: `${API_BASE}/api/users/kyc/status`,
    kycStart: `${API_BASE}/api/users/kyc/start`,
  },
  
  trades: {
    list: `${API_BASE}/api/trades`,
    stats: `${API_BASE}/api/trades/stats`,
  },
  
  contracts: {
    list: `${API_BASE}/api/contracts`,
    create: `${API_BASE}/api/contracts`,
  },
  
  markets: {
    list: `${API_BASE}/api/markets`,
    types: `${API_BASE}/api/trade/types`,
    durations: `${API_BASE}/api/trade/durations`,
  },
  
  price: (symbol) => `${API_BASE}/api/price/${symbol}`,
  chat: {
    messages: `${API_BASE}/api/chat/messages`,
    message: `${API_BASE}/api/chat/message`,
  },
  alerts: `${API_BASE}/api/alerts`,
  health: `${API_BASE}/api/health`,
}

export const getApiUrl = (path) => `${API_BASE}${path}`