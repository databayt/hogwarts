// Awesome shadcn ecosystem data (title, description, link) with background tags for search/sort

export type AwesomeShadcnItem = {
  id: string
  title: string
  description: string
  link: string
  tags: string[] // background-only: used for search/sort, not rendered directly
}

export const awesomeShadcn: AwesomeShadcnItem[] = [
  // Core & Official
  
  {
    id: "radix",
    title: "Radix",
    description:
      "Radix Primitives is an open-source UI component library for building high-quality, accessible design systems and web apps. Maintained by @workos.",
    link: "https://www.radix-ui.com/",
    tags: ["core", "tools"]
  },
  {
    id: "shadcn",
    title: "shadcn",
    description:
      "The original copy-paste React component collection built on top of Radix UI and Tailwind CSS. Emphasizes ownership, flexibility, accessibility, and performance by integrating source code directly into your app rather than shipping a dependency.",
    link: "https://ui.shadcn.com/",
    tags: ["core", "components", "modern"]
  },
  

  // Component Libraries & Collections
  {
    id: "aceternity",
    title: "Aceternity",
    description:
      "Trending, highly animated components focused on styling and motion. Copy and paste to create beautiful websites in minutes.",
    link: "https://ui.aceternity.com/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "magic",
    title: "Magic",
    description:
      "UI library for Design Engineers with 150+ free, open-source animated components and effects. Built with React, TypeScript, Tailwind, and Motion; designed to pair with shadcn.",
    link: "https://magicui.design/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "magic-pro",
    title: "Magic Pro",
    description:
      "Commercial companion to Magic featuring 50+ polished sections and templates for rapid page assembly, ideal for production-grade design systems.",
    link: "https://pro.magicui.design/?ref=bytefer",
    tags: ["components", "templates", "enhanced"]
  },
  {
    id: "cult",
    title: "Cult",
    description:
      "Components crafted for Design Engineers. Styled with Tailwind, fully compatible with shadcn, and easy to integrate through copy-paste. MIT licensed for broad use.",
    link: "https://www.cult-ui.com/",
    tags: ["components", "modern"]
  },
  {
    id: "jolly",
    title: "Jolly",
    description:
      "Shadcn-compatible React Aria components that are accessible, customizable, and open source. Designed to be copied and pasted directly into your apps.",
    link: "https://www.jollyui.dev/",
    tags: ["components", "enhanced"]
  },
  {
    id: "fusion",
    title: "Fusion",
    description:
      "Fusion of shadcn and Magic UI delivering 150+ free, open-source components. Useful for building modern UIs quickly with a broad selection.",
    link: "https://github.com/nyxb-ui/ui",
    tags: ["components", "modern"]
  },
  {
    id: "origin",
    title: "Origin",
    description:
      "Open-source, copy-and-paste components for building application UIs. Powered by Tailwind CSS and React, emphasizing speed and extensibility.",
    link: "https://originui.com/",
    tags: ["components", "modern"]
  },
  {
    id: "myna",
    title: "Myna",
    description:
      "A TailwindCSS and shadcn kit for Figma and React. A paid resource offering modern, accessible, and customizable elements for professional workflows.",
    link: "https://mynaui.com/",
    tags: ["components", "enhanced", "modern"]
  },
  {
    id: "eldora",
    title: "Eldora",
    description:
      "A collection of reusable components to copy and paste into your web apps. Focused on practical building blocks you can adapt to your design system.",
    link: "https://www.eldoraui.site/",
    tags: ["components"]
  },
  {
    id: "page",
    title: "Page",
    description:
      "Landing page UI components for React and Next.js, built on TailwindCSS. Great for marketing pages and quick page assembly.",
    link: "https://pageai.pro/",
    tags: ["components", "templates"]
  },
  {
    id: "tremor",
    title: "Tremor",
    description:
      "Copy-and-paste React components for modern applications with emphasis on charts and data-heavy interfaces.",
    link: "https://tremor.so/",
    tags: ["components", "enhanced"]
  },
  {
    id: "syntax",
    title: "Syntax",
    description:
      "Pre-built, Tailwind-powered components, animations, and effects brought to life using Framer Motion. Free access for rapid prototyping.",
    link: "https://syntaxui.com/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "farm",
    title: "Farm",
    description:
      "Client-first, animation-rich component library built on Radix and shadcn, targeting interactive experiences and refined motion.",
    link: "https://www.farmui.com/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "indie",
    title: "Indie",
    description:
      "Free collection of UI components for building web apps. Built with React and Tailwind CSS, suitable for quickly scaffolding UI patterns.",
    link: "https://ui.indie-starter.dev/",
    tags: ["components"]
  },
  {
    id: "mixcn",
    title: "Mixcn",
    description:
      "20+ free, open-source animated components implemented with React, TypeScript, Tailwind, and Framer Motion. Optimized for delightful micro-interactions.",
    link: "https://mixcn-ui.vercel.app/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "edil-ozi",
    title: "Edil Ozi Components",
    description:
      "Open-source components you can copy and paste into your apps. Focused on developer ergonomics and practical building blocks.",
    link: "https://www.edil-ozi.pro/",
    tags: ["components"]
  },
  {
    id: "bund",
    title: "Bund",
    description:
      "A collection of components built with Tailwind CSS and Framer Motion. Ready to copy/paste and extend for your product UI.",
    link: "https://bundui.io/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "lukacho",
    title: "Lukacho",
    description:
      "Next-generation UI components designed for modern React apps. Aimed at speed, reusability, and stylistic flexibility.",
    link: "https://ui.lukacho.com/",
    tags: ["components", "modern"]
  },
  {
    id: "expansions",
    title: "Expansions",
    description:
      "An extended registry providing more components built on top of shadcn, expanding your toolkit beyond the core set.",
    link: "https://www.shadcntemplates.com/theme/hsuanyi-chou-shadcn-ui-expansions/",
    tags: ["components", "enhanced"]
  },
  {
    id: "motion",
    title: "Motion",
    description:
      "A customizable, open-source UI kit for creating animated interfaces faster. Useful as a foundation for motion-heavy experiences.",
    link: "https://www.shadcntemplates.com/theme/ibelick-motion-primitives/",
    tags: ["components", "animated"]
  },
  {
    id: "spectrum",
    title: "Spectrum",
    description:
      "Next.js shadcn component library that helps developers accelerate project growth with pre-built parts and patterns.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["components", "enhanced"]
  },
  {
    id: "worigami",
    title: "Worigami",
    description:
      "React shadcn component library offering many useful blocks to simply copy and paste in your apps for quick assembly.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["components", "templates"]
  },
  {
    id: "animate",
    title: "Animate",
    description:
      "Fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, Motion, and Shadcn CLI. Focused on rich motion design.",
    link: "https://www.shadcntemplates.com/theme/animate-ui-animate-ui/",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "intent",
    title: "Intent",
    description:
      "A chill set of React components built on React Aria Components and Tailwind CSS. Easy to customize and copy/paste for accessible experiences.",
    link: "https://www.shadcntemplates.com/theme/irsyadadl-intentui/",
    tags: ["components", "enhanced"]
  },
  {
    id: "kibo",
    title: "Kibo",
    description:
      "A custom registry of composable, accessible, open-source shadcn/ui components. Helps teams standardize on flexible, reusable parts.",
    link: "https://www.shadcntemplates.com/theme/haydenbleasel-kibo/",
    tags: ["components", "enhanced"]
  },

  // Specialized Blocks
  {
    id: "blocks",
    title: "Blocks",
    description:
      "Premium collection of 700+ uniquely crafted blocks and components tailored for shadcn/ui, Tailwind, and React. High-quality, interactive, and fully responsive sections for building landing and marketing pages in minutes. Lifetime access and updates.",
    link: "https://www.shadcnblocks.com/",
    tags: ["templates", "components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-kit",
    title: "ShadcnKit",
    description:
      "Prebuilt components, blocks, and pages to ship faster: 400+ tiny components, 100+ prebuilt pages, and 12+ dashboards. Built with Next.js and shadcn/ui, includes a fully customizable Figma version and theme support.",
    link: "https://kit.shadcnui.com/",
    tags: ["templates", "components", "specialized", "enhanced"]
  },
  {
    id: "tailark",
    title: "Tailark",
    description:
      "Modern, responsive, pre-built UI blocks for creating marketing websites with Shadcn UI. Accelerate page assembly with opinionated, polished sections.",
    link: "https://nsui.irung.me/",
    tags: ["templates", "specialized"]
  },
  {
    id: "blocks-two",
    title: "Blocks two",
    description:
      "Effortless Shadcn UI component previews and code snippets. Offers uniquely designed sections that are fully responsive, easy to copy, and free to use with multiple variants.",
    link: "https://www.shadcnui-blocks.com/",
    tags: ["templates", "components", "enhanced"]
  },
  {
    id: "twblocks",
    title: "TWBlocks",
    description:
      "Website blocks to copy/paste, based on shadcn and Radix using Tailwind and Next.js. Useful for fast composition of landing pages.",
    link: "https://www.shadcntemplates.com/theme/tommyjepsen-twblocks/",
    tags: ["templates", "specialized"]
  },
  {
    id: "neobrutalism",
    title: "Neobrutalism",
    description:
      "Collection of neobrutalism-styled Tailwind components. A distinct aesthetic for standout marketing and content layouts.",
    link: "https://github.com/ekmas/neobrutalism-components",
    tags: ["components", "modern"]
  },

  // Application Templates & Starters
  {
    id: "saas",
    title: "SaaS",
    description:
      "Ready-to-use template to launch SaaS faster with modern technologies and essential integrations. Combines Next.js/React, Postgres, Drizzle ORM, and Stripe for a solid full-stack baseline.",
    link: "https://next-saas-start.vercel.app/",
    tags: ["templates", "enhanced", "modern"]
  },
  {
    id: "boilerplate",
    title: "Boilerplate",
    description:
      "A full-stack React application with Auth, Multi-tenancy, Roles & Permissions, i18n, Landing Page, DB, Logging, and Testing. Built to save time on boilerplate and scale with confidence.",
    link: "https://www.shadcntemplates.com/theme/ixartz-saas-boilerplate/",
    tags: ["templates", "enhanced"]
  },
  {
    id: "admin",
    title: "Admin",
    description:
      "Admin dashboard UI template built with Shadcn (Next.js/Vite variants noted). Includes multiple page examples and a cohesive design system.",
    link: "https://www.shadcntemplates.com/theme/satnaing-shadcn-admin/",
    tags: ["templates", "enhanced"]
  },
  {
    id: "new-cult",
    title: "New Cult",
    description:
      "A powerful set of fullstack templates for Next.js, Tailwind, and Shadcn. Paid offering designed to accelerate real-world product delivery.",
    link: "https://www.shadcntemplates.com/theme/newcult-newcult/",
    tags: ["templates", "enhanced"]
  },
  {
    id: "landing",
    title: "Landing",
    description:
      "Landing page template emphasizing community, resources, tutorials, and support. Mobile-friendly and customizable (colors, fonts, images) with social proof, targeted content, strong visuals, and clear CTAs.",
    link: "https://shadcn-landing-page-livid.vercel.app/",
    tags: ["templates", "modern"]
  },
  {
    id: "landing-react",
    title: "Landing React",
    description:
      "A polished landing page template leveraging Shadcn/React patterns to quickly bootstrap marketing experiences with sensible defaults.",
    link: "https://shadcn-landing-page.vercel.app/",
    tags: ["templates"]
  },
  {
    id: "relative",
    title: "Relative",
    description:
      "Marketing site template crafted with Next.js, shadcn/ui, and Tailwind. Provides essential sections to launch quickly with consistent design.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-relative/",
    tags: ["templates", "modern"]
  },
  {
    id: "charter",
    title: "Charter",
    description:
      "Fintech-style app template built on Next.js with shadcn/ui and Tailwind. Ideal foundation for finance, SaaS, or operations-heavy apps.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-charter/",
    tags: ["templates", "modern"]
  },
  {
    id: "streamline",
    title: "Streamline",
    description:
      "Minimal yet unique landing page template built with Next.js 15, shadcn/ui, and Tailwind 4. Focused on clarity and performance.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-streamline/",
    tags: ["templates", "modern"]
  },
  {
    id: "forge",
    title: "Forge",
    description:
      "Next.js shadcn boilerplate designed to have everything ready to start building new projects. Reduces setup time and standardizes best practices.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["templates", "enhanced"]
  },
  {
    id: "starter",
    title: "Starter",
    description:
      "Next.js shadcn starter kit providing authentication, payment, and testing tools out of the box. Optimized for developer velocity.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["templates", "enhanced"]
  },
  {
    id: "ai-boilerplate",
    title: "AI Boilerplate",
    description:
      "Next.js shadcn AI web app boilerplate with a range of UI components and an admin interface. Great baseline for AI-focused products.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["templates", "specialized", "enhanced"]
  },
  {
    id: "chadnext",
    title: "ChadNext",
    description:
      "Next.js shadcn starter kit designed to streamline development by providing essential features preconfigured and integrated.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["templates", "enhanced"]
  },
  {
    id: "saasy-land",
    title: "SaaSy Land",
    description:
      "A SaaS landing page template tailored to validate ideas and market offerings quickly with a consistent design language.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    tags: ["templates"]
  },
  {
    id: "saas-stripe",
    title: "Saas Stripe",
    description:
      "Open-source SaaS starter with user roles and admin panel using Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, shadcn/ui, Stripe, and Server Actions.",
    link: "https://www.shadcntemplates.com/theme/mickasmt-next-saas-stripe-starter/",
    tags: ["templates", "enhanced"]
  },

  // Innovative Individual Components & Tools
  {
    id: "phone-input",
    title: "Phone Input",
    description:
      "Production-grade phone input built on top of shadcn/ui input. Includes country select, formatting, and comprehensive setup docs.",
    link: "https://shadcn-phone-input.vercel.app/",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "autocomplete",
    title: "Autocomplete",
    description:
      "Custom autocomplete built using Shadcn UI and Fancy Multi Select. Interactive demo and instructions for adapting to your use cases.",
    link: "https://armand-salle.fr/post/autocomplete-select-shadcn-ui/",
    tags: ["components", "specialized"]
  },
  {
    id: "sidebar",
    title: "Sidebar",
    description:
      "Composable, themeable, and customizable sidebar component documented in the official shadcn/ui site. Practical foundation for app shells.",
    link: "https://ui.shadcn.com/docs/components/sidebar",
    tags: ["components", "enhanced"]
  },
  {
    id: "novel",
    title: "Novel",
    description:
      "Notion-style WYSIWYG editor with AI-powered autocompletion. Demonstrates advanced rich text editing capabilities with modern UX.",
    link: "https://github.com/steven-tey/novel",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "charts",
    title: "Charts",
    description:
      "Official chart library built with Recharts following shadcn UI principles. Copy/paste components for fast, consistent data visualization.",
    link: "https://www.shadcntemplates.com/theme/shadcn-ui-charts/",
    tags: ["components", "enhanced"]
  },
  {
    id: "plate",
    title: "Plate",
    description:
      "Rich-text editor ecosystem for React, commonly paired with shadcn/ui. Highly extensible plugins and features for complex editing flows.",
    link: "https://github.com/udecode/plate",
    tags: ["components", "enhanced"]
  },
  {
    id: "vaul",
    title: "Vaul",
    description:
      "Accessible drawer component for React. Pairs naturally with shadcn/ui primitives for app navigation and modals.",
    link: "https://github.com/emilkowalski/vaul",
    tags: ["components", "enhanced"]
  },
  {
    id: "number-flow",
    title: "Number Flow",
    description:
      "React component for transitioning, formatting, and localizing numbers. Ideal for counters, KPIs, and dashboards.",
    link: "https://github.com/barvian/number-flow",
    tags: ["components", "enhanced"]
  },
  {
    id: "auto-form",
    title: "Auto Form",
    description:
      "Automatically render forms from your existing data schema. Reduces repetitive UI work while staying customizable.",
    link: "https://github.com/vantezzen/autoform",
    tags: ["components", "enhanced"]
  },
  {
    id: "next-stepper",
    title: "next-stepper",
    description:
      "Dynamic multi-step form built with Next.js, shadcn/ui, zustand, and framer-motion. A pattern for progressive data collection.",
    link: "https://github.com/ebulku/next-stepper",
    tags: ["components", "enhanced"]
  },
  {
    id: "form-builder",
    title: "Form Builder",
    description:
      "Dynamic form-building tool enabling users to create, customize, and validate forms seamlessly within web applications.",
    link: "https://github.com/hasanharman/form-builder",
    tags: ["components", "enhanced"]
  },

  // Real-world Apps & Demos
  {
    id: "taxonomy",
    title: "Taxonomy",
    description:
      "Open-source example app using Next.js 13 server components. Demonstrates authentication, subscriptions, API routes, static pages, and more in a modern stack.",
    link: "https://tx.shadcn.com/",
    tags: ["templates", "modern", "enhanced"]
  },
  {
    id: "tablecn",
    title: "Tablecn",
    description:
      "Task and data management interface with server-driven filtering and sorting. Shows robust table UX patterns and state handling.",
    link: "https://tablecn.com/",
    tags: ["components", "specialized"]
  },
  {
    id: "shadcn-chatbot-kit",
    title: "shadcn Chatbot Kit",
    description:
      "Toolkit for building beautifully designed chatbot components based on shadcn/ui. Fully customizable components to ship AI apps in hours, not days.",
    link: "https://shadcn-chatbot-kit.vercel.app/",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "skateshop",
    title: "Skateshop",
    description:
      "Open-source e-commerce storefront built with modern Next.js features and shadcn/ui. A complete example of product, cart, and checkout flows.",
    link: "https://www.shadcntemplates.com/theme/sadmann7-skateshop/",
    tags: ["templates", "enhanced"]
  },
  {
    id: "invoify",
    title: "Invoify",
    description:
      "Invoice generator app built with Next.js and TypeScript using shadcn. Demonstrates CRUD flows and document-style UI interactions.",
    link: "https://www.shadcntemplates.com/theme/al1abb-invoify/",
    tags: ["templates"]
  },
  {
    id: "inbox-zero",
    title: "Inbox Zero",
    description:
      "Open-source AI personal assistant for email designed to help reach inbox zero quickly. Real-world AI UI patterns with shadcn/ui.",
    link: "https://www.shadcntemplates.com/theme/elie222-inbox-zero/",
    tags: ["templates", "specialized"]
  },
  {
    id: "onur-dev",
    title: "Onur.dev",
    description:
      "Personal website using Next.js, Tailwind CSS, shadcn/ui, Contentful, Raindrop, and Supabase; deployed on Vercel. Production example of the stack in action.",
    link: "https://www.shadcntemplates.com/theme/suyalcinkaya-onur/",
    tags: ["templates", "modern"]
  },
  {
    id: "21st",
    title: "21st",
    description:
      "Marketplace for shadcn/ui-based React Tailwind components, blocks, and hooks (an \"npm for design engineers\"). Highlights the ecosystem’s commercial maturity.",
    link: "https://21st.dev/",
    tags: ["templates", "enhanced"]
  },
  {
    id: "stack-auth",
    title: "Stack",
    description:
      "Open-source Auth0/Clerk alternative. Demonstrates authentication flows and admin features built with modern Next.js + shadcn/ui.",
    link: "https://www.shadcntemplates.com/theme/stack-auth-stack/",
    tags: ["templates", "specialized"]
  },
  {
    id: "next-wp",
    title: "Next Wp",
    description:
      "Headless WordPress built with the Next.js App Router and React Server Components. Shows how shadcn/ui fits into content-heavy sites.",
    link: "https://www.shadcntemplates.com/theme/9d8dev-next-wp/",
    tags: ["templates", "enhanced"]
  }
]


