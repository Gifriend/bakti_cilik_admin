"use client"

import { useAuth } from "@/contexts/auth-context"
import LoginForm from "@/components/login-form"
import AdminInterface from "@/components/admin-interface"

export default function Home() {
  const { user, loading } = useAuth()

  console.log("Home page - loading:", loading, "user:", user?.email) // Debug log

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <AdminInterface /> : <LoginForm />
}
