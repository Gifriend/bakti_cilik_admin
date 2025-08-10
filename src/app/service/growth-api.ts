import { api } from "./api"

export interface GrowthRecord {
  id: number
  childId: number
  date: string
  ageInMonths: number
  height: number
  weight: number
  headCircumference?: number
  createdAt: string
}

export interface WHOCurve {
  ageInMonths: number
  zMinus3: number
  zMinus2: number
  zMinus1: number
  z0: number
  z1: number
  z2: number
  z3: number
}

export interface GrowthChartData {
  records: GrowthRecord[]
  whoCurves: WHOCurve[]
}

export interface Child {
  id: number
  name: string
  birthDate: string
  gender: "L" | "P" // L = Laki-laki, P = Perempuan
}

export const growthApi = {
  // Fetch growth chart data for a specific child
  getGrowthChart: async (childId: number): Promise<GrowthChartData> => {
    const response = await api.get(`/growth/${childId}/growth-chart`)
    return response.data.data
  },

  // Fetch list of children (assuming this endpoint exists)
  getChildren: async (): Promise<Child[]> => {
    const response = await api.get("/children")
    return response.data.data
  },

  // Fetch growth stats for a child
  getGrowthStats: async (childId: number) => {
    const response = await api.get(`/growth/${childId}/stats`)
    return response.data.data
  },
}
