// "use client"

// import type React from "react"
// import { useAuth } from "@/contexts/auth-context"
// import { useRouter } from "next/navigation"
// import { useEffect, useState } from "react"
// import { Loader2 } from "lucide-react"

// interface AuthGuardProps {
//   children: React.ReactNode
//   requireAuth?: boolean
//   redirectTo?: string
// }

// export function AuthGuard({ children, requireAuth = true, }: AuthGuardProps) {
//   const { user, loading } = useAuth()
//   const router = useRouter()
//   const [shouldRender, setShouldRender] = useState(false)

//   useEffect(() => {
//     if (!loading) {
//       if (requireAuth && !user) {
//         router.push("/login")
//         setShouldRender(false)
//       } else if (!requireAuth && user) {
//         router.push("/growth-stats")
//         setShouldRender(false)
//       } else {
//         setShouldRender(true)
//       }
//     }
//   }, [user, loading, requireAuth, router])

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin" />
//         <span className="ml-2">Loading...</span>
//       </div>
//     )
//   }

//   if (!shouldRender) {
//     return null
//   }

//   return <>{children}</>
// }
