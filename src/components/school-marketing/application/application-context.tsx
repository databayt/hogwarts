"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

import type { NameFormat } from "@/lib/name-utils"
import {
  getDraftApplicationsByUser,
  resumeApplicationSession,
  saveApplicationSession,
} from "@/components/school-marketing/admission/actions"

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

// Re-nest flat server formData into step-based structure
// The server stores flat keys; the client needs them grouped by step
const ATTACHMENT_KEYS = [
  "profilePhotoUrl",
  "degreeUrl",
  "transcriptUrl",
  "idUrl",
  "resumeUrl",
  "otherUrl",
] as const
const PERSONAL_KEYS = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "nationality",
  "religion",
  "category",
  "phone",
  "whatsapp",
] as const
const CONTACT_KEYS = ["email", "phone", "alternatePhone"] as const
const LOCATION_KEYS = [
  "address",
  "city",
  "state",
  "postalCode",
  "country",
] as const
const GUARDIAN_KEYS = [
  "fatherName",
  "fatherOccupation",
  "fatherPhone",
  "fatherEmail",
  "motherName",
  "motherOccupation",
  "motherPhone",
  "motherEmail",
  "guardianName",
  "guardianRelation",
  "guardianPhone",
  "guardianEmail",
] as const
const ACADEMIC_KEYS = [
  "previousSchool",
  "previousClass",
  "previousMarks",
  "previousPercentage",
  "achievements",
  "applyingForClass",
  "preferredStream",
  "secondLanguage",
  "thirdLanguage",
] as const

function reNestFormData(
  flat: Record<string, unknown>
): ApplySessionState["formData"] {
  // If already nested (has step keys), return as-is
  if (flat.attachments || flat.personal || flat.contact) {
    return flat as ApplySessionState["formData"]
  }

  const pick = (keys: readonly string[]) => {
    const obj: Record<string, unknown> = {}
    let found = false
    for (const k of keys) {
      if (flat[k] !== undefined && flat[k] !== null && flat[k] !== "") {
        obj[k] = flat[k]
        found = true
      }
    }
    return found ? obj : undefined
  }

  // Also map photoUrl -> profilePhotoUrl for backward compat
  if (flat.photoUrl && !flat.profilePhotoUrl) {
    flat.profilePhotoUrl = flat.photoUrl
  }

  return {
    attachments: pick(
      ATTACHMENT_KEYS
    ) as ApplySessionState["formData"]["attachments"],
    personal: pick(PERSONAL_KEYS) as ApplySessionState["formData"]["personal"],
    contact: pick(CONTACT_KEYS) as ApplySessionState["formData"]["contact"],
    location: pick(LOCATION_KEYS) as ApplySessionState["formData"]["location"],
    guardian: pick(GUARDIAN_KEYS) as ApplySessionState["formData"]["guardian"],
    academic: pick(ACADEMIC_KEYS) as ApplySessionState["formData"]["academic"],
  }
}

interface ApplySessionContextType {
  // School/Campaign info
  subdomain: string | null
  campaign: PublicCampaign | null
  setCampaign: (campaign: PublicCampaign | null) => void
  nameFormat: NameFormat

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
  saveSession: () => Promise<string | null>
  markDirty: () => void

  // Navigation
  setCurrentStep: (step: ApplyStep) => void

  // Clear the locally cached draft (after a successful submit)
  clearLocalDraft: () => void

  // Error handling
  clearError: () => void
}

const ApplySessionContext = createContext<ApplySessionContextType | undefined>(
  undefined
)

export const useApplySession = () => {
  const context = useContext(ApplySessionContext)
  if (!context) {
    throw new Error(
      "useApplySession must be used within an ApplySessionProvider"
    )
  }
  return context
}

// Legacy alias for backward compatibility during migration
export const useApplication = useApplySession

interface ApplySessionProviderProps {
  children: ReactNode
  initialSubdomain?: string
  initialCampaignId?: string
  initialSessionToken?: string
  nameFormat?: NameFormat
}

const STORAGE_KEY = "hogwarts_apply_session"

// Build a localStorage key scoped to both the campaign AND the current user so
// drafts never leak between accounts sharing a browser. An anonymous visitor
// gets a stable bucket ("anon") — they'll see their own draft until they sign
// in, at which point a new per-user bucket is used.
// Why: previously the key was only keyed by campaignId, so any second user on
// the same browser would restore the first user's cached formData (names,
// phone numbers, uploaded attachment URLs) into a "fresh" application.
const buildStorageKey = (campaignId: string, userId: string | null): string =>
  `${STORAGE_KEY}_${campaignId}_${userId ?? "anon"}`

// Reads the `?token=` query param and reports it up to the provider. Isolated
// into its own component (rather than calling useSearchParams() directly in
// ApplySessionProvider) so only this invisible leaf needs the <Suspense>
// boundary useSearchParams() requires — the rest of the wizard subtree keeps
// rendering normally instead of bailing out to full CSR.
function ResumeTokenFromUrl({
  onToken,
}: {
  onToken: (token: string | null) => void
}) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    onToken(token)
  }, [token, onToken])

  return null
}

export const ApplySessionProvider: React.FC<ApplySessionProviderProps> = ({
  children,
  initialSubdomain,
  initialCampaignId,
  initialSessionToken,
  nameFormat: initialNameFormat = "full",
}) => {
  const { data: authSession } = useSession()
  const userId = authSession?.user?.id ?? null
  const [subdomain, setSubdomain] = useState<string | null>(
    initialSubdomain || null
  )
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)

  // Fallback resume token read from the URL (?token=) when no
  // initialSessionToken prop was passed in — see ResumeTokenFromUrl above.
  const [urlToken, setUrlToken] = useState<string | null>(null)
  const handleUrlToken = useCallback((token: string | null) => {
    setUrlToken(token)
  }, [])

  const [session, setSession] = useState<ApplySessionState>({
    sessionToken: initialSessionToken || null,
    campaignId: initialCampaignId || null,
    formData: {},
    currentStep: "attachments",
    lastSaved: null,
    isDirty: false,
    isLoading: false,
    isSaving: false,
    error: null,
  })

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load existing session from token — defined BEFORE initSession because
  // initSession's server-draft fallback references it (useCallback deps).
  const loadSession = useCallback(
    async (token: string): Promise<boolean> => {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const result = await resumeApplicationSession(
          token,
          subdomain ?? undefined
        )

        if (result.success && result.data) {
          const data = result.data
          setSession((prev) => ({
            ...prev,
            sessionToken: token,
            campaignId: data.campaignId || null,
            formData: reNestFormData(data.formData as Record<string, unknown>),
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
            error: result.error || "FAILED_TO_LOAD_SESSION",
          }))
          return false
        }
      } catch (error) {
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          error: "FAILED_TO_LOAD_SESSION",
        }))
        return false
      }
    },
    [subdomain]
  )

  // Initialize session for a new application
  const initSession = useCallback(
    async (campaignId: string, subdomainValue: string) => {
      setSession((prev) => ({ ...prev, isLoading: true, error: null }))
      setSubdomain(subdomainValue)

      try {
        // Clear any pre-existing unnamespaced entry from the old leaky format
        // so returning users on an affected browser start clean.
        localStorage.removeItem(`${STORAGE_KEY}_${campaignId}`)

        // Read from the per-user bucket — never from another user's.
        const storageKey = buildStorageKey(campaignId, userId)
        const storedSession = localStorage.getItem(storageKey)
        if (storedSession) {
          try {
            const parsed = JSON.parse(storedSession)
            // Validate parsed data has expected shape before spreading
            if (
              parsed &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              setSession((prev) => ({
                ...prev,
                ...parsed,
                campaignId,
                isLoading: false,
              }))
            } else {
              // Invalid stored data — start fresh
              setSession((prev) => ({
                ...prev,
                campaignId,
                formData: {},
                currentStep: "attachments",
                isLoading: false,
              }))
            }
          } catch {
            // Corrupted localStorage — start fresh
            localStorage.removeItem(storageKey)
            setSession((prev) => ({
              ...prev,
              campaignId,
              formData: {},
              currentStep: "attachments",
              isLoading: false,
            }))
          }
        } else {
          // No local draft — before blanking, ask the server. Auto-save keeps
          // an ApplicationSession row per user+campaign, and losing
          // localStorage (new device, cleared storage, private mode) must not
          // silently reset a half-finished application. Skipped when a
          // ?token= resume is in flight — that explicit token owns hydration
          // and this lookup must not race it onto a different draft.
          const hasUrlToken =
            typeof window !== "undefined" &&
            !!new URLSearchParams(window.location.search).get("token")
          if (userId && !hasUrlToken) {
            try {
              const drafts = await getDraftApplicationsByUser(
                subdomainValue,
                userId
              )
              const match =
                drafts.success && drafts.data
                  ? drafts.data.find((d) => d.campaignId === campaignId)
                  : undefined
              if (match && (await loadSession(match.sessionToken))) {
                return
              }
            } catch {
              // Server lookup failed — fall through to a fresh session
            }
          }
          setSession((prev) => ({
            ...prev,
            campaignId,
            formData: {},
            currentStep: "attachments",
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
    [userId, loadSession]
  )

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
  // Returns the session token on success, null on failure
  const saveSession = useCallback(async (): Promise<string | null> => {
    if (!subdomain || !session.campaignId) return null

    setSession((prev) => ({ ...prev, isSaving: true }))

    try {
      // Flatten form data for server (ApplicationFormData is flat)
      const flatFormData: Partial<ApplicationFormData> = {
        campaignId: session.campaignId,
        ...session.formData.attachments,
        ...session.formData.personal,
        ...session.formData.contact,
        ...session.formData.location,
        ...session.formData.guardian,
        ...session.formData.academic,
        photoUrl: session.formData.attachments?.profilePhotoUrl,
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

        // Save to localStorage as backup (scoped per-user so drafts don't leak)
        localStorage.setItem(
          buildStorageKey(session.campaignId, userId),
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

        return newToken
      } else {
        setSession((prev) => ({
          ...prev,
          isSaving: false,
          error: result.error || "FAILED_TO_SAVE",
        }))
        return null
      }
    } catch (error) {
      setSession((prev) => ({
        ...prev,
        isSaving: false,
        error: "FAILED_TO_SAVE_SESSION",
      }))
      return null
    }
  }, [
    subdomain,
    session.campaignId,
    session.formData,
    session.currentStep,
    session.sessionToken,
    userId,
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

  // Clear the locally cached draft for the current campaign + user. Called
  // after a successful submit so the just-submitted draft can't be restored
  // from localStorage. Mirrors the per-user key built by buildStorageKey —
  // the old cleanup removed only the legacy unnamespaced key and left the
  // real per-user draft behind.
  const clearLocalDraft = useCallback(() => {
    try {
      const campaignId = session.campaignId
      if (campaignId) {
        localStorage.removeItem(buildStorageKey(campaignId, userId))
        // Also clear the legacy unnamespaced key from the old leaky format.
        localStorage.removeItem(`${STORAGE_KEY}_${campaignId}`)
      }
    } catch {
      // localStorage may not be available
    }
  }, [session.campaignId, userId])

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

  // Load initial session if a token was provided — either as a prop (server
  // rendered) or as a `?token=` query param (resume links / resumed drafts
  // land on a step page with the token in the URL, not as a prop).
  const resumeToken = initialSessionToken || urlToken
  useEffect(() => {
    if (resumeToken && !session.formData.personal) {
      loadSession(resumeToken)
    }
  }, [resumeToken, loadSession, session.formData.personal])

  const value = useMemo(
    () => ({
      subdomain,
      campaign,
      setCampaign,
      nameFormat: initialNameFormat,
      session,
      initSession,
      loadSession,
      updateStepData,
      getStepData,
      saveSession,
      markDirty,
      setCurrentStep,
      clearError,
      clearLocalDraft,
    }),
    [
      subdomain,
      campaign,
      initialNameFormat,
      session,
      initSession,
      loadSession,
      updateStepData,
      getStepData,
      saveSession,
      markDirty,
      setCurrentStep,
      clearError,
      clearLocalDraft,
    ]
  )

  return (
    <ApplySessionContext.Provider value={value}>
      <Suspense fallback={null}>
        <ResumeTokenFromUrl onToken={handleUrlToken} />
      </Suspense>
      {children}
    </ApplySessionContext.Provider>
  )
}

// Legacy alias for backward compatibility during migration
export const ApplicationProvider = ApplySessionProvider
