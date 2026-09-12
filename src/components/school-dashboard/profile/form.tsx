"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Link as LinkIcon, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { OcticonClock, OcticonOrganization } from "@/components/atom/icons"

import { updateGitHubProfile } from "./actions"
import type { ProfileViewData } from "./queries"

interface EditProfileFormProps {
  data: ProfileViewData
  onSave: () => void
  onCancel: () => void
  dictionary?: Record<string, any>
}

function getPronounsOptions(f?: Record<string, any>) {
  return [
    { value: "none", label: f?.dontSpecify ?? "" },
    { value: "they/them", label: "they/them" },
    { value: "she/her", label: "she/her" },
    { value: "he/him", label: "he/him" },
    { value: "custom", label: f?.custom ?? "" },
  ]
}

// UTC offset values; the human label is the offset itself (locale-neutral).
const TIMEZONE_VALUES = [
  "UTC-12:00",
  "UTC-08:00",
  "UTC-05:00",
  "UTC+00:00",
  "UTC+01:00",
  "UTC+02:00",
  "UTC+03:00",
  "UTC+04:00",
  "UTC+05:30",
  "UTC+08:00",
  "UTC+09:00",
]

const SOCIAL_FIELDS = [
  { key: "github", label: "GitHub" },
  { key: "twitter", label: "Twitter / X" },
  { key: "linkedin", label: "LinkedIn" },
] as const

const ERROR_MAP: Record<string, string> = {
  VALIDATION_ERROR: "validation",
  NOT_AUTHENTICATED: "auth",
  UPDATE_FAILED: "save",
  UPLOAD_FAILED: "upload",
  INVALID_FILE_TYPE: "fileType",
}

export default function EditProfileForm({
  data,
  onSave,
  onCancel,
  dictionary,
}: EditProfileFormProps) {
  const f = dictionary?.form
  const router = useRouter()

  const existingSocial = data.socialLinks ?? {}
  const [name, setName] = useState(data.displayName || "")
  const [bio, setBio] = useState(data.bio || "")
  const [pronouns, setPronouns] = useState(data.pronouns || "none")
  const [customPronouns, setCustomPronouns] = useState("")
  const [company, setCompany] = useState(data.statusMessage || "")
  const [showLocalTime, setShowLocalTime] = useState(!!data.timezone)
  const [timezone, setTimezone] = useState(data.timezone || "")
  const [website, setWebsite] = useState(data.website || "")
  const [social, setSocial] = useState<Record<string, string>>({
    github: existingSocial.github || "",
    twitter: existingSocial.twitter || "",
    linkedin: existingSocial.linkedin || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resolveError(code?: string): string {
    if (!code) return f?.failedToSave ?? ""
    const key = ERROR_MAP[code]
    return f?.errors?.[key] ?? f?.failedToSave ?? ""
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const resolvedPronouns =
        pronouns === "custom"
          ? customPronouns
          : pronouns === "none"
            ? ""
            : pronouns
      const result = await updateGitHubProfile({
        displayName: name || undefined,
        bio: bio || undefined,
        pronouns: resolvedPronouns || undefined,
        statusMessage: company || undefined,
        website: website || undefined,
        timezone: showLocalTime ? timezone || undefined : undefined,
        socialLinks: {
          github: social.github || "",
          twitter: social.twitter || "",
          linkedin: social.linkedin || "",
        },
      })
      if (result.success) {
        router.refresh()
        onSave()
      } else {
        setError(resolveError(result.error))
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-name"
          className="text-base font-semibold md:text-xs"
        >
          {f?.name ?? ""}
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={f?.namePlaceholder ?? ""}
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-bio"
          className="text-base font-semibold md:text-xs"
        >
          {f?.bio ?? ""}
        </Label>
        <Textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={f?.bioPlaceholder ?? ""}
          rows={3}
          maxLength={500}
          className="resize-none"
          aria-describedby="edit-bio-hint"
        />
        <p id="edit-bio-hint" className="text-muted-foreground text-xs">
          {f?.bioHint ?? ""}
        </p>
      </div>

      {/* Pronouns */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-pronouns"
          className="text-base font-semibold md:text-xs"
        >
          {f?.pronouns ?? ""}
        </Label>
        <Select value={pronouns} onValueChange={setPronouns}>
          <SelectTrigger id="edit-pronouns">
            <SelectValue placeholder={f?.dontSpecify ?? ""} />
          </SelectTrigger>
          <SelectContent>
            {getPronounsOptions(f).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pronouns === "custom" && (
          <>
            <Label htmlFor="edit-custom-pronouns" className="sr-only">
              {f?.customPronouns ?? ""}
            </Label>
            <Input
              id="edit-custom-pronouns"
              value={customPronouns}
              onChange={(e) => setCustomPronouns(e.target.value)}
              placeholder={f?.customPronouns ?? ""}
              className="mt-1.5"
            />
          </>
        )}
      </div>

      {/* Company / status */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-company"
          className="text-base font-semibold md:text-xs"
        >
          {f?.company ?? ""}
        </Label>
        <div className="flex items-center gap-2">
          <OcticonOrganization className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={f?.companyPlaceholder ?? ""}
          />
        </div>
      </div>

      {/* Local time */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <OcticonClock className="text-muted-foreground size-4 shrink-0" />
          <Checkbox
            id="edit-localtime"
            checked={showLocalTime}
            onCheckedChange={(checked) => setShowLocalTime(checked === true)}
          />
          <Label
            htmlFor="edit-localtime"
            className="cursor-pointer text-base md:text-xs"
          >
            {f?.displayLocalTime ?? ""}
          </Label>
        </div>
        {showLocalTime && (
          <>
            <Label htmlFor="edit-timezone" className="sr-only">
              {f?.selectTimezone ?? ""}
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="edit-timezone" className="ms-6">
                <SelectValue placeholder={f?.selectTimezone ?? ""} />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_VALUES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-email"
          className="text-base font-semibold md:text-xs"
        >
          {f?.email ?? ""}
        </Label>
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-email"
            value={data.email || ""}
            disabled
            className="opacity-60"
          />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <Label
          htmlFor="edit-website"
          className="text-base font-semibold md:text-xs"
        >
          {f?.website ?? ""}
        </Label>
        <div className="flex items-center gap-2">
          <LinkIcon className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={f?.websitePlaceholder ?? ""}
          />
        </div>
      </div>

      {/* Social accounts */}
      <div className="space-y-1.5">
        <span className="text-base font-semibold md:text-xs">
          {f?.socialAccounts ?? ""}
        </span>
        <div className="space-y-2">
          {SOCIAL_FIELDS.map((sf) => (
            <div key={sf.key} className="flex items-center gap-2">
              <LinkIcon className="text-muted-foreground size-4 shrink-0" />
              <Label htmlFor={`edit-social-${sf.key}`} className="sr-only">
                {sf.label}
              </Label>
              <Input
                id={`edit-social-${sf.key}`}
                type="url"
                value={social[sf.key]}
                onChange={(e) =>
                  setSocial((s) => ({ ...s, [sf.key]: e.target.value }))
                }
                placeholder={sf.label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? (f?.saving ?? "") : (f?.save ?? "")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          {f?.cancel ?? ""}
        </Button>
      </div>
    </div>
  )
}
