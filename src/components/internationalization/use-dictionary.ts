'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './use-locale';
import { getDictionaryClient } from './get-dictionary-client';
import type { Dictionary } from './dictionaries';

export function useDictionary() {
  const { locale } = useLocale();
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const dict = await getDictionaryClient(locale);
        setDictionary(dict);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDictionary();
  }, [locale]);

  return { dictionary, isLoading };
}