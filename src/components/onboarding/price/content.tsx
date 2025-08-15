"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign } from 'lucide-react';

export default function PriceContent() {
  const params = useParams();
  const [price, setPrice] = useState<number>(158);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const schoolId = params?.id as string;

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

  const guestPriceBeforeTaxes = price + 22; // Adding estimated fees

  return (
    <div className="">
      <div className="space-y-6">
        <div className="space-y-3">
          <h3>Now, set an annual fee</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tip: $158. You may set a monthly fee later.
          </p>
        </div>

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
                  <DollarSign size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Student price info */}
          <div className="mb-4">
            <Button variant="ghost" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <span>Student fee before discount ${guestPriceBeforeTaxes}</span>
              <ChevronDown size={16} />
            </Button>
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
  );
}
