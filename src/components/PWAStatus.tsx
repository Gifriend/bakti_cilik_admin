"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Database, Download, Upload, Info } from "lucide-react"
import { localStorageService } from "@/app/service/localstorage.service"

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load storage info
    setStorageInfo(localStorageService.getStorageInfo())

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleExportData = () => {
    try {
      const data = localStorageService.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `growth-data-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Gagal mengekspor data")
    }
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string
            localStorageService.importData(data)
            setStorageInfo(localStorageService.getStorageInfo())
            alert("Data berhasil diimpor!")
            window.location.reload()
          } catch (error) {
            console.error("Import failed:", error)
            alert("Gagal mengimpor data: format tidak valid")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(true)}
          className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200"
        >
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
            <Database className="h-4 w-4 text-blue-600" />
            <Info className="h-4 w-4" />
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Status PWA</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)} className="h-6 w-6 p-0">
              ×
            </Button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
              <span className="text-sm">Koneksi</span>
            </div>
            <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Storage Info */}
          {storageInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Data Lokal</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium text-blue-700">Anak</div>
                  <div className="text-blue-600">{storageInfo.totalChildren}</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-medium text-green-700">Rekam</div>
                  <div className="text-green-600">{storageInfo.totalRecords}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Ukuran: {storageInfo.storageSize} • Sync: {new Date(storageInfo.lastSync).toLocaleDateString("id-ID")}
              </div>
            </div>
          )}

          {/* Actions */}
          {/* <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportData} className="flex-1 text-xs bg-transparent">
              <Download className="h-3 w-3 mr-1" />
              Ekspor
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportData} className="flex-1 text-xs bg-transparent">
              <Upload className="h-3 w-3 mr-1" />
              Impor
            </Button>
          </div> */}

          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-700">
                Mode offline aktif. Data disimpan lokal dan akan disinkronkan saat online.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
