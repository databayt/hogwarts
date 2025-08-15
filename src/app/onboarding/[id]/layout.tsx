"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import HostFooter from '@/components/onboarding/host-footer';
import { HostValidationProvider } from '@/components/onboarding/host-validation-context';
import { ListingProvider, useListing } from '@/components/onboarding/use-listing';

interface HostLayoutProps {
  children: React.ReactNode;
}

function HostLayoutContent({ children }: HostLayoutProps) {
  const params = useParams();
  const { loadListing } = useListing();
  const listingId = params.id as string | null;

  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId, loadListing]);

  return (
    <div className="px-4 sm:px-6 md:px-12 min-h-screen">
      <main className="h-screen pt-16 ">
        {children}
      </main>
      <HostFooter />
    </div>
  );
}

const HostLayout = ({ children }: HostLayoutProps) => {
  return (
    <ListingProvider>
      <HostValidationProvider>
        <HostLayoutContent>
          {children}
        </HostLayoutContent>
      </HostValidationProvider>
    </ListingProvider>
  );
};

export default HostLayout;
