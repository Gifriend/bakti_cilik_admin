"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { type User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log("Attempting login with:", email) // Debug log
      await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful") // Debug log
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  useEffect(() => {
    console.log("Setting up auth listener") // Debug log
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user?.email || "No user") // Debug log
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
  }

  console.log("AuthProvider rendering, loading:", loading, "user:", user?.email) // Debug log

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
