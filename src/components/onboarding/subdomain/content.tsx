"use client";

import React, { useState, useEffect } from 'react';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useListing } from '@/components/onboarding/use-listing';
import { generateSubdomain, generateSubdomainSuggestions, isValidSubdomain, normalizeSubdomain } from '@/lib/subdomain';
import { checkSubdomainAvailability } from '@/lib/subdomain-actions';
import { reserveSubdomainForSchool } from '@/components/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Globe } from 'lucide-react';
import { toast } from 'sonner';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

export default function SubdomainContent(props: Props) {
  const { dictionary, lang, id } = props;
  const { enableNext, disableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [subdomain, setSubdomain] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Load existing subdomain from listing
  useEffect(() => {
    if (listing?.domain) {
      setSubdomain(listing.domain);
      validateSubdomain(listing.domain);
    }
  }, [listing]);

  // Generate suggestions when school name changes
  useEffect(() => {
    if (listing?.name) {
      const newSuggestions = generateSubdomainSuggestions(listing.name);
      setSuggestions(newSuggestions);
      
      // Auto-generate subdomain if none exists
      if (!subdomain) {
        const generated = generateSubdomain(listing.name);
        setSubdomain(generated);
        validateSubdomain(generated);
      }
    }
  }, [listing?.name, subdomain]);

  // Enable/disable next button based on validation
  useEffect(() => {
    if (isValid && subdomain.trim().length > 0) {
      enableNext();
    } else {
      disableNext();
    }
  }, [isValid, subdomain, enableNext, disableNext]);

  const validateSubdomain = async (value: string) => {
    const normalized = normalizeSubdomain(value);
    const valid = isValidSubdomain(normalized);
    
    if (valid) {
      setIsChecking(true);
      try {
        const result = await checkSubdomainAvailability(normalized);
        setIsValid(result.available);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking subdomain availability:', error);
        setIsValid(false);
        setIsChecking(false);
      }
    } else {
      setIsValid(false);
    }
  };

  const handleSubdomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSubdomain(newValue);
    validateSubdomain(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSubdomain(suggestion);
    validateSubdomain(suggestion);
    setShowSuggestions(false);
  };

  const handleRegenerate = () => {
    if (listing?.name) {
      const generated = generateSubdomain(listing.name);
      setSubdomain(generated);
      validateSubdomain(generated);
    }
  };

  const handleSave = async () => {
    if (isValid && subdomain.trim().length > 0 && listing?.id) {
      try {
        const result = await reserveSubdomainForSchool(
          listing.id,
          normalizeSubdomain(subdomain)
        );
        
        if (result.success) {
          // Update local state
          await updateListingData({
            domain: normalizeSubdomain(subdomain)
          });
          toast.success('Subdomain reserved successfully!');
        } else {
          toast.error(result.error || 'Failed to reserve subdomain');
        }
      } catch (error) {
        console.error('Error reserving subdomain:', error);
        toast.error('Failed to reserve subdomain');
      }
    }
  };

  const getValidationMessage = () => {
    if (!subdomain.trim()) return '';
    if (isValid) return 'Subdomain is available!';
    if (subdomain.length < 3) return 'Subdomain must be at least 3 characters';
    if (subdomain.length > 63) return 'Subdomain must be no more than 63 characters';
    if (!/^[a-z0-9-]+$/.test(subdomain)) return 'Only letters, numbers, and hyphens allowed';
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return 'Cannot start or end with hyphen';
    return 'Invalid subdomain format';
  };

  const getValidationIcon = () => {
    if (!subdomain.trim()) return null;
    if (isValid) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              Choose your school's
              <br />
              subdomain
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              This will be your school's unique web address. Students and staff will access your school at{' '}
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {subdomain || 'yourschool'}.databayt.org
              </span>
            </p>
            
            {/* Subdomain preview */}
            {subdomain && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" />
                  <span className="font-mono">
                    {subdomain}.databayt.org
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Input and suggestions */}
          <div className="space-y-4">
            {/* Subdomain input */}
            <div className="space-y-2">
              <label htmlFor="subdomain" className="text-sm font-medium">
                Subdomain
              </label>
              <div className="relative">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  placeholder="yourschool"
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getValidationIcon()}
                </div>
              </div>
              
              {/* Validation message */}
              {subdomain.trim() && (
                <p className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {getValidationMessage()}
                </p>
              )}
              
              {/* Character count */}
              <div className="text-xs text-muted-foreground">
                {subdomain.length}/63 characters
              </div>
            </div>

            {/* Regenerate button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate from school name
            </Button>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Suggestions</label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isChecking}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking availability...
                </>
              ) : (
                'Save subdomain'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
