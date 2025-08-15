"use client"

import { useRouter } from 'next/navigation'
import { StepWrapper } from '../step-wrapper'
import { Check, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FinishSetupContent() {
  const router = useRouter()

  return (
    <StepWrapper>
      <div className="text-center space-y-8">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        
        {/* Main Message */}
        <div>
          <h2 className="text-2xl font-medium mb-2">
            Congratulations! Your school setup is complete
          </h2>
          <p className="text-muted-foreground">
            You've successfully completed all the required steps to set up your school.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <h3 className="font-medium">What's next?</h3>
          <ul className="text-sm text-muted-foreground space-y-3">
            <li className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary">1</span>
              </div>
              <span>Review your school dashboard and familiarize yourself with the features</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary">2</span>
              </div>
              <span>Set up your staff accounts and assign roles</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary">3</span>
              </div>
              <span>Start adding students and organizing classes</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div>
          <Button
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground">
          Need help? Check out our <a href="/docs" className="text-primary hover:underline">documentation</a> or <a href="/support" className="text-primary hover:underline">contact support</a>
        </div>
      </div>
    </StepWrapper>
  )
}