"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/internationalization/use-locale';
import { type Locale } from '@/components/internationalization/config';
import { type Dictionary } from '@/components/internationalization/dictionaries';
import Image from 'next/image';

interface Option {
  id: string;
  title: string;
  description: string;
  illustration: string;
}

interface ApplyClientProps {
  dictionary: Dictionary['school']['onboarding']['apply'];
  lang: Locale;
}

const ApplyClient: React.FC<ApplyClientProps> = ({ dictionary, lang }) => {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isCreating, setIsCreating] = React.useState(false);
  const { isRTL } = useLocale();

  const options: Option[] = [
    {
      id: 'scratch',
      title: dictionary.createFromScratch,
      description: dictionary.createFromScratchDescription,
      illustration: "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg"
    },
    {
      id: 'template',
      title: dictionary.useTemplate,
      description: dictionary.useTemplateDescription,
      illustration: "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg"
    }
  ];

  const handleOptionClick = async (optionId: string) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      if (optionId === 'scratch') {
        // Navigate to overview for creating from scratch
        router.push(`/${lang}/onboarding/overview`);
      } else if (optionId === 'template') {
        // Navigate to overview with template flag
        router.push(`/${lang}/onboarding/overview?template=true`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`h-full flex flex-col px-20 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left Side - Title */}
            <div>
              <h2 className={`text-4xl font-bold tracking-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                {dictionary.title.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < dictionary.title.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h2>
              <p className={`mt-4 text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                {dictionary.subtitle}
              </p>
            </div>

            {/* Right Side - Options */}
            <div className="space-y-6">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  disabled={isCreating}
                  className={`w-full flex gap-6 items-start justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-all ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h4 className="mb-1 font-semibold">
                        {option.title}
                      </h4>
                      <p className="text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 hidden md:flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <div className="relative w-14 h-14 overflow-hidden">
                      <Image
                        src={option.illustration}
                        alt={option.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with HR and Button */}
      <div className="max-w-7xl mx-auto w-full">
        <Separator className="w-full" />
        <div className={`flex py-4 ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <Button
            variant="ghost"
            onClick={() => router.push(`/${lang}/onboarding`)}
          >
            {dictionary.back}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplyClient;
