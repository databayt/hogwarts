/**
 * All leads list view component
 * Displays all leads in a table format with filtering and sorting
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Search, MoreHorizontal, Eye, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import type { Lead, LeadFilters } from './types';
import { LEAD_STATUS, LEAD_SOURCE, LEAD_SCORE_RANGES } from './constants';
import { deleteLead } from './actions';

interface AllProps {
  leads: Lead[];
  isLoading: boolean;
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  selectedLeads: string[];
  onSelectionChange: (ids: string[]) => void;
  onRefresh: () => void;
  onEditLead?: (lead: Lead) => void;
  dictionary?: Record<string, string>;
}

// Simplified time formatter
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'w', seconds: 604800 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
    { label: 's', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label}`;
    }
  }

  return 'now';
}

export function All({
  leads,
  isLoading,
  filters,
  onFiltersChange,
  selectedLeads,
  onSelectionChange,
  onRefresh,
  onEditLead,
  dictionary,
}: AllProps) {
  const d = dictionary;
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(leads.map(l => l.id));
    }
  };

  // Handle single selection
  const handleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      onSelectionChange(selectedLeads.filter(lid => lid !== id));
    } else {
      onSelectionChange([...selectedLeads, id]);
    }
  };

  // Sort leads
  const sortedLeads = useMemo(() => {
    const sorted = [...leads].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  // Get score variant
  const getScoreVariant = (score: number): "default" | "destructive" | "secondary" | "outline" => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return 'destructive';
    if (score >= LEAD_SCORE_RANGES.WARM.min) return 'default';
    if (score >= LEAD_SCORE_RANGES.COOL.min) return 'secondary';
    return 'outline';
  };

  // Get status variant
  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONTACTED': return 'secondary';
      case 'QUALIFIED': return 'outline';
      case 'CLOSED_WON': return 'default';
      case 'CLOSED_LOST': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{d?.loading || 'Loading leads...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={d?.searchPlaceholder || "Search leads..."}
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[120px] h-9 px-3">
              {filters.status ? LEAD_STATUS[filters.status] : (d?.allStatuses || 'Status')}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, status: undefined })}>
              {d?.allStatuses || 'All Statuses'}
            </DropdownMenuItem>
            {Object.entries(LEAD_STATUS).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onFiltersChange({ ...filters, status: key as keyof typeof LEAD_STATUS })}
              >
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[120px] h-9 px-3">
              {filters.source ? LEAD_SOURCE[filters.source] : (d?.allSources || 'Source')}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, source: undefined })}>
              {d?.allSources || 'All Sources'}
            </DropdownMenuItem>
            {Object.entries(LEAD_SOURCE).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onFiltersChange({ ...filters, source: key as keyof typeof LEAD_SOURCE })}
              >
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableHeader className="bg-foreground">
            <TableRow className="hover:bg-foreground border-b h-14">
              <TableHead className="w-12 text-background py-4 px-2 first:pl-4 last:pr-4">
                <Checkbox
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer text-background py-4 px-2 min-w-[100px]" onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-background py-4 px-2 min-w-[150px]" onClick={() => handleSort('email')}>
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-background py-4 px-2 min-w-[120px]" onClick={() => handleSort('company')}>
                Company {sortField === 'company' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-background py-4 px-2 text-center" onClick={() => handleSort('score')}>
                Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-background py-4 px-2">Status</TableHead>
              <TableHead className="text-background py-4 px-2">Source</TableHead>
              <TableHead className="cursor-pointer text-background py-4 px-2 text-center" onClick={() => handleSort('createdAt')}>
                Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-background py-4 px-2 last:pr-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.map((lead) => (
              <TableRow key={lead.id} className="border-b hover:bg-muted/50">
                <TableCell className="px-2 first:pl-4">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => handleSelectLead(lead.id)}
                  />
                </TableCell>
                <TableCell className="font-medium px-2 min-w-[100px] max-w-[150px]" title={lead.name}>
                  <div className="flex items-center gap-1 truncate">
                    <span className="truncate">{lead.name}</span>
                    {lead.verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </div>
                </TableCell>
                <TableCell className="px-2 min-w-[150px] truncate max-w-[200px]" title={lead.email || '-'}>{lead.email || '-'}</TableCell>
                <TableCell className="px-2 min-w-[120px] truncate max-w-[180px]" title={lead.company || '-'}>{lead.company || '-'}</TableCell>
                <TableCell className="px-2 text-center">
                  <Badge variant={getScoreVariant(lead.score)}>
                    {lead.score}
                  </Badge>
                </TableCell>
                <TableCell className="px-2">
                  <Badge variant={getStatusVariant(lead.status)}>
                    {LEAD_STATUS[lead.status]}
                  </Badge>
                </TableCell>
                <TableCell className="px-2">{LEAD_SOURCE[lead.source]}</TableCell>
                <TableCell className="px-2 text-center">
                  {formatTimeAgo(new Date(lead.createdAt))}
                </TableCell>
                <TableCell className="px-2 last:pr-4">
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditLead?.(lead)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {d?.edit || 'Edit'}
                        </DropdownMenuItem>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {leads.length === 0 && (
        <div className="mt-4 p-8 text-center text-muted-foreground rounded-lg bg-muted/30">
          {d?.noLeadsFound || 'No leads found. Create your first lead to get started.'}
        </div>
      )}
    </div>
  );
}
