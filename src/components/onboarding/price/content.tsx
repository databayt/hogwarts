"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, Edit2 } from 'lucide-react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

export default function PriceContent(props: Props) {
  const { dictionary, lang, id } = props;
  const [price, setPrice] = useState<number>(158);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const schoolId = id;
  const { enableNext } = useHostValidation();
  const dict = (dictionary as any)?.onboarding || {};

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
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Large price display with edit functionality */}
      <div className="flex items-start justify-center mb-6">
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
            className="text-foreground border-none outline-none w-auto min-w-0 bg-transparent text-6xl font-extrabold text-center"
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
      <div className="mb-4 flex justify-center">
        <Button variant="outline" className="inline-flex items-center space-x-2 rounded-full">
          <DollarSign size={12} />
          <span>{dict.viewSimilarSchools || 'View similar schools'}</span>
        </Button>
      </div>

      {/* Learn more link */}
      <div className="flex justify-center">
        <Button variant="link" className="text-muted-foreground underline hover:no-underline p-0">
          {dict.learnMoreAboutFees || 'Learn more about fees'}
        </Button>
      </div>
    </div>
  );
}
