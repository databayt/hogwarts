import type { SetupStepStatus } from './types';

export const FINISH_SETUP_CONSTANTS = {
  STEP_NAME: 'finish-setup',
  STEP_TITLE: 'Finish Setup',
  STEP_DESCRIPTION: 'Complete your school setup and go live!',
  MIN_COMPLETION_PERCENTAGE: 80,
} as const;

export const SETUP_STEPS: SetupStepStatus[] = [
  {
    step: 'title',
    title: 'School Name',
    completed: false,
    required: true,
  },
  {
    step: 'description', 
    title: 'School Description',
    completed: false,
    required: true,
  },
  {
    step: 'location',
    title: 'School Location',
    completed: false,
    required: true,
  },
  {
    step: 'capacity',
    title: 'School Capacity',
    completed: false,
    required: true,
  },
  {
    step: 'branding',
    title: 'School Branding',
    completed: false,
    required: false,
  },
  {
    step: 'price',
    title: 'Pricing Setup',
    completed: false,
    required: true,
  },
] as const;

export const COMPLETION_MESSAGES = {
  READY: {
    title: 'Ready to Launch! 🎉',
    message: 'Your school setup is complete and ready to go live.',
  },
  ALMOST_READY: {
    title: 'Almost There! 🚀',
    message: 'Just a few more steps to complete your school setup.',
  },
  NEEDS_WORK: {
    title: 'Let\'s Complete Your Setup',
    message: 'Please complete the required steps to finish your school setup.',
  },
} as const;

export const NEXT_STEPS = [
  {
    title: 'Access Your School Dashboard',
    description: 'Start managing your school with our comprehensive dashboard',
    action: 'dashboard',
  },
  {
    title: 'Invite Teachers and Staff',
    description: 'Add your teaching staff and administrators to the system',
    action: 'invite',
  },
  {
    title: 'Import Student Data',
    description: 'Upload existing student records and information',
    action: 'import',
  },
  {
    title: 'Customize Your Settings',
    description: 'Configure school-specific settings and preferences',
    action: 'settings',
  },
] as const;