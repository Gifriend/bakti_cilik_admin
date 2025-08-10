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
  birthDate: string
  gender: "L" | "P" // L = Laki-laki, P = Perempuan
}

export interface CreateGrowthRecordData {
  date: string
  height: number
  weight: number
  headCircumference?: number
  ageInMonths: number
}

export const growthApi = {
  // Fetch growth chart data - will return error if no child or no access
  getGrowthChart: async (childId: number): Promise<GrowthChartData> => {
    const response = await api.get(`/growth/${childId}/growth-chart`)
    return response.data.data
  },

  // Fetch growth stats - will return error if no child or no access
  getGrowthStats: async (childId: number): Promise<GrowthStats> => {
    const response = await api.get(`/growth/${childId}/growth-stats`)
    return response.data.data
  },

  // Fetch growth records - will return error if no child or no access
  getGrowthRecords: async (childId: number): Promise<GrowthRecord[]> => {
    const response = await api.get(`/growth/${childId}/growth-records`)
    return response.data.data
  },

  // Add growth record
  addGrowthRecord: async (childId: number, recordData: CreateGrowthRecordData): Promise<any> => {
    const response = await api.post(`/growth/${childId}/growth-records`, recordData)
    return response.data
  },
}
