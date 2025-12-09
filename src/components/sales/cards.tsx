/**
 * Cards view for leads
 * Displays leads in a card grid layout
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Phone,
  Building,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from './types';
import { LEAD_STATUS, LEAD_SOURCE, LEAD_SCORE_RANGES } from './constants';
import { deleteLead } from './actions';

interface CardsProps {
  leads: Lead[];
  isLoading?: boolean;
  onRefresh: () => void;
  onEditLead?: (lead: Lead) => void;
  dictionary?: Record<string, string>;
}

// Simple time ago formatter
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

export function Cards({ leads, isLoading, onRefresh, onEditLead, dictionary }: CardsProps) {
  const d = dictionary;

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
  const handleDelete = async (id: string) => {
    if (confirm(d?.confirmDelete || 'Are you sure you want to delete this lead?')) {
      const result = await deleteLead(id);
      if (result.success) {
        onRefresh();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{d?.loading || 'Loading leads...'}</div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        {d?.noLeadsFound || 'No leads found. Create your first lead to get started.'}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {lead.name}
                  {lead.verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditLead?.(lead)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {d?.edit || 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(lead.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {d?.delete || 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Score Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{d?.leadScore || 'Lead Score'}</span>
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
          </CardContent>

          <CardFooter className="pt-4">
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatTimeAgo(new Date(lead.createdAt))}
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
