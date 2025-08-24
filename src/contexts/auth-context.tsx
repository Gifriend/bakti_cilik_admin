"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/app/service/api" 
import Cookies from "js-cookie"

interface UserData {
  id: number
  email: string
  name: string
  role: "ADMIN" | "PEGAWAI" | "DOKTER" | "USER"
}

interface AuthContextType {
  user: UserData | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // ✅ ubah register → login
      const res = await api.post("/auth/login", { email, password })
      const { access_token, user } = res.data

      // simpan token di cookie
      Cookies.set("access_token", access_token, { secure: true, sameSite: "strict" })

      // simpan user di state
      setUser(user)
    } catch (error) {
      console.error("Login gagal:", error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    Cookies.remove("access_token")
    setUser(null)
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get("access_token")
        if (token) {
          const res = await api.get("/auth/me") // backend return payload user
          setUser(res.data)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const value: AuthContextType = { user, login, logout, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
