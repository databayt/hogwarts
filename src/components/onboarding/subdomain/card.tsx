"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { SUBDOMAIN_CONSTANTS } from "./config";
import type { SubdomainData } from './types';

interface SubdomainCardProps {
  data?: SubdomainData;
  domain?: string;
  isAvailable?: boolean;
  isChecking?: boolean;
  showPreview?: boolean;
}

export function SubdomainCard({ 
  data,
  domain = data?.domain,
  isAvailable,
  isChecking = false,
  showPreview = true
}: SubdomainCardProps) {
  const fullDomain = domain ? `${domain}${SUBDOMAIN_CONSTANTS.DOMAIN_SUFFIX}` : null;

  if (!showPreview || !domain) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Your School Domain</CardTitle>
          <CardDescription>
            Choose a unique web address for your school
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          School Domain Preview
        </CardTitle>
        <CardDescription>
          This will be your school's web address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-lg font-mono">
              {fullDomain}
            </div>
          </div>
          
          {isChecking ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Checking availability...
            </div>
          ) : isAvailable !== undefined ? (
            <div className="flex items-center justify-center gap-2">
              {isAvailable ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="default" className="bg-green-600">
                    Available
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="destructive">
                    Already taken
                  </Badge>
                </>
              )}
            </div>
          ) : null}
          
          <p className="text-sm text-muted-foreground">
            Students, teachers, and parents will access your school at this address
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubdomainCard;