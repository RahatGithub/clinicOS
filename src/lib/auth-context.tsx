'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { demoUsers } from '@/lib/data'
import type { DemoUser } from '@/types'

const SESSION_KEY = 'clinicos_session'

interface AuthContextValue {
  user: DemoUser | null
  isLoading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as DemoUser
        // Validate it matches a real demo user
        const match = demoUsers.find((u) => u.id === parsed.id)
        if (match) setUser(match)
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const match = demoUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )
      if (!match) return { success: false, error: 'Invalid credentials' }
      setUser(match)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(match))
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
