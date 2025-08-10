import axios from "axios"

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Function to get cookie value
export const getCookieValue = (name: string): string | null => {
  if (typeof window === "undefined") return null
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=").map((c) => c.trim())
    if (cookieName === name) {
      return cookieValue
    }
  }
  return null
}

// Function to save cookie value
export const setCookie = (name: string, value: string, days = 7): void => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getCookieValue("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle common errors and fallback to localStorage
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // If network error or server unavailable, we'll handle it in individual API calls
    console.warn("API request failed, will fallback to localStorage:", error.message)
    return Promise.reject(error)
  },
)
