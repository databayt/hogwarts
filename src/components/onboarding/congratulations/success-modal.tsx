"use client";

import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { Modal } from '@/components/atom/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Users, GraduationCap, Calendar, Settings2, ExternalLink, Sparkles, School, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface SuccessModalProps {
  schoolData: {
    name: string;
    domain: string;
    id: string;
  };
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  onGoToDashboard: () => void;
}

export default function SuccessModal({
  schoolData,
  showModal,
  setShowModal,
  onGoToDashboard
}: SuccessModalProps) {
  const [step, setStep] = useState<'celebration' | 'nextSteps'>('celebration');

  useEffect(() => {
    if (showModal) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });

        // Confetti from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
        });
      }, 250);

      // Auto-transition to next steps after animation
      setTimeout(() => {
        setStep('nextSteps');
      }, 4000);
    }
  }, [showModal]);

  const nextStepsCards = [
    {
      icon: Users,
      color: 'blue',
      title: 'Invite Your Team',
      description: 'Add teachers, staff, and administrators to start collaborating',
    },
    {
      icon: GraduationCap,
      color: 'purple',
      title: 'Add Students',
      description: 'Import student data or add them individually to get started',
    },
    {
      icon: Calendar,
      color: 'green',
      title: 'Set Up Classes',
      description: 'Create class schedules, assign teachers, and organize subjects',
    },
    {
      icon: Settings2,
      color: 'orange',
      title: 'Configure Settings',
      description: 'Customize your school preferences, policies, and branding',
    },
  ];

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-full h-full md:max-w-full md:h-full md:rounded-none"
      preventDefaultClose={step === 'celebration'}
    >
      <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 md:p-12">
          {step === 'celebration' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-8 shadow-2xl"
              >
                <CheckCircle className="w-20 h-20 text-white" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Congratulations!
                </h1>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-2xl md:text-3xl text-muted-foreground mb-2">
                  {schoolData.name}
                </p>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Your school is now live and ready to transform education!
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 p-6 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <School className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Your school's portal:</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {schoolData.domain}.databayt.org
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mb-4">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Let's Get Started!
                </h2>
                <p className="text-xl text-muted-foreground">
                  Your next steps to set up {schoolData.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {nextStepsCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-primary/30"
                      onClick={onGoToDashboard}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          card.color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
                          card.color === 'purple' && "bg-purple-100 dark:bg-purple-900/20",
                          card.color === 'green' && "bg-green-100 dark:bg-green-900/20",
                          card.color === 'orange' && "bg-orange-100 dark:bg-orange-900/20"
                        )}>
                          <card.icon className={cn(
                            "w-8 h-8",
                            card.color === 'blue' && "text-blue-600 dark:text-blue-400",
                            card.color === 'purple' && "text-purple-600 dark:text-purple-400",
                            card.color === 'green' && "text-green-600 dark:text-green-400",
                            card.color === 'orange' && "text-orange-600 dark:text-orange-400"
                          )} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                          <p className="text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col md:flex-row gap-4 justify-center"
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowModal(false)}
                  className="text-lg px-8 py-6"
                >
                  Continue Setup Later
                </Button>
                <Button
                  size="lg"
                  onClick={onGoToDashboard}
                  className="text-lg px-8 py-6 gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  Go to School Dashboard
                  <ExternalLink className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </Modal>
  );
}