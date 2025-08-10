import { api } from "./api"
import { localStorageService } from "./localstorage.service"

export interface GrowthRecord {
  date: string
  height: number
  weight: number
  ageInMonthsAtRecord: number
  heightZScore: number | null
}

export interface WHOCurvePoint {
  ageInMonths: number
  value: number
}

export interface WHOCurve {
  z: number
  points: WHOCurvePoint[]
}

export interface GrowthChartData {
  records: GrowthRecord[]
  whoCurves: WHOCurve[]
}

export interface GrowthStats {
  _count: { _all: number }
  _avg: { height: number; weight: number; heightZScore: number }
  _min: {
    date: string
    height: number
    weight: number
    heightZScore: number
  }
  _max: {
    date: string
    height: number
    weight: number
    heightZScore: number
  }
}

export interface ChildInfo {
  id: number
  name: string
  dob: string // Date of birth
  nik: string // NIK (Nomor Induk Kependudukan)
  gender: "MALE" | "FEMALE" // Updated to match backend enum
  userId?: number
}

export interface CreateGrowthRecordData {
  date: string
  height: number
  weight: number
}

export interface ApiError {
  response?: {
    data?: {
      message?: string
    }
    status?: number
  }
  message?: string
}

export interface GetMyChildrenResponse {
  message: string
  data: ChildInfo[]
}

export interface GetGrowthChartResponse {
  message: string
  data: GrowthChartData
}

export interface GetGrowthStatsResponse {
  message: string
  data: GrowthStats
}

export interface GetGrowthRecordsResponse {
  message: string
  data: GrowthRecord[]
}

// Tambahkan interface baru
export interface SearchChildByNIKResponse {
  message: string
  data: ChildInfo | null
}

export const growthApi = {
  // Get children for current user - UPDATED to use new endpoint
  getMyChildren: async (): Promise<ChildInfo[]> => {
    try {
      console.log("🚀 Fetching children from /users/children endpoint...")

      // Try new API endpoint first
      const response = await api.get("/users/children")
      console.log("✅ Raw API Response:", response)
      console.log("✅ Response data:", response.data)
      console.log("✅ Response data type:", typeof response.data)
      console.log("✅ Is response.data array:", Array.isArray(response.data))

      // Handle different response formats
      let childrenData: ChildInfo[] = []

      if (Array.isArray(response.data)) {
        // Direct array in response.data
        childrenData = response.data
        console.log("✅ Using direct response.data array")
      } else if (response.data && typeof response.data === "object") {
        // Check for nested data structure
        if ("data" in response.data && Array.isArray(response.data.data)) {
          childrenData = response.data.data 
          console.log("✅ Using response.data.data array")
        } else if ("children" in response.data && Array.isArray(response.data.children)) {
          childrenData = response.data.children
          console.log("✅ Using response.data.children array")
        } else {
          console.warn("⚠️ Unexpected API response format:", response.data)
          childrenData = []
        }
      } else {
        console.warn("⚠️ Response.data is not an object or array:", response.data)
        childrenData = []
      }

      console.log("✅ Processed children data:", childrenData)
      console.log("✅ Final children count:", childrenData.length)

      return childrenData || []
    } catch (error: any) {
      console.warn("❌ API unavailable, using localStorage fallback:", error.message)

      // Enhanced error logging
      if (error.response) {
        console.error("API Error Details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
        })
      }

      // Fallback to localStorage
      const localChildren = localStorageService.getChildren()
      console.log("📱 Using localStorage data:", localChildren.length, "children found")

      return localChildren.map((child) => ({
        id: child.id,
        name: child.name,
        dob: child.dob,
        nik: child.nik,
        gender: child.gender,
        userId: child.userId,
      }))
    }
  },

  // Fetch growth chart data - with localStorage fallback
  getGrowthChart: async (childId: number): Promise<GrowthChartData> => {
    try {
      console.log(`🚀 Fetching growth chart for child ${childId}...`)

      // Try API first
      const response = await api.get<GetGrowthChartResponse>(`/growth/${childId}/growth-chart`)
      console.log("✅ Growth chart data received from API")

      return response.data.data
    } catch (error: any) {
      console.warn("❌ API unavailable for chart data, using localStorage:", error.message)

      // Fallback to localStorage with mock WHO curves
      const records = localStorageService.getGrowthRecords(childId)
      const child = localStorageService.getChildById(childId)

      if (!child) {
        throw new Error("Data anak tidak ditemukan")
      }

      // Generate mock WHO curves for demonstration
      const whoCurves = generateMockWHOCurves(child.gender)

      return {
        records: records.map((r) => ({
          date: r.date,
          height: r.height,
          weight: r.weight,
          ageInMonthsAtRecord: r.ageInMonthsAtRecord,
          heightZScore: r.heightZScore,
        })),
        whoCurves,
      }
    }
  },

  // Fetch growth stats - with localStorage fallback
  getGrowthStats: async (childId: number): Promise<GrowthStats> => {
    try {
      console.log(`🚀 Fetching growth stats for child ${childId}...`)

      // Try API first
      const response = await api.get<GetGrowthStatsResponse>(`/growth/${childId}/growth-stats`)
      console.log("✅ Growth stats received from API")

      return response.data.data
    } catch (error: any) {
      console.warn("❌ API unavailable for stats, calculating from localStorage:", error.message)

      // Fallback to localStorage with calculated stats
      const records = localStorageService.getGrowthRecords(childId)

      if (records.length === 0) {
        return {
          _count: { _all: 0 },
          _avg: { height: 0, weight: 0, heightZScore: 0 },
          _min: { date: "", height: 0, weight: 0, heightZScore: 0 },
          _max: { date: "", height: 0, weight: 0, heightZScore: 0 },
        }
      }

      // Calculate stats from local data
      const heights = records.map((r) => r.height)
      const weights = records.map((r) => r.weight)
      const zScores = records.filter((r) => r.heightZScore !== null).map((r) => r.heightZScore!)
      const dates = records.map((r) => r.date).sort()

      return {
        _count: { _all: records.length },
        _avg: {
          height: heights.reduce((sum, h) => sum + h, 0) / heights.length,
          weight: weights.reduce((sum, w) => sum + w, 0) / weights.length,
          heightZScore: zScores.length > 0 ? zScores.reduce((sum, z) => sum + z, 0) / zScores.length : 0,
        },
        _min: {
          date: dates[0],
          height: Math.min(...heights),
          weight: Math.min(...weights),
          heightZScore: zScores.length > 0 ? Math.min(...zScores) : 0,
        },
        _max: {
          date: dates[dates.length - 1],
          height: Math.max(...heights),
          weight: Math.max(...weights),
          heightZScore: zScores.length > 0 ? Math.max(...zScores) : 0,
        },
      }
    }
  },

  // Fetch growth records - with localStorage fallback
  getGrowthRecords: async (childId: number): Promise<GrowthRecord[]> => {
    try {
      console.log(`🚀 Fetching growth records for child ${childId}...`)

      // Try API first
      const response = await api.get<GetGrowthRecordsResponse>(`/growth/${childId}/growth-records`)
      console.log("✅ Growth records received from API")

      return response.data.data || []
    } catch (error: any) {
      console.warn("❌ API unavailable for records, using localStorage:", error.message)

      // Fallback to localStorage
      return localStorageService.getGrowthRecords(childId).map((r) => ({
        date: r.date,
        height: r.height,
        weight: r.weight,
        ageInMonthsAtRecord: r.ageInMonthsAtRecord,
        heightZScore: r.heightZScore,
      }))
    }
  },

  // Add growth record - with localStorage fallback
  addGrowthRecord: async (childId: number, recordData: CreateGrowthRecordData): Promise<GrowthRecord> => {
    try {
      console.log(`🚀 Adding growth record for child ${childId}...`)

      // Try API first
      const response = await api.post<{ message: string; data: GrowthRecord }>(
        `/growth/${childId}/growth-records`,
        recordData,
      )
      console.log("✅ Growth record added via API")

      return response.data.data
    } catch (error: any) {
      console.warn("❌ API unavailable for adding record, saving to localStorage:", error.message)

      // Fallback to localStorage
      const child = localStorageService.getChildById(childId)
      if (!child) {
        throw new Error("Data anak tidak ditemukan")
      }

      // Calculate age in months
      const birthDate = new Date(child.dob)
      const recordDate = new Date(recordData.date)
      const ageInMonths = Math.floor((recordDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))

      // Simple Z-score calculation (mock)
      const heightZScore = calculateMockZScore(recordData.height, ageInMonths, child.gender)

      const newRecord = localStorageService.addGrowthRecord(childId, {
        date: recordData.date,
        height: recordData.height,
        weight: recordData.weight,
        ageInMonthsAtRecord: ageInMonths,
        heightZScore,
        inputBy: 1, // Mock user ID
      })

      return {
        date: newRecord.date,
        height: newRecord.height,
        weight: newRecord.weight,
        ageInMonthsAtRecord: newRecord.ageInMonthsAtRecord,
        heightZScore: newRecord.heightZScore,
      }
    }
  },

  // Search child by NIK - updated to use new endpoint
  searchChildByNIK: async (nik: string): Promise<ChildInfo | null> => {
    try {
      console.log(`🚀 Searching child by NIK: ${nik}...`)

      // Try API first - menggunakan endpoint yang sudah ada
      const allChildren = await growthApi.getMyChildren()
      const foundChild = allChildren.find((child) => child.nik === nik)

      if (foundChild) {
        console.log("✅ Child found via API")
        return foundChild
      }

      console.log("❌ Child not found in API data")
      return null
    } catch (error: any) {
      console.warn("❌ API unavailable for NIK search, using localStorage:", error.message)

      // Fallback to localStorage
      const children = localStorageService.getChildren()
      const foundChild = children.find((child) => child.nik === nik)

      if (foundChild) {
        console.log("✅ Child found in localStorage")
        return {
          id: foundChild.id,
          name: foundChild.name,
          dob: foundChild.dob,
          nik: foundChild.nik,
          gender: foundChild.gender,
          userId: foundChild.userId,
        }
      }

      console.log("❌ Child not found in localStorage")
      return null
    }
  },
}

// Helper function to generate mock WHO curves
function generateMockWHOCurves(gender: "MALE" | "FEMALE"): WHOCurve[] {
  const zLevels = [-3, -2, -1, 0, 1, 2, 3]

  return zLevels.map((z) => ({
    z,
    points: Array.from({ length: 25 }, (_, i) => {
      const ageInMonths = i
      // Mock height values based on typical growth patterns
      const baseHeight =
        gender === "MALE"
          ? 50 + ageInMonths * 2.2 // Boys grow slightly faster
          : 49 + ageInMonths * 2.1 // Girls baseline

      const zAdjustment = z * 3 // Each Z-score represents ~3cm difference

      return {
        ageInMonths,
        value: Math.max(30, baseHeight + zAdjustment), // Minimum 30cm
      }
    }),
  }))
}

// Helper function to calculate mock Z-score
function calculateMockZScore(height: number, ageInMonths: number, gender: "MALE" | "FEMALE"): number {
  // Mock calculation - in real app this would use WHO standards
  const expectedHeight = gender === "MALE" ? 50 + ageInMonths * 2.2 : 49 + ageInMonths * 2.1

  const difference = height - expectedHeight
  const standardDeviation = 3 // Approximate SD for height

  return Number((difference / standardDeviation).toFixed(2))
}
