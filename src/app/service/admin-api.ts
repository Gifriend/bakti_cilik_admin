import { api } from "./api"
import { localStorageService } from "./localstorage.service"

// Updated gender type to use MALE/FEMALE enum
export type GenderEnum = "MALE" | "FEMALE"

// Interface untuk menambah anak baru
export interface CreateChildRequest {
  name: string
  dob: string
  nik: string
  gender: GenderEnum
  userId: number
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
    user?: {
      id: number
      name: string
      email: string
    }
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
      error?: string
      statusCode?: number
    }
    status?: number
  }
  message?: string
}

export const adminApi = {
  // Add child - menggunakan endpoint admin untuk menambah anak
  addChild: async (childRequest: CreateChildRequest): Promise<CreateChildResponse> => {
    console.log("🚀 Starting addChild request with data:", childRequest)

    // Validate required fields before sending
    if (!childRequest.name || !childRequest.name.trim()) {
      throw new Error("Nama anak harus diisi")
    }
    if (!childRequest.dob) {
      throw new Error("Tanggal lahir harus diisi")
    }
    if (!childRequest.nik || !childRequest.nik.trim()) {
      throw new Error("NIK harus diisi")
    }
    if (childRequest.nik.trim().length !== 16) {
      throw new Error("NIK harus berupa 16 digit angka")
    }
    if (!childRequest.gender) {
      throw new Error("Jenis kelamin harus dipilih")
    }
    if (!childRequest.userId) {
      throw new Error("Orang tua harus dipilih")
    }

    try {
      // Try API first - menggunakan endpoint admin untuk menambah anak
      const dobDate = new Date(childRequest.dob)
      if (isNaN(dobDate.getTime())) {
        throw new Error("Format tanggal lahir tidak valid")
      }

      const dobISO = dobDate.toISOString()

      const childData = {
        name: childRequest.name.trim(),
        dob: dobISO,
        nik: childRequest.nik.trim(),
        gender: childRequest.gender,
        userId: childRequest.userId,
      }

      const response = await api.post<CreateChildResponse>("/admin/children", childData)
      console.log("✅ API successful:", response.data)
      return response.data
    } catch (error) {
      console.warn("API unavailable, saving to localStorage:", error)

      // Fallback to localStorage
      try {
        const newChild = localStorageService.addChild({
          name: childRequest.name.trim(),
          dob: childRequest.dob,
          nik: childRequest.nik.trim(),
          gender: childRequest.gender,
          userId: childRequest.userId,
        })

        return {
          message: "Anak berhasil ditambahkan (tersimpan lokal)",
          data: {
            id: newChild.id,
            name: newChild.name,
            dob: newChild.dob,
            nik: newChild.nik,
            gender: newChild.gender,
            userId: newChild.userId,
            createdAt: newChild.createdAt,
            updatedAt: newChild.updatedAt,
          },
        }
      } catch (localError: any) {
        throw new Error(localError.message || "Gagal menyimpan data anak")
      }
    }
  },

  // Get all parents/users with search and pagination
  getParents: async (params: GetParentsParams = {}): Promise<Parent[]> => {
    console.log("🚀 Starting getParents request with params:", params)

    try {
      // Try API first - menggunakan endpoint admin untuk mendapatkan parents
      const { q, limit = 20 } = params
      const validLimit = Math.min(Math.max(limit, 1), 100)

      const queryParams = new URLSearchParams()
      if (q && q.trim()) {
        queryParams.append("q", q.trim())
      }
      queryParams.append("limit", validLimit.toString())

      const url = `/admin/parents${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await api.get<GetParentsResponse>(url)

      console.log("✅ Parents loaded from API:", response.data.data?.length || 0, "parents")
      return response.data.data || []
    } catch (error) {
      console.warn("API unavailable, using localStorage for parents:", error)

      // Fallback to localStorage
      return localStorageService.getParents(params.q)
    }
  },

  // Validate NIK availability with localStorage fallback
  validateNIK: async (nik: string): Promise<{ available: boolean; message: string; note?: string }> => {
    console.log("🚀 Validating NIK:", nik)

    // Client-side validation first
    if (!nik || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
      return {
        available: false,
        message: "NIK harus berupa 16 digit angka",
      }
    }

    try {
      // Try API first - menggunakan endpoint admin untuk validasi NIK
      const response = await api.get(`/admin/validate-nik/${nik}`)
      console.log("✅ NIK validation successful:", response.data)
      return response.data
    } catch (error) {
      console.warn("API unavailable, using localStorage for NIK validation:", error)

      // Fallback to localStorage
      const result = localStorageService.validateNIK(nik)
      return {
        ...result,
        note: "Validasi menggunakan data lokal",
      }
    }
  },

  // Test connection with localStorage info
  testConnection: async (): Promise<{
    status: string
    timestamp: string
    note?: string
    localStorage?: any
  }> => {
    try {
      console.log("🚀 Testing API connection...")
      const response = await api.get("/admin/health")
      console.log("✅ API connection successful:", response.data)
      return response.data
    } catch (error) {
      console.log("⚠️ API unavailable, showing localStorage info...")

      // Return localStorage info instead
      const storageInfo = localStorageService.getStorageInfo()

      return {
        status: "offline",
        timestamp: new Date().toISOString(),
        note: "API tidak tersedia, menggunakan penyimpanan lokal",
        localStorage: storageInfo,
      }
    }
  },
}
