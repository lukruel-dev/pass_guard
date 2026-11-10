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
    // 1. Obter usuário atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })

    // 2. Escutar eventos de auth (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
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

