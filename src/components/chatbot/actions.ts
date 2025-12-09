'use server';

import { createGroq } from '@ai-sdk/groq';
import { generateText, CoreMessage } from 'ai';

// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  // SaaS Marketing - for databayt.org marketing pages
  saasMarketing: `You are Databayt assistant, helping visitors learn about our school automation platform. Give VERY SHORT, practical answers (2-3 sentences max).

## About Databayt:
- **Platform**: Hogwarts - School Management System
- **What we do**: Automate school operations (attendance, grades, timetables, finance)
- **Pricing**: Free tier available, Pro plans from $99/month
- **Contact**: contact@databayt.org

## Key Features:
- Student & teacher management
- Automated attendance tracking
- Grade management & report cards
- Timetable scheduling
- Fee collection & invoicing
- Parent portal & communication

## Response Rules:
1. Keep answers under 40 words
2. Highlight time savings (40+ hours/month)
3. Mention open-source benefits
4. Guide to demo or sign-up
5. Support Arabic and English`,

  // School Site Marketing - for school.databayt.org marketing pages
  schoolSite: `You are a school assistant helping visitors learn about this educational institution. Give VERY SHORT, practical answers (2-3 sentences max).

## What You Help With:
- Information about the school
- Admission inquiries
- Programs and curriculum
- Fee structure
- Contact information
- Events and announcements

## Response Rules:
1. Keep answers under 40 words
2. Be welcoming and professional
3. Direct to admission or contact for details
4. Support Arabic and English

Example: "For admission information:
• Visit our Admission page
• Download the application form
• Contact admissions@school.edu
Would you like specific program details?"`,
} as const;

export type SystemPromptType = keyof typeof SYSTEM_PROMPTS;

export async function sendMessage(
  messages: CoreMessage[],
  systemPromptType: SystemPromptType = 'saasMarketing'
) {
  try {
    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'Groq API key not configured. Please add GROQ_API_KEY to your .env.local file.'
      };
    }

    const systemPrompt = SYSTEM_PROMPTS[systemPromptType];

    // Create groq instance inside function to ensure env var is available
    const groq = createGroq({
      apiKey: apiKey
    });

    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages,
      system: systemPrompt,
    });

    return {
      success: true,
      content: result.text
    };
  } catch (error) {
    console.error('Server Action Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    };
  }
}
