"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, Edit2 } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';

export default function PriceContent() {
  const params = useParams();
  const [price, setPrice] = useState<number>(158);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const schoolId = params?.id as string;
  const { enableNext } = useHostValidation();

  // Enable next button since we have a default price
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  useEffect(() => {
    // Auto-focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
      // Position cursor at the end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  useEffect(() => {
    // Position cursor at the end whenever price changes
    if (inputRef.current && isFocused) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [price, isFocused]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace('$', '');
    const numValue = parseInt(value) || 0;
    setPrice(numValue);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              Set your school's
              <br />
              tuition fees
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              This will be the annual tuition fee for your school. You can change this later.
            </p>
          </div>

          {/* Right side - Price form */}
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              {/* Large price display with edit functionality */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={`$${price}`}
                    onChange={handlePriceChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      // Prevent cursor from moving before "$"
                      if (e.key === 'ArrowLeft' || e.key === 'Home') {
                        const selectionStart = e.currentTarget.selectionStart || 0;
                        if (selectionStart <= 1) {
                          e.preventDefault();
                          e.currentTarget.setSelectionRange(1, 1);
                        }
                      }
                    }}
                    onClick={(e) => {
                      // Ensure cursor doesn't go before "$"
                      const selectionStart = e.currentTarget.selectionStart || 0;
                      if (selectionStart < 1) {
                        e.currentTarget.setSelectionRange(1, 1);
                      }
                    }}
                    className="text-foreground border-none outline-none text-center w-auto min-w-0 bg-transparent text-6xl font-extrabold"
                    style={{
                      width: `${(`$${price}`).length * 0.8}em`,
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
                      <Edit2 size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* View similar schools button */}
              <div className="mb-4">
                <Button variant="outline" className="inline-flex items-center space-x-2 rounded-full">
                  <DollarSign size={12} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
