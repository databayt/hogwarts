/**
 * Lead card component
 * Individual card view for a lead
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Phone,
  Building,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  Calendar,
  Tag,
  TrendingUp,
} from 'lucide-react';
import type { Lead as LeadType } from './types';
import { LEAD_STATUS, LEAD_SOURCE, LEAD_SCORE_RANGES } from './constants';
import { Form } from './form';
import { deleteLead } from './actions';

interface LeadCardProps {
  lead: LeadType;
  onUpdate?: () => void;
  onDelete?: () => void;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

// Simple time formatter
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function LeadCard({
  lead,
  onUpdate,
  onDelete,
  variant = 'default',
  showActions = true,
}: LeadCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return 'bg-red-500';
    if (score >= LEAD_SCORE_RANGES.WARM.min) return 'bg-orange-500';
    if (score >= LEAD_SCORE_RANGES.COOL.min) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return LEAD_SCORE_RANGES.HOT.label;
    if (score >= LEAD_SCORE_RANGES.WARM.min) return LEAD_SCORE_RANGES.WARM.label;
    if (score >= LEAD_SCORE_RANGES.COOL.min) return LEAD_SCORE_RANGES.COOL.label;
    return LEAD_SCORE_RANGES.COLD.label;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteLead(lead.id);
      if (result.success) {
        onDelete?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy email to clipboard
  const copyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
    }
  };

  // Copy phone to clipboard
  const copyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base line-clamp-1">{lead.name}</CardTitle>
              <Badge className={`${getScoreColor(lead.score)} text-white`}>
                {lead.score}
              </Badge>
            </div>
            <CardDescription className="text-xs line-clamp-1">
              {lead.company || 'No company'} • {lead.email || 'No email'}
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
              setShowEdit(false);
              onUpdate?.();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
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
                  <span className="flex items-center gap-1 mt-1">
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
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {lead.email && (
                    <DropdownMenuItem onClick={copyEmail}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Email
                    </DropdownMenuItem>
                  )}
                  {lead.phone && (
                    <DropdownMenuItem onClick={copyPhone}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Phone
                    </DropdownMenuItem>
                  )}
                  {lead.linkedinUrl && (
                    <DropdownMenuItem onClick={() => window.open(lead.linkedinUrl ?? '', '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open LinkedIn
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
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
            <Badge variant="outline">
              {LEAD_STATUS[lead.status]}
            </Badge>
            <Badge variant="secondary">
              {LEAD_SOURCE[lead.source]}
            </Badge>
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Notes Preview */}
          {lead.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lead.notes}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-4">
          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
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
            setShowEdit(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
