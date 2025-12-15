"use client"

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  resumeApplicationSession,
  saveApplicationSession,
} from "@/components/site/admission/actions"

import {
  APPLY_STEPS,
  AUTO_SAVE_INTERVAL,
  type ApplyStep,
} from "./config.client"
import type {
  ApplicationFormData,
  ApplySessionState,
  PublicCampaign,
} from "./types"

// Convert step name to number index
const stepToIndex = (step: ApplyStep): number => {
  const index = APPLY_STEPS.indexOf(step)
  // Add 1 because the server expects 1-based (campaign=0, personal=1, etc.)
  return index >= 0 ? index + 1 : 1
}

interface ApplicationContextType {
  // School/Campaign info
  subdomain: string | null
  campaign: PublicCampaign | null
  setCampaign: (campaign: PublicCampaign | null) => void

  // Session state
  session: ApplySessionState

  // Session management
  initSession: (campaignId: string, subdomain: string) => Promise<void>
  loadSession: (token: string) => Promise<boolean>

  // Form data management
  updateStepData: <T extends keyof ApplySessionState["formData"]>(
    step: T,
    data: ApplySessionState["formData"][T]
  ) => void
  getStepData: <T extends keyof ApplySessionState["formData"]>(
    step: T
  ) => ApplySessionState["formData"][T] | undefined

  // Auto-save
  saveSession: () => Promise<void>
  markDirty: () => void

  // Navigation
  setCurrentStep: (step: ApplyStep) => void

  // Error handling
  clearError: () => void
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
)

export const useApplication = () => {
  const context = useContext(ApplicationContext)
  if (!context) {
    throw new Error("useApplication must be used within an ApplicationProvider")
  }
  return context
}

interface ApplicationProviderProps {
  children: ReactNode
  initialSubdomain?: string
  initialCampaignId?: string
  initialSessionToken?: string
}

const STORAGE_KEY = "hogwarts_apply_session"

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({
  children,
  initialSubdomain,
  initialCampaignId,
  initialSessionToken,
}) => {
  const [subdomain, setSubdomain] = useState<string | null>(
    initialSubdomain || null
  )
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)

  const [session, setSession] = useState<ApplySessionState>({
    sessionToken: initialSessionToken || null,
    campaignId: initialCampaignId || null,
    formData: {},
    currentStep: "personal",
    lastSaved: null,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    error: null,
  })

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize session for a new application
  const initSession = useCallback(
    async (campaignId: string, subdomainValue: string) => {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }))
      setSubdomain(subdomainValue)

      try {
        // Create a new session or restore from localStorage
        const storedSession = localStorage.getItem(
          `${STORAGE_KEY}_${campaignId}`
        )
        if (storedSession) {
          const parsed = JSON.parse(storedSession)
          setSession((prev) => ({
            ...prev,
            ...parsed,
            campaignId,
            isLoading: false,
          }))
        } else {
          setSession((prev) => ({
            ...prev,
            campaignId,
            formData: {},
            currentStep: "personal",
            isLoading: false,
          }))
        }
      } catch {
        setSession((prev) => ({
          ...prev,
          campaignId,
          isLoading: false,
        }))
      }
    },
    []
  )

  // Load existing session from token
  const loadSession = useCallback(async (token: string): Promise<boolean> => {
    setSession((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await resumeApplicationSession(token)

      if (result.success && result.data) {
        const data = result.data
        setSession((prev) => ({
          ...prev,
          sessionToken: token,
          campaignId: data.campaignId || null,
          formData: data.formData as ApplySessionState["formData"],
          currentStep:
            (data.formData as { currentStep?: ApplyStep })?.currentStep ||
            "personal",
          isLoading: false,
        }))
        return true
      } else {
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Failed to load session",
        }))
        return false
      }
    } catch (error) {
      setSession((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load session",
      }))
      return false
    }
  }, [])

  // Update step data
  const updateStepData = useCallback(
    <T extends keyof ApplySessionState["formData"]>(
      step: T,
      data: ApplySessionState["formData"][T]
    ) => {
      setSession((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          [step]: data,
        },
        isDirty: true,
      }))
    },
    []
  )

  // Get step data
  const getStepData = useCallback(
    <T extends keyof ApplySessionState["formData"]>(
      step: T
    ): ApplySessionState["formData"][T] | undefined => {
      return session.formData[step]
    },
    [session.formData]
  )

  // Save session to server and localStorage
  const saveSession = useCallback(async () => {
    if (!subdomain || !session.campaignId) return

    setSession((prev) => ({ ...prev, isSaving: true }))

    try {
      // Flatten form data for server (ApplicationFormData is flat)
      const flatFormData: Partial<ApplicationFormData> = {
        campaignId: session.campaignId,
        ...session.formData.personal,
        ...session.formData.contact,
        ...session.formData.guardian,
        ...session.formData.academic,
        photoUrl: session.formData.documents?.photoUrl,
        signatureUrl: session.formData.documents?.signatureUrl,
        documents: session.formData.documents?.documents,
      }

      // Get email from contact step for session
      const email = session.formData.contact?.email || ""

      const result = await saveApplicationSession(
        subdomain,
        {
          formData: flatFormData,
          currentStep: stepToIndex(session.currentStep),
          email,
          campaignId: session.campaignId,
        },
        session.sessionToken || undefined
      )

      if (result.success && result.data) {
        const newToken = result.data.sessionToken

        // Save to localStorage as backup
        localStorage.setItem(
          `${STORAGE_KEY}_${session.campaignId}`,
          JSON.stringify({
            sessionToken: newToken,
            formData: session.formData,
            currentStep: session.currentStep,
          })
        )

        setSession((prev) => ({
          ...prev,
          sessionToken: newToken,
          lastSaved: new Date(),
          isDirty: false,
          isSaving: false,
        }))
      } else {
        setSession((prev) => ({
          ...prev,
          isSaving: false,
          error: result.error || "Failed to save",
        }))
      }
    } catch (error) {
      setSession((prev) => ({
        ...prev,
        isSaving: false,
        error: "Failed to save session",
      }))
    }
  }, [
    subdomain,
    session.campaignId,
    session.formData,
    session.currentStep,
    session.sessionToken,
  ])

  // Mark session as dirty (needs saving)
  const markDirty = useCallback(() => {
    setSession((prev) => ({ ...prev, isDirty: true }))
  }, [])

  // Set current step
  const setCurrentStep = useCallback((step: ApplyStep) => {
    setSession((prev) => ({ ...prev, currentStep: step }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setSession((prev) => ({ ...prev, error: null }))
  }, [])

  // Auto-save effect
  useEffect(() => {
    if (session.isDirty && !session.isSaving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer for auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        saveSession()
      }, AUTO_SAVE_INTERVAL)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [session.isDirty, session.isSaving, saveSession])

  // Unsaved changes warning - prevent accidental navigation/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session.isDirty) {
        // Standard way to trigger the browser's confirmation dialog
        e.preventDefault()
        // For older browsers
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [session.isDirty])

  // Load initial session if token provided
  useEffect(() => {
    if (initialSessionToken && !session.formData.personal) {
      loadSession(initialSessionToken)
    }
  }, [initialSessionToken, loadSession, session.formData.personal])

  const value = useMemo(
    () => ({
      subdomain,
      campaign,
      setCampaign,
      session,
      initSession,
      loadSession,
      updateStepData,
      getStepData,
      saveSession,
      markDirty,
      setCurrentStep,
      clearError,
    }),
    [
      subdomain,
      campaign,
      session,
      initSession,
      loadSession,
      updateStepData,
      getStepData,
      saveSession,
      markDirty,
      setCurrentStep,
      clearError,
    ]
  )

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  )
}
