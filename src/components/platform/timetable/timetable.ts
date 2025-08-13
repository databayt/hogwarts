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
  loadWeekly: (params: { termId: string; weekOffset?: 0 | 1; classId?: string; teacherId?: string }) => Promise<void>
}

interface ClassConfig {
  school: string
  schoolCode: string
  grade: string
  class: string
  lunchAfter: number
}

interface TimetableData {
  days?: number[]
  day_time: string[]
  timetable: Array<Array<{
    period: number
    subject: string
    teacher: string
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
  // Safe JSON fetch helper to avoid Unexpected end of JSON
  _safeFetchJson: async (input: RequestInfo | URL) => {
    try {
      const res = await fetch(input)
      if (!res.ok) return null
      try {
        return await res.json()
      } catch {
        return null
      }
    } catch {
      return null
    }
  },
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
      // Fetch initial term, then schedule config and timetable from internal API
      const termsData = await (get() as any)._safeFetchJson(`/api/terms`)
      const termId: string | undefined = termsData?.terms?.[0]?.id
      let data = termId
        ? await (get() as any)._safeFetchJson(`/api/timetable?termId=${termId}&weekOffset=0`)
        : null
      if (!data && USE_LOCAL_JSON) {
        // Fallback to static demo JSON for local dev
        data = await (get() as any)._safeFetchJson(`/timetable/timetable.json`)
      }
      if (!data) throw new Error('No term found')
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
      // Use selected term (first term for now)
      const termsData = await (get() as any)._safeFetchJson(`/api/terms`)
      const termId: string | undefined = termsData?.terms?.[0]?.id
      let data = termId
        ? await (get() as any)._safeFetchJson(`/api/timetable?termId=${termId}&weekOffset=${isNext ? '1' : '0'}`)
        : null
      if (!data && USE_LOCAL_JSON) {
        data = await (get() as any)._safeFetchJson(`/timetable/timetable${isNext ? '-next' : ''}.json`)
      }
      if (!data) throw new Error('No term found')
      
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
      const termsData = await (get() as any)._safeFetchJson(`/api/terms`)
      const termId: string | undefined = termsData?.terms?.[0]?.id
      let data = termId
        ? await (get() as any)._safeFetchJson(`/api/timetable?termId=${termId}&weekOffset=${get().isNextWeek ? '1' : '0'}`)
        : null
      if (!data && USE_LOCAL_JSON) {
        data = await (get() as any)._safeFetchJson(`/timetable/timetable${get().isNextWeek ? '-next' : ''}.json`)
      }
      if (!data) throw new Error('No term found')
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
  },

  loadWeekly: async ({ termId, weekOffset = 0, classId, teacherId }) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams({ termId, weekOffset: String(weekOffset) })
      if (classId) params.set('classId', classId)
      if (teacherId) params.set('teacherId', teacherId)
      const data = await (get() as any)._safeFetchJson(`/api/timetable?${params.toString()}`)
      if (!data) throw new Error('Empty response')
      set({ timetableData: data })
    } catch (err) {
      set({ 
        error: err instanceof Error 
          ? `Failed to load timetable: ${err.message}`
          : 'Could not load timetable. Please try again.',
      })
    } finally {
      set({ isLoading: false })
    }
  }
})) 