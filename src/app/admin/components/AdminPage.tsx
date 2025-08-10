"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import AdminDashboard from "@/app/admin/components/admin-dashboard"
import LoginForm from "@/app/login/components/LoginForm"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // You can add admin role checking logic here
    // For now, we'll assume any logged-in user can be admin
    if (user) {
      setIsAdmin(true)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
