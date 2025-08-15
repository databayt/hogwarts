"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HostStepLayout } from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { ListingProvider, useListing } from '@/components/onboarding/use-listing';

interface PricePageProps {
  params: Promise<{ id: string }>;
}

const PricePageContent = ({ params }: PricePageProps) => {
  const router = useRouter();
  const [id, setId] = React.useState<string>('');
  const { enableNext } = useHostValidation();
  const { listing, updateListingData, loadListing } = useListing();
  const [price, setPrice] = useState<number>(158);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
      // Load the listing data in the background
      loadListing(resolvedParams.id).catch(console.error);
    });
  }, [params, loadListing]);

  // Load existing price from listing
  React.useEffect(() => {
    if (listing?.tuitionFee) {
      setPrice(listing.tuitionFee);
    }
  }, [listing]);

  // Enable next button since we have a default price
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  React.useEffect(() => {
    // Auto-focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
      // Position cursor at the end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  React.useEffect(() => {
    // Position cursor at the end whenever price changes
    if (inputRef.current && isFocused) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [price, isFocused]);

  const handlePriceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('SR', '');
    const numValue = parseInt(value) || 0;
    setPrice(numValue);
    
    // Update backend data with debouncing
    try {
      await updateListingData({
        pricePerNight: numValue
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const guestPriceBeforeTaxes = price + 22; // Adding estimated fees

  return (
    <HostStepLayout
      title="Now, set an annual fee"
      subtitle="Tip: SR158. You may set a monthly fee later."
    >
      <div className="flex flex-col items-center">
        {/* Large price display with edit functionality */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={`SDG${price}`}
              onChange={handlePriceChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                // Prevent cursor from moving before "SR"
                if (e.key === 'ArrowLeft' || e.key === 'Home') {
                  const selectionStart = e.currentTarget.selectionStart || 0;
                  if (selectionStart <= 2) {
                    e.preventDefault();
                    e.currentTarget.setSelectionRange(2, 2);
                  }
                }
              }}
              onClick={(e) => {
                // Ensure cursor doesn't go before "SR"
                const selectionStart = e.currentTarget.selectionStart || 0;
                if (selectionStart < 2) {
                  e.currentTarget.setSelectionRange(2, 2);
                }
              }}
              className="display text-foreground border-none outline-none text-center w-auto min-w-0 bg-transparent text-6xl font-extrabold"
              style={{ 
                width: `${(`SDG${price}`).length * 0.8}em`,
                caretColor: 'var(--foreground)'
              }}
            />
            {!isFocused && (
              <div 
                className="-ml-3 mb-4 w-8 h-8 bg-muted rounded-full flex items-center justify-center cursor-pointer hover:bg-accent transition-colors self-end"
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="m5.692 10.497 1.497 1.497-2.234.639-.002.002.002-.002.637-2.136Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Guest price info */}
        <div className="mb-4">
          <Button variant="ghost" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <span>Student fee before discount SDG{guestPriceBeforeTaxes}</span>
            <ChevronDown size={16} />
          </Button>
        </div>

        {/* View similar listings button */}
        <div className="mb-4">
          <Button variant="outline" className="inline-flex items-center space-x-2 rounded-full">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 1v3M8 12v3M15 8h-3M4 8H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>View similar schools</span>
          </Button>
        </div>

        {/* Learn more link */}
        <div className="">
          <Button variant="link" className="text-muted-foreground underline hover:no-underline p-0">
            Learn more about fees
          </Button>
        </div>
      </div>
    </HostStepLayout>
  );
};

const PricePage = ({ params }: PricePageProps) => {
  return (
    <ListingProvider>
      <PricePageContent params={params} />
    </ListingProvider>
  );
};

export default PricePage; 