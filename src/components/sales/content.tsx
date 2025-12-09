/**
 * Content orchestration component for the Sales/Leads feature
 * Main UI component with Lead Agent prompt and tabbed interface
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { All } from './all';
import { Featured } from './featured';
import { Cards } from './cards';
import { PasteImport } from './paste-import';
import { Analytics } from './analytics';
import { Form } from './form';
import { useLeads } from './use-leads';
import SalesPrompt from './prompt';
import type { Lead } from './types';
import type { Dictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';

interface Props {
  initialLeads?: Lead[];
  dictionary?: Dictionary['sales'];
  lang: Locale;
}

export default function SalesContent({
  initialLeads = [],
  dictionary,
  lang,
}: Props) {
  const d = dictionary;

  const {
    leads,
    analytics,
    isLoading,
    filters,
    setFilters,
    selectedLeads,
    setSelectedLeads,
    refreshLeads,
    refreshAnalytics,
  } = useLeads({
    initialLeads,
    autoRefresh: false,
  });

  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateForm(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleLeadsCreated = useCallback((count: number) => {
    refreshLeads();
    refreshAnalytics();
  }, [refreshLeads, refreshAnalytics]);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditLead(lead);
  }, []);

  return (
    <>
      {/* Lead Agent Prompt */}
      <SalesPrompt
        onLeadsCreated={handleLeadsCreated}
        dictionary={d as unknown as Record<string, string>}
      />

      <div id="sales-content" className="flex flex-col gap-6 py-6" suppressHydrationWarning>
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {d?.addNewLead || 'Add Lead'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {leads.length} {d?.leads || 'leads'}
            </span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">{d?.navAll || 'All Leads'}</TabsTrigger>
            <TabsTrigger value="featured">{'Featured'}</TabsTrigger>
            <TabsTrigger value="cards">{'Cards'}</TabsTrigger>
            <TabsTrigger value="import">{d?.navImport || 'AI Import'}</TabsTrigger>
            <TabsTrigger value="analytics">{d?.navAnalytics || 'Analytics'}</TabsTrigger>
          </TabsList>

          {/* All Leads Tab */}
          <TabsContent value="all" className="mt-6">
            <All
              leads={leads}
              isLoading={isLoading}
              filters={filters}
              onFiltersChange={setFilters}
              selectedLeads={selectedLeads}
              onSelectionChange={setSelectedLeads}
              onRefresh={refreshLeads}
              onEditLead={handleEditLead}
              dictionary={d as unknown as Record<string, string>}
            />
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured" className="mt-6">
            <Featured
              leads={leads}
              isLoading={isLoading}
              dictionary={d as unknown as Record<string, string>}
            />
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="mt-6">
            <Cards
              leads={leads}
              isLoading={isLoading}
              onRefresh={refreshLeads}
              onEditLead={handleEditLead}
              dictionary={d as unknown as Record<string, string>}
            />
          </TabsContent>

          {/* AI Import Tab */}
          <TabsContent value="import" className="mt-6">
            <PasteImport
              onComplete={refreshLeads}
              dictionary={d as unknown as Record<string, string>}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Analytics
              analytics={analytics}
              isLoading={isLoading}
              dictionary={d as unknown as Record<string, string>}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Form Dialog */}
      {showCreateForm && (
        <Form
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            refreshLeads();
            refreshAnalytics();
          }}
          dictionary={d as unknown as Record<string, string>}
        />
      )}

      {/* Edit Form Dialog */}
      {editLead && (
        <Form
          open={!!editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => {
            setEditLead(null);
            refreshLeads();
          }}
          lead={editLead}
          mode="edit"
          dictionary={d as unknown as Record<string, string>}
        />
      )}
    </>
  );
}
