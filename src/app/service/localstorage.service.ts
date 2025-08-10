// Local Storage Service for PWA offline functionality
export interface LocalStorageData {
  children: ChildInfo[]
  growthRecords: { [childId: number]: GrowthRecord[] }
  parents: Parent[]
  lastSync: string
  version: string
}

export interface ChildInfo {
  id: number
  name: string
  dob: string
  nik: string
  gender: "MALE" | "FEMALE"
  userId: number
  createdAt: string
  updatedAt: string
}

export interface GrowthRecord {
  id: number
  childId: number
  date: string
  height: number
  weight: number
  ageInMonthsAtRecord: number
  heightZScore: number | null
  inputBy: number
  createdAt: string
}

export interface Parent {
  id: number
  name: string
  email: string
}

const STORAGE_KEY = "growth_tracking_data"
const STORAGE_VERSION = "1.0.0"

class LocalStorageService {
  private getStorageData(): LocalStorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return this.getDefaultData()
      }

      const parsed = JSON.parse(data) as LocalStorageData

      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, resetting data")
        return this.getDefaultData()
      }

      return parsed
    } catch (error) {
      console.error("Error reading localStorage:", error)
      return this.getDefaultData()
    }
  }

  private getDefaultData(): LocalStorageData {
    return {
      children: [],
      growthRecords: {},
      parents: [],
      lastSync: new Date().toISOString(),
      version: STORAGE_VERSION,
    }
  }


  private saveStorageData(data: LocalStorageData): void {
    try {
      data.lastSync = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
      throw new Error("Gagal menyimpan data ke penyimpanan lokal")
    }
  }

  // Children operations
  getChildren(): ChildInfo[] {
    const data = this.getStorageData()
    return data.children
  }

  addChild(child: Omit<ChildInfo, "id" | "createdAt" | "updatedAt">): ChildInfo {
    const data = this.getStorageData()

    // Check if NIK already exists
    const existingChild = data.children.find((c) => c.nik === child.nik)
    if (existingChild) {
      throw new Error("NIK sudah terdaftar dalam sistem")
    }

    const newChild: ChildInfo = {
      ...child,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    data.children.push(newChild)
    this.saveStorageData(data)

    return newChild
  }

  getChildById(id: number): ChildInfo | null {
    const data = this.getStorageData()
    return data.children.find((child) => child.id === id) || null
  }

  // Growth records operations
  getGrowthRecords(childId: number): GrowthRecord[] {
    const data = this.getStorageData()
    return data.growthRecords[childId] || []
  }

  addGrowthRecord(childId: number, record: Omit<GrowthRecord, "id" | "childId" | "createdAt">): GrowthRecord {
    const data = this.getStorageData()

    if (!data.growthRecords[childId]) {
      data.growthRecords[childId] = []
    }

    const newRecord: GrowthRecord = {
      ...record,
      id: Date.now(),
      childId,
      createdAt: new Date().toISOString(),
    }

    data.growthRecords[childId].push(newRecord)
    data.growthRecords[childId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    this.saveStorageData(data)
    return newRecord
  }

  // Parents operations
  getParents(searchQuery?: string): Parent[] {
    const data = this.getStorageData()

    if (!searchQuery) {
      return data.parents
    }

    const query = searchQuery.toLowerCase()
    return data.parents.filter(
      (parent) => parent.name.toLowerCase().includes(query) || parent.email.toLowerCase().includes(query),
    )
  }

  // Utility operations
  validateNIK(nik: string): { available: boolean; message: string } {
    if (!nik || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
      return {
        available: false,
        message: "NIK harus berupa 16 digit angka",
      }
    }

    const data = this.getStorageData()
    const exists = data.children.some((child) => child.nik === nik)

    return {
      available: !exists,
      message: exists ? "NIK sudah terdaftar dalam sistem" : "NIK tersedia",
    }
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Get storage info
  getStorageInfo(): {
    totalChildren: number
    totalRecords: number
    totalParents: number
    lastSync: string
    storageSize: string
  } {
    const data = this.getStorageData()
    const totalRecords = Object.values(data.growthRecords).reduce((sum, records) => sum + records.length, 0)

    // Calculate approximate storage size
    const dataString = JSON.stringify(data)
    const sizeInBytes = new Blob([dataString]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)

    return {
      totalChildren: data.children.length,
      totalRecords,
      totalParents: data.parents.length,
      lastSync: data.lastSync,
      storageSize: `${sizeInKB} KB`,
    }
  }

  // Export data for backup
  exportData(): string {
    const data = this.getStorageData()
    return JSON.stringify(data, null, 2)
  }

  // Import data from backup
  importData(jsonData: string): void {
    try {
      const importedData = JSON.parse(jsonData) as LocalStorageData

      // Validate structure
      if (!importedData.children || !importedData.growthRecords || !importedData.parents) {
        throw new Error("Format data tidak valid")
      }

      this.saveStorageData(importedData)
    } catch (error) {
      console.error("Error importing data:", error)
      throw new Error("Gagal mengimpor data: format tidak valid")
    }
  }
}

export const localStorageService = new LocalStorageService()
