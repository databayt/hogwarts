import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCookie, setCookie } from 'cookies-next'
import config from './config.json'

const API_URL = config.isDev ? config.development.apiUrl : config.production.apiUrl
const USE_LOCAL_JSON = Boolean((config as any).useLocalJson)

const DEFAULT_CONFIG: ClassConfig = {
  school: "Mokun Middle School",
  schoolCode: "7081492",
  grade: "3",
  class: "4",
  lunchAfter: 4
}

interface TimetableState {
  // Persistent state
  classConfig: ClassConfig
  teacherInfo: Record<string, Record<string, string>> // User overrides only
  
  // Temporary state (not persisted)
  tempConfig: ClassConfig | null
  timetableData: TimetableData | null
  isLoading: boolean
  isWeekChangeLoading: boolean
  error: string | null
  isNextWeek: boolean
  showConfig: boolean
  
  // Actions
  initializeStore: () => Promise<void>
  setTempConfig: (config: ClassConfig) => void
  resetTempConfig: () => void
  setShowConfig: (show: boolean) => void
  changeWeek: (isNext: boolean) => Promise<void>
  saveConfig: () => Promise<boolean>
  saveTeacherInfo: (subject: string, info: string) => void
  fetchTimetable: (config?: ClassConfig) => Promise<void>
  getTeacherInfo: (subject: string) => string | undefined
}

interface ClassConfig {
  school: string
  schoolCode: string
  grade: string
  class: string
  lunchAfter: number
}

interface TimetableData {
  day_time: string[]
  timetable: Array<Array<{
    period: number
    subject: string
    teacher: string  // This is the default teacher info from API
    replaced: boolean
    original: {
      period: number
      subject: string
      teacher: string
    } | null
  }>>
  update_date: string
}

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  // Initialize with default values
  classConfig: DEFAULT_CONFIG,
  teacherInfo: {}, // Only store user overrides
  tempConfig: null,
  timetableData: null,
  isLoading: true,
  isWeekChangeLoading: false,
  error: null,
  isNextWeek: false,
  showConfig: false,

  initializeStore: async () => {
    // Load saved config from cookies
    const savedConfig = getCookie('classConfig')
    const config = savedConfig ? JSON.parse(savedConfig as string) : DEFAULT_CONFIG
    
    // Load saved teacher info overrides
    const savedTeacherInfo = getCookie('teacherInfo')
    const teacherInfo = savedTeacherInfo ? JSON.parse(savedTeacherInfo as string) : {}

    set({ 
      classConfig: config,
      teacherInfo,
      tempConfig: null,
      isLoading: true
    })

    try {
      // Fetch initial timetable
      const params = new URLSearchParams({
        grade: config.grade,
        classno: config.class,
        week: "0", // Always start with current week
        schoolcode: config.schoolCode
      })

      const response = await fetch(
        USE_LOCAL_JSON
          ? `/timetable/timetable.json`
          : `${API_URL}/timetable?${params}`
      )
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      
      const data = await response.json()
      set({ 
        timetableData: data,
        isNextWeek: false,
        error: null
      })
    } catch (err) {
      set({ 
        error: err instanceof Error 
          ? `Failed to load timetable: ${err.message}`
          : 'Could not load timetable. Please check school info and your internet connection.'
      })
    } finally {
      set({ isLoading: false })
    }
  },

  setTempConfig: (config: ClassConfig) => {
    set({ tempConfig: config })
  },

  resetTempConfig: () => {
    set({ tempConfig: null })
  },

  setShowConfig: (show: boolean) => {
    set({ 
      showConfig: show,
      // Reset temp config when closing dialog without saving
      tempConfig: show ? get().tempConfig : null,
      error: null
    })
  },

  changeWeek: async (isNext: boolean) => {
    // Don't fetch if we're already on the requested week
    if ((isNext && get().isNextWeek) || (!isNext && !get().isNextWeek)) {
      return
    }

    set({ isWeekChangeLoading: true })
    try {
      const params = new URLSearchParams({
        grade: get().classConfig.grade,
        classno: get().classConfig.class,
        week: isNext ? "1" : "0",
        schoolcode: get().classConfig.schoolCode
      })

      const response = await fetch(
        USE_LOCAL_JSON
          ? `/timetable/timetable${isNext ? '-next' : ''}.json`
          : `${API_URL}/timetable?${params}`
      )
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      
      const data = await response.json()
      
      set({ 
        timetableData: data,
        isNextWeek: isNext,
        error: null
      })
    } catch (err) {
      set({ 
        error: err instanceof Error 
          ? `Failed to load timetable: ${err.message}`
          : 'Could not load timetable. Please check school info and your internet connection.'
      })
    } finally {
      set({ isWeekChangeLoading: false })
    }
  },

  saveConfig: async () => {
    const { tempConfig } = get()
    if (!tempConfig) return false

    try {
      // Reset week state and enable loading
      set({ 
        isNextWeek: false,
        isWeekChangeLoading: true
      })

      // Try fetching with new config first
      await get().fetchTimetable(tempConfig)
      
      // If successful, save to cookies and update main config
      setCookie('classConfig', JSON.stringify(tempConfig))
      set({ 
        classConfig: tempConfig,
        tempConfig: null,
        showConfig: false,
        isWeekChangeLoading: false // Reset loading state after success
      })
      return true
    } catch (err) {
      set({ 
        error: err instanceof Error 
          ? `Failed to save settings: ${err.message}`
          : 'Could not save settings. Please check school info and your internet connection.',
        isWeekChangeLoading: false // Reset loading state on error
      })
      return false
    }
  },

  saveTeacherInfo: (subject: string, info: string) => {
    const { classConfig, teacherInfo, timetableData } = get()
    const configKey = `${classConfig.schoolCode}-${classConfig.grade}-${classConfig.class}`
    
    // Find the default teacher info from the API data
    const defaultInfo = timetableData?.timetable.flat().find(cell => cell?.subject === subject)?.teacher

    // Only save if it's different from the API default
    if (info !== defaultInfo) {
      const newInfo = {
        ...teacherInfo,
        [configKey]: {
          ...(teacherInfo[configKey] || {}),
          [subject]: info
        }
      }
      set({ teacherInfo: newInfo })
      setCookie('teacherInfo', JSON.stringify(newInfo))
    } else {
      // If it matches the API default, remove any override
      const newInfo = { ...teacherInfo }
      if (newInfo[configKey]?.[subject]) {
        delete newInfo[configKey][subject]
        if (Object.keys(newInfo[configKey]).length === 0) {
          delete newInfo[configKey]
        }
        set({ teacherInfo: newInfo })
        setCookie('teacherInfo', JSON.stringify(newInfo))
      }
    }
  },

  getTeacherInfo: (subject: string) => {
    const { classConfig, teacherInfo, timetableData } = get()
    const configKey = `${classConfig.schoolCode}-${classConfig.grade}-${classConfig.class}`
    
    // First check for user override
    const override = teacherInfo[configKey]?.[subject]
    if (override !== undefined) {
      return override
    }
    
    // If no override, return the API default
    const defaultInfo = timetableData?.timetable.flat().find(cell => cell?.subject === subject)?.teacher
    return defaultInfo || undefined
  },

  fetchTimetable: async (config?: ClassConfig) => {
    const currentConfig = config || get().classConfig
    set({ isLoading: true, error: null })
    
    try {
      const params = new URLSearchParams({
        grade: currentConfig.grade,
        classno: currentConfig.class,
        week: get().isNextWeek ? "1" : "0",
        schoolcode: currentConfig.schoolCode
      })

      const response = await fetch(
        USE_LOCAL_JSON
          ? `/timetable/timetable${get().isNextWeek ? '-next' : ''}.json`
          : `${API_URL}/timetable?${params}`
      )
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      
      const data = await response.json()
      set({ timetableData: data })
    } catch (err) {
      set({ 
        error: err instanceof Error 
          ? `Failed to load timetable: ${err.message}`
          : 'Could not load timetable. Please check school info and your internet connection.'
      })
      throw err // Re-throw for saveConfig to catch
    } finally {
      set({ isLoading: false })
    }
  }
})) 