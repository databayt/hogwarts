"use client";

import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { Modal } from '@/components/atom/modal';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessCompletionModalProps {
  schoolData: {
    name: string;
    domain: string;
    id: string;
  };
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  onGoToDashboard: () => void;
}

export default function SuccessCompletionModal({
  schoolData,
  showModal,
  setShowModal,
  onGoToDashboard
}: SuccessCompletionModalProps) {

  useEffect(() => {
    if (showModal) {
      // Trigger confetti animation
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 100000
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          spread: 90,
          scalar: 1.2,
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [showModal]);

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="md:max-w-lg"
      preventDefaultClose={false}
    >
      <div className="p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-pulse" />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Congratulations!
        </h2>

        <p className="lead mb-2 text-muted-foreground">
          {schoolData.name}
        </p>

        <p className="mb-6 text-muted-foreground">
          Your school has been successfully created and is ready to use!
        </p>

        {/* School URL */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="muted mb-1">Your school's portal:</p>
          <h5 className="text-primary">
            {schoolData.domain}.databayt.org
          </h5>
        </div>

        {/* Action Button */}
        <Button
          size="lg"
          onClick={onGoToDashboard}
          className="w-full gap-2 py-6"
        >
          Go to Dashboard
          <ExternalLink className="w-4 h-4" />
        </Button>

        {/* Help Text */}
        <small className="block text-muted-foreground mt-4">
          You can now invite teachers, add students, and set up classes from your dashboard
        </small>
      </div>
    </Modal>
  );
}