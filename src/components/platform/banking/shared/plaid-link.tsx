'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  PlaidLinkOnSuccess,
  PlaidLinkOnExit,
  PlaidLinkOptions,
  usePlaidLink,
} from 'react-plaid-link'
import { createBankAccount } from '@/components/banking/actions/bank.actions'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PlaidLinkProps {
  user: {
    id: string
  }
  variant?: 'primary' | 'ghost'
  dictionary?: any
}

interface LinkTokenError {
  message: string
}

/**
 * PlaidLink - Optimized Plaid integration component
 *
 * Features:
 * - Proper cleanup with AbortController
 * - Error handling and user feedback
 * - Loading states with useTransition
 * - Memoized callbacks to prevent recreations
 */
export function PlaidLink({ user, variant = 'primary', dictionary }: PlaidLinkProps) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Fetch link token with proper cleanup
  useEffect(() => {
    const abortController = new AbortController()

    const getLinkToken = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/banking/create-link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to create link token')
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setToken(data.link_token)
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        console.error('Error fetching link token:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to initialize bank connection'
        )
      } finally {
        setIsLoading(false)
      }
    }

    getLinkToken()

    // Cleanup function
    return () => {
      abortController.abort()
    }
  }, [user.id])

  // Handle successful Plaid link
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      startTransition(async () => {
        try {
          setError(null)

          // Exchange public token for access token
          const response = await fetch('/api/banking/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              publicToken: public_token,
              userId: user.id,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to exchange token')
          }

          const { access_token, item_id } = await response.json()

          // Create bank account in database
          const bankAccount = await createBankAccount({
            userId: user.id,
            bankId: item_id,
            accountId: metadata.accounts[0].id,
            accessToken: access_token,
            fundingSourceUrl: '',
            shareableId: '',
          })

          if (bankAccount) {
            router.push('/banking/my-banks')
            router.refresh()
          } else {
            throw new Error('Failed to create bank account')
          }
        } catch (err) {
          console.error('Error in onSuccess:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to connect bank account'
          )
        }
      })
    },
    [user.id, router]
  )

  // Handle Plaid link exit
  const onExit = useCallback<PlaidLinkOnExit>(
    (err, metadata) => {
      if (err) {
        console.error('Plaid Link exited with error:', err)
        setError(err.error_message || 'Connection cancelled')
      }
    },
    []
  )

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token,
    onSuccess,
    onExit,
  }

  const { open, ready } = usePlaidLink(config)

  // Handle button click
  const handleClick = useCallback(() => {
    if (ready) {
      setError(null)
      open()
    }
  }, [ready, open])

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connect Button */}
      <Button
        onClick={handleClick}
        disabled={!ready || isLoading || isPending}
        variant={variant}
        className="w-full"
      >
        {isLoading || isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isPending
              ? (dictionary?.connecting || 'Connecting...')
              : (dictionary?.loading || 'Loading...')}
          </>
        ) : (
          dictionary?.connectBank || 'Connect Bank Account'
        )}
      </Button>
    </div>
  )
}