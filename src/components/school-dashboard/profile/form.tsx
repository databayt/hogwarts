"use client"

import { useState, useTransition } from "react"
import { Link, Mail, MapPin } from "lucide-react"

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

interface SocialLinks {
  github?: string
  twitter?: string
  linkedin?: string
}

interface EditProfileFormProps {
  data: Record<string, unknown>
  onSave: () => void
  onCancel: () => void
  dictionary?: Record<string, any>
}

function getPronounsOptions(f?: Record<string, any>) {
  return [
    { value: "", label: f?.dontSpecify ?? "Don't specify" },
    { value: "they/them", label: "they/them" },
    { value: "she/her", label: "she/her" },
    { value: "he/him", label: "he/him" },
    { value: "custom", label: f?.custom ?? "Custom" },
  ]
}

const TIMEZONE_OPTIONS = [
  { value: "", label: "Select timezone" },
  { value: "UTC-12:00", label: "(UTC-12:00) Baker Island" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time" },
  { value: "UTC-07:00", label: "(UTC-07:00) Mountain Time" },
  { value: "UTC-06:00", label: "(UTC-06:00) Central Time" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time" },
  { value: "UTC+00:00", label: "(UTC+00:00) London" },
  { value: "UTC+01:00", label: "(UTC+01:00) Central Europe" },
  { value: "UTC+02:00", label: "(UTC+02:00) Eastern Europe" },
  { value: "UTC+03:00", label: "(UTC+03:00) Arabia Standard" },
  { value: "UTC+04:00", label: "(UTC+04:00) Gulf Standard" },
  { value: "UTC+05:00", label: "(UTC+05:00) Pakistan Standard" },
  { value: "UTC+05:30", label: "(UTC+05:30) India Standard" },
  { value: "UTC+08:00", label: "(UTC+08:00) China Standard" },
  { value: "UTC+09:00", label: "(UTC+09:00) Japan Standard" },
  { value: "UTC+10:00", label: "(UTC+10:00) Australia Eastern" },
]

export default function EditProfileForm({
  data,
  onSave,
  onCancel,
  dictionary,
}: EditProfileFormProps) {
  const f = dictionary?.form
  const fullName =
    `${(data.firstName as string) || ""} ${(data.lastName as string) || ""}`.trim()
  const existingSocial = (data.socialLinks as SocialLinks) || {}

  const [name, setName] = useState(fullName || (data.username as string) || "")
  const [bio, setBio] = useState((data.bio as string) || "")
  const [pronouns, setPronouns] = useState((data.pronouns as string) || "")
  const [customPronouns, setCustomPronouns] = useState("")
  const [company, setCompany] = useState((data.statusMessage as string) || "")
  const [location, setLocation] = useState((data.city as string) || "")
  const [showLocalTime, setShowLocalTime] = useState(
    !!(data.timezone as string)
  )
  const [timezone, setTimezone] = useState((data.timezone as string) || "")
  const [website, setWebsite] = useState((data.website as string) || "")
  const [socialGithub, setSocialGithub] = useState(existingSocial.github || "")
  const [socialTwitter, setSocialTwitter] = useState(
    existingSocial.twitter || ""
  )
  const [socialLinkedin, setSocialLinkedin] = useState(
    existingSocial.linkedin || ""
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const resolvedPronouns = pronouns === "custom" ? customPronouns : pronouns

      const result = await updateGitHubProfile({
        displayName: name || undefined,
        bio: bio || undefined,
        pronouns: resolvedPronouns || undefined,
        statusMessage: company || undefined,
        website: website || undefined,
        timezone: showLocalTime ? timezone || undefined : undefined,
        socialLinks: {
          github: socialGithub || "",
          twitter: socialTwitter || "",
          linkedin: socialLinkedin || "",
        },
      })

      if (result.success) {
        onSave()
      } else {
        setError(result.error || f?.failedToSave || "Failed to save")
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-name" className="text-xs font-semibold">
          {f?.name ?? "Name"}
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={f?.namePlaceholder ?? "Name"}
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-bio" className="text-xs font-semibold">
          {f?.bio ?? "Bio"}
        </Label>
        <Textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={f?.bioPlaceholder ?? "Tell us about yourself"}
          rows={3}
          className="resize-none"
        />
        <p className="text-muted-foreground text-xs">
          {f?.bioHint ??
            "You can @mention other users and organizations to link to them."}
        </p>
      </div>

      {/* Pronouns */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-pronouns" className="text-xs font-semibold">
          {f?.pronouns ?? "Pronouns"}
        </Label>
        <Select value={pronouns} onValueChange={setPronouns}>
          <SelectTrigger id="edit-pronouns">
            <SelectValue placeholder={f?.dontSpecify ?? "Don't specify"} />
          </SelectTrigger>
          <SelectContent>
            {getPronounsOptions(f).map((opt) => (
              <SelectItem
                key={opt.value || "empty"}
                value={opt.value || "none"}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pronouns === "custom" && (
          <Input
            value={customPronouns}
            onChange={(e) => setCustomPronouns(e.target.value)}
            placeholder={f?.customPronouns ?? "Custom pronouns"}
            className="mt-1.5"
          />
        )}
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-company" className="text-xs font-semibold">
          {f?.company ?? "Company"}
        </Label>
        <div className="flex items-center gap-2">
          <OcticonOrganization className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={f?.companyPlaceholder ?? "Company"}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-location" className="text-xs font-semibold">
          {f?.location ?? "Location"}
        </Label>
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={f?.locationPlaceholder ?? "Location"}
          />
        </div>
      </div>

      {/* Display local time */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <OcticonClock className="text-muted-foreground size-4 shrink-0" />
          <Checkbox
            id="edit-localtime"
            checked={showLocalTime}
            onCheckedChange={(checked) => setShowLocalTime(checked === true)}
          />
          <Label htmlFor="edit-localtime" className="cursor-pointer text-xs">
            {f?.displayLocalTime ?? "Display current local time"}
          </Label>
        </div>
        {showLocalTime && (
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="ms-6">
              <SelectValue
                placeholder={f?.selectTimezone ?? "Select timezone"}
              />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem
                  key={tz.value || "empty"}
                  value={tz.value || "none"}
                >
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{f?.email ?? "Email"}</Label>
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground size-4 shrink-0" />
          <Input
            value={(data.emailAddress as string) || ""}
            disabled
            className="opacity-60"
          />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-website" className="text-xs font-semibold">
          {f?.website ?? "Website"}
        </Label>
        <div className="flex items-center gap-2">
          <Link className="text-muted-foreground size-4 shrink-0" />
          <Input
            id="edit-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={f?.websitePlaceholder ?? "https://example.com"}
          />
        </div>
      </div>

      {/* Social accounts */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          {f?.socialAccounts ?? "Social accounts"}
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={socialGithub}
              onChange={(e) => setSocialGithub(e.target.value)}
              placeholder={f?.socialPlaceholder ?? "Link to social profile"}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={socialTwitter}
              onChange={(e) => setSocialTwitter(e.target.value)}
              placeholder={f?.socialPlaceholder ?? "Link to social profile"}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={socialLinkedin}
              onChange={(e) => setSocialLinkedin(e.target.value)}
              placeholder={f?.socialPlaceholder ?? "Link to social profile"}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? (f?.saving ?? "Saving...") : (f?.save ?? "Save")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          {f?.cancel ?? "Cancel"}
        </Button>
      </div>
    </div>
  )
}
