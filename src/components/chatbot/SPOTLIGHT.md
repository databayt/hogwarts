---
feature: chatbot
title: Website Chat Assistant
status: partial
pillar: product-proof
personas: [owner, parent]
routes: [/ar (balqalam.com marketing pages), /ar/pricing, /ar/s/{school} (each school's public website)]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Website Chat Assistant — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A chat bubble on Balqalam's website and on every school's public website that answers visitors' questions in Arabic or English from the published prices and the school's own information.

## The school's day without it

A parent wants to know when admissions open or what the fees are, so they call the school office during working hours, or send a WhatsApp message that waits until someone is free. The same five questions are answered again and again, and a call after hours goes unanswered.

## What happens in Balqalam

1. A visitor opens a school's public website (or balqalam.com) and sees a chat button in the corner — the school's own logo on a school site.
2. They tap it and get a short welcome and a few ready-made questions (admission, fees, contact, programmes on a school site; features, pricing, getting started on balqalam.com), or type their own. There is also a microphone button for speaking the question, where the browser supports it.
3. On a school site, the assistant answers from that school's own published information: open admission periods, fee structures, scholarships, upcoming events, announcements, levels offered and contact details. It sees only that one school.
4. On balqalam.com it answers from the live price list and the list of features, and is told never to invent prices or numbers. Short answers, then buttons that lead to the next step.
5. On the balqalam.com pricing page, the chat opens once by itself after 30 seconds, and not again for 30 days.
6. On balqalam.com only, if a visitor types an email or phone number, it is saved as a sales lead and the team gets an email, so someone can follow up. School-site visitors are never added to Balqalam's sales list.

## Who it is for

- **Parent**: quick answers about admission dates, fees and contact details on the school's own website, at any hour.
- **Owner**: a school owner evaluating Balqalam can ask about plans and features and leave a number for a call back.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, on a phone): a school's public site at `/ar/s/{school}` with the chat open, asking "متى يبدأ القبول؟" (when do admissions open?); `balqalam.com/ar/pricing` with the chat open. Check the answer shown is correct before using it.

## What you can say

- The assistant on a school's website answers from that school's own admissions, fees, scholarships, events and contact information. [prompts.ts; actions.ts]
- It answers in the visitor's language, Arabic or English. [README.md "Knowledge base"; internationalization chatbot strings]
- Prices it quotes come from the same price list as the pricing page, so they stay current when prices change. [README.md "Knowledge base"]
- Visitors can type or speak their question. [README.md "Input controls"]
- A school's chat never adds that school's visitors to Balqalam's own sales list. [README.md "Capture + rate limit"]

## Do not say

- "AI receptionist", "replaces your front office" or "answers anything." It answers only from the information given to it, keeps answers short, and can be wrong. It is not a person.
- "Remembers your conversation." Conversations are not saved; a page reload starts over. [README.md "Known gaps"]
- "Inside the school dashboard" or "helps teachers with grades." It lives only on public websites.
- "Books a demo" or "takes payment" in the chat. It points to next steps; it does not book or charge.
- "Open source" or "Databayt" as the brand: the assistant's own instructions still describe the product as open-source Databayt, which is off-message. Do not screenshot or quote its self-description until the wording is updated. [internationalization ar.json / en.json "saasPromptTemplate"]
- "85+ features" — the assistant's instructions carry that figure, but the approved number is "~60 listed on the features page". [marketing-brief.mdx]
- Anything about reply accuracy, response times or conversation counts; none are measured.

## Post angles

1. "It's 10pm. A parent wants to know when admissions open." — parent — product-proof — a pain scene: after-hours questions answered from the school's own published dates.
2. "Your fees, your admission dates, your contact details — answered on your own website" — owner — product-proof — the school-site assistant uses only that school's information.
3. "How to make sure your school's chat gives the right answer: keep your admissions and fees up to date" — owner — school-operations — a how-to linking the assistant to the admissions and fees screens.
4. "Ask in Arabic, get an answer in Arabic" — parent — trust — a persona view of the Arabic chat on a phone.
5. "How many times a day does your office answer 'how much are the fees?'" — owner — school-operations — a question to the reader.

## Connects to

- [School website](../school-marketing/SPOTLIGHT.md)
- [Admission](../school-dashboard/admission/SPOTLIGHT.md)
- [Finance and fees](../school-dashboard/finance/SPOTLIGHT.md)

## Sources

- src/components/chatbot/README.md
- src/components/chatbot/actions.ts
- src/components/chatbot/prompts.ts
- src/components/chatbot/constant.ts
- src/components/chatbot/pricing-nudge.tsx
- src/components/chatbot/chat-window.tsx
- src/components/internationalization/en.json, ar.json (chatbot strings)
- src/app/[lang]/(saas-marketing)/layout.tsx
- src/app/[lang]/s/[subdomain]/(school-marketing)/layout.tsx
- content/docs-en/marketing-brief.mdx
