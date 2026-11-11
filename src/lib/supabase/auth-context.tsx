"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { User, SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "./client"

interface AuthContextType {
  supabase: SupabaseClient
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hasAuthCode = typeof window !== "undefined" && (
      window.location.search.includes("code=") || 
      window.location.hash.includes("access_token=")
    )

    // 1. Obter sessão instantânea do cache local
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setIsLoading(false)
      } else if (!hasAuthCode) {
        setUser(null)
        setIsLoading(false)
      }
    }).catch(() => {
      if (!hasAuthCode) setIsLoading(false)
    })

    // Timeout de segurança caso o code seja inválido ou o redirecionamento demore
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 4000)

    // 2. Escutar eventos de auth (login, logout, token refresh, OAuth)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
      clearTimeout(timeout)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    if (typeof window !== "undefined") {
      if (user?.id) {
        localStorage.removeItem(`passguard_2fa_verified_${user.id}`)
        localStorage.removeItem(`passguard_pending_2fa_secret_${user.id}`)
        localStorage.removeItem(`passguard_setup_step_${user.id}`)
      }
      sessionStorage.removeItem("passguard_2fa_verified")
      localStorage.removeItem("passguard_auth_step")
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = useMemo(() => ({
    supabase,
    user,
    isLoading,
    signOut
  }), [supabase, user, isLoading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider")
  }
  return context
}

export function useSupabase() {
  return useAuthContext().supabase
}

export function useUser() {
  const { user, isLoading } = useAuthContext()
  return { user, isUserLoading: isLoading }
}

