import { api } from "./api"

// Updated gender type to use MALE/FEMALE enum
export type GenderEnum = "MALE" | "FEMALE"

// Updated to match Prisma childCreateInput structure
export interface CreateChildData {
  name: string
  dob: string // Will be converted to Date by backend
  nik: string
  gender: GenderEnum // Updated to use MALE/FEMALE enum
  user: {
    connect: {
      id: number // Connect to existing user by ID
    }
  }
}

// Alternative interface for simpler API usage (fallback)
export interface CreateChildRequest {
  name: string
  dob: string
  nik: string
  gender: GenderEnum // Updated to use MALE/FEMALE enum
  userId: number // Will be transformed to user.connect structure
}

// Backend expected structure based on error
export interface CreateChildBackendFormat {
  name: string
  dob: string
  nik: string // Make sure this is explicitly included
  gender: GenderEnum // Updated to use MALE/FEMALE enum
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
  // Update the addChild function to properly format the date
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
      // Convert date string to ISO-8601 DateTime format
      const dobDate = new Date(childRequest.dob)

      // Validate the date is valid
      if (isNaN(dobDate.getTime())) {
        throw new Error("Format tanggal lahir tidak valid")
      }

      // Convert to ISO string for Prisma
      const dobISO = dobDate.toISOString()

      console.log(`📅 Date conversion: "${childRequest.dob}" -> "${dobISO}"`)

      // Strategy 1: Try the format that backend expects with proper ISO date
      const backendChildData: CreateChildBackendFormat = {
        name: childRequest.name.trim(),
        dob: dobISO, // Use ISO-8601 DateTime format
        nik: childRequest.nik.trim(),
        gender: childRequest.gender,
        userId: childRequest.userId,
      }

      console.log("📤 Attempting backend format:", backendChildData)

      try {
        const response = await api.post<CreateChildResponse>("/admin/add-child", backendChildData)
        console.log("✅ Backend format successful:", response.data)
        return response.data
      } catch (backendError) {
        console.log("❌ Backend format failed, trying Prisma structure...")

        // Strategy 2: Try Prisma-compatible structure with ISO date
        const prismaChildData: CreateChildData = {
          name: childRequest.name.trim(),
          dob: dobISO, // Use ISO-8601 DateTime format
          nik: childRequest.nik.trim(),
          gender: childRequest.gender,
          user: {
            connect: {
              id: childRequest.userId,
            },
          },
        }

        console.log("📤 Attempting Prisma structure:", prismaChildData)

        try {
          const response = await api.post<CreateChildResponse>("/admin/add-child", prismaChildData)
          console.log("✅ Prisma structure successful:", response.data)
          return response.data
        } catch (prismaError) {
          console.log("❌ Prisma structure failed, trying alternative formats...")

          // Strategy 3: Try with explicit field validation and ISO date
          const validatedChildData = {
            name: String(childRequest.name.trim()),
            dob: dobISO, // Use ISO-8601 DateTime format
            nik: String(childRequest.nik.trim()),
            gender: String(childRequest.gender),
            userId: Number(childRequest.userId),
          }

          console.log("📤 Attempting validated structure:", validatedChildData)

          const response = await api.post<CreateChildResponse>("/admin/add-child", validatedChildData)
          console.log("✅ Validated structure successful:", response.data)
          return response.data
        }
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error("💥 All strategies failed. Full error details:", {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        originalRequest: childRequest,
      })

      // Enhanced error handling with more specific messages
      if (apiError.response?.status === 500) {
        console.error("🔥 Server Error 500 - Backend issue detected")

        // Check for specific Prisma errors
        const serverMessage = apiError.response?.data?.message || apiError.response?.data?.error || ""

        if (serverMessage.includes("Invalid value for argument dob")) {
          throw new Error(
            "Error format tanggal: Sistem memerlukan format tanggal yang valid. Silakan hubungi administrator.",
          )
        }

        if (serverMessage.includes("Expected ISO-8601 DateTime")) {
          throw new Error(
            "Error format tanggal: Format tanggal tidak sesuai dengan sistem database. Silakan hubungi administrator.",
          )
        }

        if (serverMessage.includes("Argument nik is missing")) {
          throw new Error("Error sistem: Field NIK tidak terkirim dengan benar. Silakan hubungi administrator.")
        }

        if (serverMessage.includes("Invalid prisma")) {
          throw new Error("Error database: Format data tidak sesuai dengan sistem. Silakan hubungi administrator.")
        }

        if (serverMessage.includes("Foreign key constraint")) {
          throw new Error("Orang tua yang dipilih tidak valid atau tidak ditemukan dalam sistem.")
        }

        if (serverMessage.includes("Unique constraint")) {
          if (serverMessage.toLowerCase().includes("nik")) {
            throw new Error("NIK sudah terdaftar dalam sistem")
          }
          throw new Error("Data sudah ada dalam sistem")
        }

        throw new Error(`Server Error: ${serverMessage}. Silakan hubungi administrator.`)
      }

      // Handle specific Prisma errors
      if (
        apiError.response?.data?.message?.includes("Unique constraint") ||
        apiError.response?.data?.message?.includes("unique constraint")
      ) {
        if (apiError.response.data.message.toLowerCase().includes("nik")) {
          throw new Error("NIK sudah terdaftar dalam sistem")
        }
        throw new Error("Data sudah ada dalam sistem")
      }

      // Handle foreign key constraint errors
      if (
        apiError.response?.data?.message?.includes("Foreign key constraint") ||
        apiError.response?.data?.message?.includes("foreign key constraint")
      ) {
        throw new Error("Orang tua yang dipilih tidak valid atau tidak ditemukan")
      }

      // Handle validation errors
      if (apiError.response?.status === 400) {
        const validationMessage = apiError.response?.data?.message || "Data yang dikirim tidak valid"
        throw new Error(validationMessage)
      }

      // Handle authentication errors
      if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      }

      // Handle authorization errors
      if (apiError.response?.status === 403) {
        throw new Error("Anda tidak memiliki izin untuk menambahkan data anak.")
      }

      // Handle not found errors
      if (apiError.response?.status === 404) {
        throw new Error("Endpoint tidak ditemukan. Silakan hubungi administrator.")
      }

      // Generic error fallback
      const errorMessage =
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        apiError.message ||
        "Gagal menambahkan data anak"

      throw new Error(errorMessage)
    }
  },

  // Get all parents/users with search and pagination
  getParents: async (params: GetParentsParams = {}): Promise<Parent[]> => {
    console.log("🚀 Starting getParents request with params:", params)

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
      console.log("📤 Requesting parents from:", url)

      const response = await api.get<GetParentsResponse>(url)
      console.log("✅ Parents loaded successfully:", response.data.data?.length || 0, "parents")

      return response.data.data || []
    } catch (error) {
      const apiError = error as ApiError
      console.error("💥 getParents failed:", {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
        params,
      })

      // Handle specific error cases
      if (apiError.response?.status === 403) {
        throw new Error("Akses ditolak. Anda tidak memiliki izin untuk melihat data orang tua.")
      } else if (apiError.response?.status === 401) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (apiError.response?.status === 404) {
        throw new Error("Endpoint data orang tua tidak ditemukan.")
      } else {
        const errorMessage =
          apiError.response?.data?.message || apiError.response?.data?.error || "Gagal memuat data orang tua"
        throw new Error(errorMessage)
      }
    }
  },

  // Validate NIK availability with better error handling
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
      const response = await api.get(`/admin/validate-nik/${nik}`)
      console.log("✅ NIK validation successful:", response.data)
      return response.data
    } catch (error) {
      const apiError = error as ApiError
      console.log("⚠️ NIK validation response:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
      })

      if (apiError.response?.status === 409) {
        return { available: false, message: "NIK sudah terdaftar dalam sistem" }
      }

      if (apiError.response?.status === 404) {
        // If endpoint doesn't exist, assume NIK is available
        console.log("⚠️ NIK validation endpoint not found, assuming available")
        return { available: true, message: "NIK tersedia (validasi tidak tersedia)" }
      }

      console.error("💥 NIK validation failed:", apiError)
      // Don't throw error, just return as available with warning
      return { available: true, message: "Tidak dapat memvalidasi NIK, diasumsikan tersedia" }
    }
  },

  // Debug endpoint to test API connectivity
  testConnection: async (): Promise<{ status: string; timestamp: string; note?: string }> => {
    try {
      console.log("🚀 Testing API connection...")
      const response = await api.get("/admin/health")
      console.log("✅ API connection successful:", response.data)
      return response.data
    } catch (error) {
      console.log("⚠️ Health endpoint not found, trying alternative...")
      try {
        // Try getting parents as a connectivity test
        const response = await api.get("/admin/parents?limit=1")
        return {
          status: "connected",
          timestamp: new Date().toISOString(),
          note: "Health endpoint not available, but API is responsive",
        }
      } catch (fallbackError) {
        console.error("💥 API connection failed:", fallbackError)
        throw new Error("Tidak dapat terhubung ke server")
      }
    }
  },
}
