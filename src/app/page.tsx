"use client"

import { useAuth } from "@/contexts/auth-context"
import LoginForm from "@/components/login-form"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><LoginForm /></div>
  )
}
