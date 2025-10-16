"use client";

import React, { useEffect, Dispatch, SetStateAction } from 'react';
import { Modal } from '@/components/atom/modal';
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
          <div className="relative h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="mb-6">
          Congratulations!
        </h2>

        <p className="mb-2 text-muted-foreground">
          Your school has been successfully created at
        </p>

        <h5 className="text-primary mb-6">
          {schoolData.domain}.databayt.org
        </h5>

        {/* Action Link */}
        <button
          onClick={onGoToDashboard}
          className="text-primary underline hover:no-underline transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    </Modal>
  );
}