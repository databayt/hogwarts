"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { SchoolCard } from './card';
import { useUserSchools } from './use-onboarding';
import type { OnboardingSchoolData } from './types';
import { exportSchoolsToCSV } from './column';
import { SCHOOL_CATEGORIES } from "./config";

interface AllSchoolsProps {
  onSchoolClick?: (school: OnboardingSchoolData) => void;
  onCreateNew?: () => void;
  showActions?: boolean;
}

export default function AllSchools({ 
  onSchoolClick, 
  onCreateNew, 
  showActions = true 
}: AllSchoolsProps) {
  const { schools, isLoading, error, refreshSchools } = useUserSchools();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');

  // Filter and sort schools
  const filteredAndSortedSchools = useMemo(() => {
    const filtered = schools.filter(school => {
      const matchesSearch = !searchQuery || 
        school.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.city?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || school.schoolType === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // Sort schools
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'created':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
    });

    return filtered;
  }, [schools, searchQuery, typeFilter, sortBy]);

  const handleExport = () => {
    exportSchoolsToCSV(filteredAndSortedSchools);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">
            Failed to load schools: {error}
          </p>
          <Button onClick={refreshSchools} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>All Schools</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedSchools.length} of {schools.length} schools
          </p>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 me-2" />
              Export
            </Button>
            {onCreateNew && (
              <Button onClick={onCreateNew} size="sm">
                <Plus className="h-4 w-4 me-2" />
                New School
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools by name, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 me-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {SCHOOL_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {(searchQuery || typeFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ms-1 hover:bg-muted rounded"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {SCHOOL_CATEGORIES.find(c => c.value === typeFilter)?.label}
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="ms-1 hover:bg-muted rounded"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schools Grid */}
      {filteredAndSortedSchools.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground mb-4">
              {schools.length === 0 ? (
                <>
                  <h5 className="mb-2">No schools yet</h5>
                  <p>Create your first school to get started with the onboarding process.</p>
                </>
              ) : (
                <>
                  <h5 className="mb-2">No schools match your filters</h5>
                  <p>Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
            {onCreateNew && schools.length === 0 && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 me-2" />
                Create First School
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedSchools.map(school => (
            <SchoolCard
              key={school.id}
              school={school}
              onClick={onSchoolClick ? () => onSchoolClick(school) : undefined}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}