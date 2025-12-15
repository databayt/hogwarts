/**
 * Lead card component
 * Individual card view for a lead
 */

"use client"

import { useState } from "react"
import {
  Building,
  Calendar,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Mail,
  MoreVertical,
  Phone,
  Tag,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

import { deleteLead } from "./actions"
import { LEAD_SCORE_RANGES, LEAD_SOURCE, LEAD_STATUS } from "./constants"
import { Form } from "./form"
import type { Lead as LeadType } from "./types"

interface LeadCardProps {
  lead: LeadType
  onUpdate?: () => void
  onDelete?: () => void
  variant?: "default" | "compact"
  showActions?: boolean
}

// Simple time formatter
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export function LeadCard({
  lead,
  onUpdate,
  onDelete,
  variant = "default",
  showActions = true,
}: LeadCardProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return "bg-red-500"
    if (score >= LEAD_SCORE_RANGES.WARM.min) return "bg-orange-500"
    if (score >= LEAD_SCORE_RANGES.COOL.min) return "bg-yellow-500"
    return "bg-blue-500"
  }

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return LEAD_SCORE_RANGES.HOT.label
    if (score >= LEAD_SCORE_RANGES.WARM.min) return LEAD_SCORE_RANGES.WARM.label
    if (score >= LEAD_SCORE_RANGES.COOL.min) return LEAD_SCORE_RANGES.COOL.label
    return LEAD_SCORE_RANGES.COLD.label
  }

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead?")) return

    setIsDeleting(true)
    try {
      const result = await deleteLead(lead.id)
      if (result.success) {
        onDelete?.()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Copy email to clipboard
  const copyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email)
    }
  }

  // Copy phone to clipboard
  const copyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone)
    }
  }

  if (variant === "compact") {
    return (
      <>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="line-clamp-1 text-base">
                {lead.name}
              </CardTitle>
              <Badge className={`${getScoreColor(lead.score)} text-white`}>
                {lead.score}
              </Badge>
            </div>
            <CardDescription className="line-clamp-1 text-xs">
              {lead.company || "No company"} • {lead.email || "No email"}
            </CardDescription>
          </CardHeader>
        </Card>
        {showEdit && (
          <Form
            lead={lead}
            mode="edit"
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              onUpdate?.()
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {lead.name}
                <Badge variant="outline" className="text-xs">
                  {getScoreLabel(lead.score)}
                </Badge>
              </CardTitle>
              <CardDescription>
                {lead.title && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {lead.title}
                  </span>
                )}
                {lead.company && (
                  <span className="mt-1 flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {lead.company}
                  </span>
                )}
              </CardDescription>
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEdit(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {lead.email && (
                    <DropdownMenuItem onClick={copyEmail}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Email
                    </DropdownMenuItem>
                  )}
                  {lead.phone && (
                    <DropdownMenuItem onClick={copyPhone}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Phone
                    </DropdownMenuItem>
                  )}
                  {lead.linkedinUrl && (
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(lead.linkedinUrl ?? "", "_blank")
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open LinkedIn
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lead Score</span>
              <span className="font-medium">{lead.score}/100</span>
            </div>
            <Progress value={lead.score} className="h-2" />
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="text-muted-foreground h-4 w-4" />
                <a
                  href={`mailto:${lead.email}`}
                  className="truncate hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="text-muted-foreground h-4 w-4" />
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.phone}
                </a>
              </div>
            )}
          </div>

          {/* Status and Source */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">{LEAD_STATUS[lead.status]}</Badge>
            <Badge variant="secondary">{LEAD_SOURCE[lead.source]}</Badge>
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Notes Preview */}
          {lead.notes && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {lead.notes}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-4">
          <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatTimeAgo(new Date(lead.createdAt))}
            </div>
            {lead.lastContactedAt && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Last contact {formatTimeAgo(new Date(lead.lastContactedAt))}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Modals */}
      {showEdit && (
        <Form
          lead={lead}
          mode="edit"
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            onUpdate?.()
          }}
        />
      )}
    </>
  )
}
