import { api } from "./api"

export interface CreateChildData {
  name: string
  dob: string // Date of birth
  nik: string // NIK (Nomor Induk Kependudukan) - required and unique
  gender: "L" | "P"
  userId: number // Parent user ID
}

export interface CreateChildResponse {
  message: string
  data: {
    id: number
    name: string
    dob: string
    nik: string
    gender: string
    userId: number
    createdAt: string
    updatedAt: string
  }
}

export interface Parent {
  id: number
  name: string
  email: string
}

export interface GetParentsParams {
  q?: string // Search query for name/email (case-insensitive)
  limit?: number // Default 20, min 1, max 100
}

export interface GetParentsResponse {
  message: string
  data: Parent[]
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

export const adminApi = {
  // Add child using admin endpoint
  addChild: async (childData: CreateChildData): Promise<CreateChildResponse> => {
    try {
      const response = await api.post<CreateChildResponse>("/admin/add-child", childData)
      return response.data
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.response?.data?.message || apiError.message || "Failed to add child")
    }
  },

  // Get all parents/users with search and pagination
  getParents: async (params: GetParentsParams = {}): Promise<Parent[]> => {
    try {
      const { q, limit = 20 } = params

      // Validate limit parameter
      const validLimit = Math.min(Math.max(limit, 1), 100)

      // Build query parameters
      const queryParams = new URLSearchParams()
      if (q && q.trim()) {
        queryParams.append("q", q.trim())
      }
      queryParams.append("limit", validLimit.toString())

      const url = `/admin/parents${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await api.get<GetParentsResponse>(url)

      return response.data.data || []
    } catch (error) {
      const apiError = error as ApiError
      console.error("Error fetching parents:", apiError)

      // Handle specific error cases
      if (apiError.response?.status === 403) {
        throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melihat data orang tua.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else {
        throw new Error(apiError.response?.data?.message || "Gagal memuat data orang tua")
      }
    }
  },
}
