/**
 * FileBrowser Component
 * Comprehensive file browser with grid/table views, filtering, and selection
 */

'use client';

import * as React from 'react';
import { Grid, Table2, Search, Trash2, RefreshCw } from 'lucide-react';
import type { FileBrowserProps } from '../types';
import { useFileBrowser } from '../hooks/use-file-browser';
import { FileCard } from './file-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function FileBrowser({
  schoolId,
  folder,
  initialView = 'grid',
  allowUpload = false,
  allowDelete = false,
  allowSelect = false,
  onSelect,
  className,
}: FileBrowserProps) {
  const { state, actions } = useFileBrowser({
    schoolId,
    folder,
    initialView,
    autoLoad: true,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setFilter({ search: e.target.value });
  };

  const handleCategoryFilter = (category: string) => {
    actions.setFilter({
      category: category === 'all' ? undefined : (category as any),
    });
  };

  React.useEffect(() => {
    // Refresh when filter changes
    actions.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filter]);

  React.useEffect(() => {
    // Refresh when sort changes
    actions.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sort]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            value={state.filter.search || ''}
            onChange={handleSearchChange}
            className="ps-9"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <Select
            value={state.filter.category || 'all'}
            onValueChange={handleCategoryFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All files" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={actions.refresh}
            disabled={state.loading}
          >
            <RefreshCw className={cn('h-4 w-4', state.loading && 'animate-spin')} />
            <span className="sr-only">Refresh</span>
          </Button>

          {/* Delete Selected */}
          {allowDelete && state.selected.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={actions.deleteSelected}
            >
              <Trash2 className="me-2 h-4 w-4" />
              Delete ({state.selected.length})
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={state.view} onValueChange={(v) => actions.setView(v as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>

          {allowSelect && state.files.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={actions.selectAll}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={actions.clearSelection}
                disabled={state.selected.length === 0}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-4">
          {state.loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading files...
            </div>
          ) : state.files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No files found
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.files.map((file) => {
                const isSelected = state.selected.includes(file.id);

                return (
                  <Card
                    key={file.id}
                    className={cn(
                      'relative',
                      isSelected && 'ring-2 ring-primary'
                    )}
                  >
                    {allowSelect && (
                      <div className="absolute top-3 start-3 z-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => actions.toggleSelect(file.id)}
                        />
                      </div>
                    )}

                    <FileCard
                      file={file}
                      onView={() => window.open(file.url, '_blank')}
                      showActions={allowDelete}
                    />
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-4">
          {state.loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading files...
            </div>
          ) : state.files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No files found
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {allowSelect && (
                      <th className="w-12 p-4">
                        <Checkbox
                          checked={
                            state.selected.length === state.files.length &&
                            state.files.length > 0
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              actions.selectAll();
                            } else {
                              actions.clearSelection();
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="p-4 text-start font-medium">Name</th>
                    <th className="p-4 text-start font-medium">Size</th>
                    <th className="p-4 text-start font-medium">Type</th>
                    <th className="p-4 text-start font-medium">Uploaded</th>
                    <th className="p-4 text-end font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.files.map((file) => {
                    const isSelected = state.selected.includes(file.id);

                    return (
                      <tr
                        key={file.id}
                        className={cn(
                          'border-b transition-colors hover:bg-muted/50',
                          isSelected && 'bg-muted'
                        )}
                      >
                        {allowSelect && (
                          <td className="p-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => actions.toggleSelect(file.id)}
                            />
                          </td>
                        )}
                        <td className="p-4">
                          <p className="font-medium">{file.originalName}</p>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatBytes(file.size)}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {file.category}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {state.files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {state.files.length} file{state.files.length !== 1 ? 's' : ''}
          </p>
          {state.selected.length > 0 && (
            <p>
              {state.selected.length} selected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
