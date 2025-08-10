import { api } from "./api"

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
  gender: "L" | "P"
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

export const growthApi = {
  // Get children for current user
  getMyChildren: async (): Promise<ChildInfo[]> => {
    try {
      const response = await api.get<GetMyChildrenResponse>("/my-children")
      return response.data.data || []
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error fetching my children:", apiError)

      if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (apiError.response?.status === 404) {
        throw new Error("Data anak tidak ditemukan.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal memuat data anak")
      }
    }
  },

  // Fetch growth chart data - will return error if no child or no access
  getGrowthChart: async (childId: number): Promise<GrowthChartData> => {
    try {
      const response = await api.get<GetGrowthChartResponse>(`/growth/${childId}/growth-chart`)
      return response.data.data
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error fetching growth chart:", apiError)

      if (apiError.response?.status === 404) {
        throw new Error("Data anak tidak ditemukan.")
      } else if (apiError.response?.status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melihat data anak ini.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal memuat data grafik pertumbuhan")
      }
    }
  },

  // Fetch growth stats - will return error if no child or no access
  getGrowthStats: async (childId: number): Promise<GrowthStats> => {
    try {
      const response = await api.get<GetGrowthStatsResponse>(`/growth/${childId}/growth-stats`)
      return response.data.data
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error fetching growth stats:", apiError)

      if (apiError.response?.status === 404) {
        throw new Error("Data anak tidak ditemukan.")
      } else if (apiError.response?.status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melihat data anak ini.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal memuat statistik pertumbuhan")
      }
    }
  },

  // Fetch growth records - will return error if no child or no access
  getGrowthRecords: async (childId: number): Promise<GrowthRecord[]> => {
    try {
      const response = await api.get<GetGrowthRecordsResponse>(`/growth/${childId}/growth-records`)
      return response.data.data || []
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error fetching growth records:", apiError)

      if (apiError.response?.status === 404) {
        throw new Error("Data anak tidak ditemukan.")
      } else if (apiError.response?.status === 403) {
        throw new Error("Anda tidak memiliki akses untuk melihat data anak ini.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal memuat riwayat pengukuran")
      }
    }
  },

  // Add growth record
  addGrowthRecord: async (childId: number, recordData: CreateGrowthRecordData): Promise<GrowthRecord> => {
    try {
      const response = await api.post<{ message: string; data: GrowthRecord }>(
        `/growth/${childId}/growth-records`,
        recordData,
      )
      return response.data.data
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error adding growth record:", apiError)

      if (apiError.response?.status === 404) {
        throw new Error("Data anak tidak ditemukan.")
      } else if (apiError.response?.status === 403) {
        throw new Error("Anda tidak memiliki akses untuk menambah data anak ini.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (apiError.response?.status === 400) {
        throw new Error(apiError.response?.data?.message || "Data yang dikirim tidak valid.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal menambahkan data pertumbuhan")
      }
    }
  },
}
