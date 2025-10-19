'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import type { getDictionary } from '@/components/internationalization/dictionaries';
import { PlaidLink } from '../shared/plaid-link';

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>['banking'];
  size?: 'default' | 'sm' | 'lg';
}

export default function AddBankButton(props: Props) {
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkStart = useCallback(() => {
    setIsLinking(true);
  }, []);

  const handleLinkComplete = useCallback(() => {
    setIsLinking(false);
    // Page will be refreshed by PlaidLink component
  }, []);

  return (
    <>
      <Button
        size={props.size}
        onClick={handleLinkStart}
        disabled={isLinking}
      >
        {isLinking ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {props.dictionary.processing}
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {props.dictionary.addBank}
          </>
        )}
      </Button>

      {isLinking && (
        <PlaidLink
          user={{ id: '' }} // Will be fetched in PlaidLink
          dictionary={props.dictionary}
        />
      )}
    </>
  );
}