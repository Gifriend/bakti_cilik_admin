"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAllMothers, type User } from "@/lib/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Baby, LogOut, UserCheck } from "lucide-react"
import AddChildForm from "./add-child-form"
import ChildrenList from "./children-list"

export default function AdminInterface() {
  const [mothers, setMothers] = useState<User[]>([])
  const [selectedMother, setSelectedMother] = useState<User | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()

  useEffect(() => {
    loadMothers()
  }, [])

  const loadMothers = async () => {
    try {
      const mothersData = await getAllMothers()
      setMothers(mothersData)
    } catch (error) {
      console.error("Error loading mothers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const refreshData = () => {
    loadMothers()
    // Reset form
    setShowAddChild(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mothers data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Manage Children & Growth Records</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mothers List */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Mothers List
                </CardTitle>
                <CardDescription>Total: {mothers.length} mothers registered</CardDescription>
              </CardHeader>
              <CardContent>
                {mothers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No mothers found</p>
                    <p className="text-sm">Register mothers first</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {mothers.map((mother) => (
                      <div
                        key={mother.uid}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedMother?.uid === mother.uid
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "bg-white hover:bg-gray-50 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedMother(mother)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{mother.name}</div>
                            <div className="text-sm text-gray-500">{mother.email}</div>
                          </div>
                          {selectedMother?.uid === mother.uid && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedMother ? (
              <div className="space-y-6">
                {/* Selected Mother Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Baby className="h-5 w-5 text-green-600" />
                          Managing: {selectedMother.name}
                        </CardTitle>
                        <CardDescription>
                          Email: {selectedMother.email} • DOB: {selectedMother.dob.toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowAddChild(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Add Child Form */}
                {showAddChild && (
                  <AddChildForm
                    motherId={selectedMother.uid}
                    adminId={user?.uid || ""}
                    onSuccess={refreshData}
                    onCancel={() => setShowAddChild(false)}
                  />
                )}

                {/* Children List */}
                <ChildrenList
                  motherId={selectedMother.uid}
                  adminId={user?.uid || ""}
                  key={selectedMother.uid} // Force re-render when mother changes
                />
              </div>
            ) : (
              <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Select a Mother</h3>
                    <p className="text-sm">Choose a mother from the list to manage their children</p>
                    <p className="text-sm">and growth records</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
