// Awesome shadcn ecosystem data (title, description, link) with background tags for search/sort

export type AwesomeShadcnItem = {
  id: string
  title: string
  description: string
  link: string
  repository?: string // Optional repository URL for GitHub/GitLab/etc.
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
    repository: "https://github.com/radix-ui/primitives",
    tags: ["core", "tools"]
  },
  {
    id: "shadcn",
    title: "shadcn",
    description:
      "The original copy-paste React component collection built on top of Radix UI and Tailwind CSS. Emphasizes ownership, flexibility, accessibility, and performance by integrating source code directly into your app rather than shipping a dependency.",
    link: "https://ui.shadcn.com/",
    repository: "https://github.com/shadcn/ui",
    tags: ["core", "components", "modern"]
  },
  

  // Component Libraries & Collections
  {
    id: "aceternity",
    title: "Aceternity",
    description:
      "Trending, highly animated components focused on styling and motion. Copy and paste to create beautiful websites in minutes.",
    link: "https://ui.aceternity.com/",
    repository: "https://github.com/aceternity/ui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "magic",
    title: "Magic",
    description:
      "UI library for Design Engineers with 150+ free, open-source animated components and effects. Built with React, TypeScript, Tailwind, and Motion; designed to pair with shadcn.",
    link: "https://magicui.design/",
    repository: "https://github.com/magicui/magicui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "magic-pro",
    title: "Magic Pro",
    description:
      "Commercial companion to Magic featuring 50+ polished sections and templates for rapid page assembly, ideal for production-grade design systems.",
    link: "https://pro.magicui.design/?ref=bytefer",
    repository: "https://github.com/magicui/magicui-pro",
    tags: ["components", "templates", "enhanced"]
  },
  {
    id: "cult",
    title: "Cult",
    description:
      "Components crafted for Design Engineers. Styled with Tailwind, fully compatible with shadcn, and easy to integrate through copy-paste. MIT licensed for broad use.",
    link: "https://www.cult-ui.com/",
    repository: "https://github.com/cult-ui/cult-ui",
    tags: ["components", "modern"]
  },
  {
    id: "jolly",
    title: "Jolly",
    description:
      "Shadcn-compatible React Aria components that are accessible, customizable, and open source. Designed to be copied and pasted directly into your apps.",
    link: "https://www.jollyui.dev/",
    repository: "https://github.com/jollyui/jollyui",
    tags: ["components", "enhanced"]
  },
  {
    id: "fusion",
    title: "Fusion",
    description:
      "Fusion of shadcn and Magic UI delivering 150+ free, open-source components. Useful for building modern UIs quickly with a broad selection.",
    link: "https://github.com/nyxb-ui/ui",
    repository: "https://github.com/nyxb-ui/ui",
    tags: ["components", "modern"]
  },
  {
    id: "origin",
    title: "Origin",
    description:
      "Open-source, copy-and-paste components for building application UIs. Powered by Tailwind CSS and React, emphasizing speed and extensibility.",
    link: "https://originui.com/",
    repository: "https://github.com/originui/originui",
    tags: ["components", "modern"]
  },
  {
    id: "myna",
    title: "Myna",
    description:
      "A TailwindCSS and shadcn kit for Figma and React. A paid resource offering modern, accessible, and customizable elements for professional workflows.",
    link: "https://mynaui.com/",
    repository: "https://github.com/mynaui/mynaui",
    tags: ["components", "enhanced", "modern"]
  },
  {
    id: "eldora",
    title: "Eldora",
    description:
      "A collection of reusable components to copy and paste into your web apps. Focused on practical building blocks you can adapt to your design system.",
    link: "https://www.eldoraui.site/",
    repository: "https://github.com/eldoraui/eldoraui",
    tags: ["components"]
  },
  {
    id: "page",
    title: "Page",
    description:
      "Landing page UI components for React and Next.js, built on TailwindCSS. Great for marketing pages and quick page assembly.",
    link: "https://pageai.pro/",
    repository: "https://github.com/pageai/pageai",
    tags: ["components", "templates"]
  },
  {
    id: "tremor",
    title: "Tremor",
    description:
      "Copy-and-paste React components for modern applications with emphasis on charts and data-heavy interfaces.",
    link: "https://tremor.so/",
    repository: "https://github.com/tremor-sh/tremor",
    tags: ["components", "enhanced"]
  },
  {
    id: "syntax",
    title: "Syntax",
    description:
      "Pre-built, Tailwind-powered components, animations, and effects brought to life using Framer Motion. Free access for rapid prototyping.",
    link: "https://syntaxui.com/",
    repository: "https://github.com/syntaxui/syntaxui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "farm",
    title: "Farm",
    description:
      "Client-first, animation-rich component library built on Radix and shadcn, targeting interactive experiences and refined motion.",
    link: "https://www.farmui.com/",
    repository: "https://github.com/farmui/farmui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "indie",
    title: "Indie",
    description:
      "Free collection of UI components for building web apps. Built with React and Tailwind CSS, suitable for quickly scaffolding UI patterns.",
    link: "https://ui.indie-starter.dev/",
    repository: "https://github.com/indie-starter/ui",
    tags: ["components"]
  },
  {
    id: "mixcn",
    title: "Mixcn",
    description:
      "20+ free, open-source animated components implemented with React, TypeScript, Tailwind, and Framer Motion. Optimized for delightful micro-interactions.",
    link: "https://mixcn-ui.vercel.app/",
    repository: "https://github.com/mixcn-ui/mixcn-ui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "edil-ozi",
    title: "Edil Ozi Components",
    description:
      "Open-source components you can copy and paste into your apps. Focused on developer ergonomics and practical building blocks.",
    link: "https://www.edil-ozi.pro/",
    repository: "https://github.com/edil-ozi/edil-ozi",
    tags: ["components"]
  },
  {
    id: "bund",
    title: "Bund",
    description:
      "A collection of components built with Tailwind CSS and Framer Motion. Ready to copy/paste and extend for your product UI.",
    link: "https://bundui.io/",
    repository: "https://github.com/bundui/bundui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "lukacho",
    title: "Lukacho",
    description:
      "Next-generation UI components designed for modern React apps. Aimed at speed, reusability, and stylistic flexibility.",
    link: "https://ui.lukacho.com/",
    repository: "https://github.com/lukacho/ui",
    tags: ["components", "modern"]
  },
  {
    id: "expansions",
    title: "Expansions",
    description:
      "An extended registry providing more components built on top of shadcn, expanding your toolkit beyond the core set.",
    link: "https://www.shadcntemplates.com/theme/hsuanyi-chou-shadcn-ui-expansions/",
    repository: "https://github.com/shadcntemplates/hsuanyi-chou-shadcn-ui-expansions",
    tags: ["components", "enhanced"]
  },
  {
    id: "motion",
    title: "Motion",
    description:
      "A customizable, open-source UI kit for creating animated interfaces faster. Useful as a foundation for motion-heavy experiences.",
    link: "https://www.shadcntemplates.com/theme/ibelick-motion-primitives/",
    repository: "https://github.com/ibelick/motion-primitives",
    tags: ["components", "animated"]
  },
  {
    id: "spectrum",
    title: "Spectrum",
    description:
      "Next.js shadcn component library that helps developers accelerate project growth with pre-built parts and patterns.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["components", "enhanced"]
  },
  {
    id: "worigami",
    title: "Worigami",
    description:
      "React shadcn component library offering many useful blocks to simply copy and paste in your apps for quick assembly.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["components", "templates"]
  },
  {
    id: "animate",
    title: "Animate",
    description:
      "Fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, Motion, and Shadcn CLI. Focused on rich motion design.",
    link: "https://www.shadcntemplates.com/theme/animate-ui-animate-ui/",
    repository: "https://github.com/animate-ui/animate-ui",
    tags: ["components", "animated", "modern"]
  },
  {
    id: "intent",
    title: "Intent",
    description:
      "A chill set of React components built on React Aria Components and Tailwind CSS. Easy to customize and copy/paste for accessible experiences.",
    link: "https://www.shadcntemplates.com/theme/irsyadadl-intentui/",
    repository: "https://github.com/irsyadadl/intentui",
    tags: ["components", "enhanced"]
  },
  {
    id: "kibo",
    title: "Kibo",
    description:
      "A custom registry of composable, accessible, open-source shadcn/ui components. Helps teams standardize on flexible, reusable parts.",
    link: "https://www.shadcntemplates.com/theme/haydenbleasel-kibo/",
    repository: "https://github.com/haydenbleasel/kibo",
    tags: ["components", "enhanced"]
  },

  // Specialized Blocks
  {
    id: "blocks",
    title: "Blocks",
    description:
      "Premium collection of 700+ uniquely crafted blocks and components tailored for shadcn/ui, Tailwind, and React. High-quality, interactive, and fully responsive sections for building landing and marketing pages in minutes. Lifetime access and updates.",
    link: "https://www.shadcnblocks.com/",
    repository: "https://github.com/shadcnblocks/shadcnblocks",
    tags: ["templates", "components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-kit",
    title: "ShadcnKit",
    description:
      "Prebuilt components, blocks, and pages to ship faster: 400+ tiny components, 100+ prebuilt pages, and 12+ dashboards. Built with Next.js and shadcn/ui, includes a fully customizable Figma version and theme support.",
    link: "https://kit.shadcnui.com/",
    repository: "https://github.com/shadcnui/kit",
    tags: ["templates", "components", "specialized", "enhanced"]
  },
  {
    id: "tailark",
    title: "Tailark",
    description:
      "Modern, responsive, pre-built UI blocks for creating marketing websites with Shadcn UI. Accelerate page assembly with opinionated, polished sections.",
    link: "https://nsui.irung.me/",
    repository: "https://github.com/nsui/nsui",
    tags: ["templates", "specialized"]
  },
  {
    id: "blocks-two",
    title: "Blocks two",
    description:
      "Effortless Shadcn UI component previews and code snippets. Offers uniquely designed sections that are fully responsive, easy to copy, and free to use with multiple variants.",
    link: "https://www.shadcnui-blocks.com/",
    repository: "https://github.com/shadcnui-blocks/shadcnui-blocks",
    tags: ["templates", "components", "enhanced"]
  },
  {
    id: "twblocks",
    title: "TWBlocks",
    description:
      "Website blocks to copy/paste, based on shadcn and Radix using Tailwind and Next.js. Useful for fast composition of landing pages.",
    link: "https://www.shadcntemplates.com/theme/tommyjepsen-twblocks/",
    repository: "https://github.com/tommyjepsen/twblocks",
    tags: ["templates", "specialized"]
  },
  {
    id: "neobrutalism",
    title: "Neobrutalism",
    description:
      "Collection of neobrutalism-styled Tailwind components. A distinct aesthetic for standout marketing and content layouts.",
    link: "https://github.com/ekmas/neobrutalism-components",
    repository: "https://github.com/ekmas/neobrutalism-components",
    tags: ["components", "modern"]
  },

  // Application Templates & Starters
  {
    id: "saas",
    title: "SaaS",
    description:
      "Ready-to-use template to launch SaaS faster with modern technologies and essential integrations. Combines Next.js/React, Postgres, Drizzle ORM, and Stripe for a solid full-stack baseline.",
    link: "https://next-saas-start.vercel.app/",
    repository: "https://github.com/next-saas-start/next-saas-start",
    tags: ["templates", "enhanced", "modern", "saas"]
  },
  {
    id: "boilerplate",
    title: "Boilerplate",
    description:
      "A full-stack React application with Auth, Multi-tenancy, Roles & Permissions, i18n, Landing Page, DB, Logging, and Testing. Built to save time on boilerplate and scale with confidence.",
    link: "https://www.shadcntemplates.com/theme/ixartz-saas-boilerplate/",
    repository: "https://github.com/ixartz/Next-js-Boilerplate",
    tags: ["templates", "enhanced"]
  },
  {
    id: "admin",
    title: "Admin",
    description:
      "Admin dashboard UI template built with Shadcn (Next.js/Vite variants noted). Includes multiple page examples and a cohesive design system.",
    link: "https://www.shadcntemplates.com/theme/satnaing-shadcn-admin/",
    repository: "https://github.com/satnaing/shadcn-admin",
    tags: ["templates", "enhanced"]
  },
  {
    id: "new-cult",
    title: "New Cult",
    description:
      "A powerful set of fullstack templates for Next.js, Tailwind, and Shadcn. Paid offering designed to accelerate real-world product delivery.",
    link: "https://www.shadcntemplates.com/theme/newcult-newcult/",
    repository: "https://github.com/newcult/newcult",
    tags: ["templates", "enhanced"]
  },
  {
    id: "landing",
    title: "Landing",
    description:
      "Landing page template emphasizing community, resources, tutorials, and support. Mobile-friendly and customizable (colors, fonts, images) with social proof, targeted content, strong visuals, and clear CTAs.",
    link: "https://shadcn-landing-page-livid.vercel.app/",
    repository: "https://github.com/shadcn-landing-page/shadcn-landing-page",
    tags: ["templates", "modern"]
  },
  {
    id: "landing-react",
    title: "Landing React",
    description:
      "A polished landing page template leveraging Shadcn/React patterns to quickly bootstrap marketing experiences with sensible defaults.",
    link: "https://shadcn-landing-page.vercel.app/",
    repository: "https://github.com/shadcn-landing-page/shadcn-landing-page",
    tags: ["templates"]
  },
  {
    id: "shadcn-blocks",
    title: "ShadcnBlocks",
    description:
      "Modern and clean design with fully responsive layout. Built with Next.js 15, Tailwind CSS 3.4 & 4.0, and Shadcn UI Blocks for rapid development.",
    link: "https://shadcn-ui-landing-page.vercel.app/",
    repository: "https://github.com/shadcn-ui-landing-page/shadcn-ui-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "nextlanding",
    title: "NextLanding",
    description:
      "Easy to setup, customizable, quick, and responsive landing page generator. Built with Next.js and shadcn/ui for rapid deployment.",
    link: "https://nextlanding.rdev.pro/",
    repository: "https://github.com/nextlanding/nextlanding",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "travel-agency",
    title: "TravelAgency",
    description:
      "A Travel Agency Landing Page built with Next14, Shadcn, and Tailwind. Features destination showcases, booking flows, and travel-focused UI patterns.",
    link: "https://travel-agency-landing-page-zeta.vercel.app/",
    repository: "https://github.com/travel-agency-landing-page/travel-agency-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "convertfast",
    title: "ConvertFast",
    description:
      "Build beautiful landing pages with prebuilt code blocks. All based on shadcn-ui and tailwind. Includes CLI for developers to generate landing pages with ease.",
    link: "https://ui.convertfa.st/",
    repository: "https://github.com/convertfa/convertfa",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "startup-agency",
    title: "StartupAgency",
    description:
      "A Startup Agency Landing Page built with Next14, Shadcn, and Tailwind. Designed for modern startups with clean, professional aesthetics.",
    link: "https://startup-agency-landing-page.vercel.app/",
    repository: "https://github.com/startup-agency-landing-page/startup-agency-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "positivus",
    title: "Positivus",
    description:
      "Positivus landing page built with Nextjs, Shadcn, and Tailwind. Clean design focused on positive messaging and modern UI patterns.",
    link: "https://positivus-orpin.vercel.app/",
    repository: "https://github.com/positivus/positivus",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "saas-fullstack",
    title: "SaaSFullstack",
    description:
      "A fullstack SaaS landing page built with Nextjs, Zod, Prisma, PostgreSQL, Typescript, Tailwind and Shadcn. Complete backend integration example.",
    link: "https://saas-landing-page-with-zod-prisma-postgre-sql.vercel.app/",
    repository: "https://github.com/saas-landing-page/saas-landing-page",
    tags: ["templates", "landing", "enhanced", "modern"]
  },
  {
    id: "codante",
    title: "Codante",
    description:
      "Vamos criar uma landing page para um SaaS com o estilo de design do Notion. Para isso vamos usar Next.js, TailwindCSS e shadcn/ui.",
    link: "https://codante.io/mini-projetos/saas-landing-page-com-nextjs-e-shadcn-ui",
    repository: "https://github.com/codante/saas-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "rise",
    title: "Rise",
    description:
      "An alternate rise landing page built with Next14, Shadcn, and Tailwind. Modern design with smooth animations and responsive layouts.",
    link: "https://rise-landing-page.vercel.app/",
    repository: "https://github.com/rise-landing-page/rise-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "uifry",
    title: "UiFry",
    description:
      "UiFry landing page built with Nextjs, Shadcn, and Tailwind. Clean, modern interface with excellent user experience design.",
    link: "https://uifry-nine-sage.vercel.app/",
    repository: "https://github.com/uifry/uifry",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "online-learning",
    title: "OnlineLearning",
    description:
      "An online learning landing page built with Next14, Shadcn, Lenis and Tailwind. Smooth scrolling and educational-focused design patterns.",
    link: "https://online-learning-landing-page-iota.vercel.app/",
    repository: "https://github.com/online-learning-landing-page/online-learning-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "nextjs-shadcn",
    title: "NextjsShadcn",
    description:
      "Landing page template using Shadcn, Next js, React, Typescript and Tailwind. Comprehensive template with modern development practices.",
    link: "https://next-js-shadcn-landing-page.vercel.app/",
    repository: "https://github.com/next-js-shadcn-landing-page/next-js-shadcn-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "nextjs-landing",
    title: "NextjsLanding",
    description:
      "Free and open-source landing page template built with Next.js and Shadcn UI. Clean, professional design ready for production use.",
    link: "https://nextjs-shadcn-landing.vercel.app/",
    repository: "https://github.com/nextjs-shadcn-landing/nextjs-shadcn-landing",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "hcdc-its",
    title: "HCDCITS",
    description:
      "HCDC ITS Official Publication Website. Built with modern web technologies and shadcn/ui components for institutional use.",
    link: "https://hcdcits.vercel.app/",
    repository: "https://github.com/hcdcits/hcdcits",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "next-ts-shadcn",
    title: "NextTsShadcn",
    description:
      "Boilerplate template designed to quickly bootstrap a Next.js Web App, SPA, website or landing page with Next.js 15, React.js 19, TypeScript, Shadcn/ui, TailwindCSS 4 and much more in just 30 seconds.",
    link: "https://next-ts-shadcn-ui.d1a.app/",
    repository: "https://github.com/next-ts-shadcn-ui/next-ts-shadcn-ui",
    tags: ["templates", "landing", "enhanced", "modern"]
  },
  {
    id: "atomic-shad",
    title: "AtomicShad",
    description:
      "An open-source landing page template built with Next.js and all shadcn/ui components. Comprehensive component coverage for rapid development.",
    link: "https://atomic-shad.vercel.app/",
    repository: "https://github.com/atomic-shad/atomic-shad",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "travellian",
    title: "Travellian",
    description:
      "A travellian-agency landing page built with Nextjs, Shadcn, and Framer motion. Smooth animations and travel-focused design patterns.",
    link: "https://travellian-agency-landing-page.vercel.app/",
    repository: "https://github.com/travellian-agency-landing-page/travellian-agency-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "mohicantask",
    title: "Mohicantask",
    description:
      "Open-source landing page built with tailwindcss, shadcn-ui, react, and typescript. Clean, modern design with excellent performance.",
    link: "https://demo.mohicantask.com/",
    repository: "https://github.com/mohicantask/mohicantask",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "vue-uikit",
    title: "VueUIKit",
    description:
      "Shadcn UIKit - A revolutionary approach to building modern websites and landing pages using Vite + Vue 3 Shadcn UI in a speedy BunJS environment. Page Speed: 100%.",
    link: "https://vue-uikit-shadcn.vercel.app/",
    repository: "https://github.com/vue-uikit-shadcn/vue-uikit-shadcn",
    tags: ["templates", "landing", "modern", "vue"]
  },
  {
    id: "equalizer",
    title: "Equalizer",
    description:
      "Equalizer landing page with Next.js & Tailwind CSS & Shadcn/ui. Features audio equalizer controls, premium EQ features, and mobile app downloads for iOS and Android.",
    link: "https://equalizer-landing-page-eta.vercel.app/",
    repository: "https://github.com/equalizer-landing-page/equalizer-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "nextjs-saas",
    title: "NextjsSaas",
    description:
      "Modern SaaS landing page showcasing advanced UI animations and dynamic effects. Features responsive design, smooth animations, and clean user interface for enhanced user experience.",
    link: "https://nextjs-landing-saas.netlify.app/",
    repository: "https://github.com/nextjs-landing-saas/nextjs-landing-saas",
    tags: ["templates", "landing", "modern", "saas"]
  },
  {
    id: "creative-agency",
    title: "CreativeAgency",
    description:
      "A Creative Agency Landing Page built with Next14, Framer Motion, Shadcn, and Tailwind. Features portfolio showcases, service offerings, and team collaboration sections.",
    link: "https://creative-agency-website-version-2.vercel.app/",
    repository: "https://github.com/creative-agency-website-version-2/creative-agency-website-version-2",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "saas-landing",
    title: "SaasLanding",
    description:
      "A SaaS Landing template built using Next.JS 15, shadcn/ui, and fumadocs. Modern design with comprehensive documentation and component library integration.",
    link: "https://saas-landing.techwithanirudh.com/",
    repository: "https://github.com/saas-landing/saas-landing",
    tags: ["templates", "landing", "modern", "saas"]
  },
  {
    id: "bird-software",
    title: "BirdSoftware",
    description:
      "Landing page created using nextjs, shadcn, tailwindcss and typescript. E-commerce platform with customizable templates, fast performance, and comprehensive business features.",
    link: "https://landing-page-darthdevv.vercel.app/",
    repository: "https://github.com/landing-page-darthdevv/landing-page-darthdevv",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "saasify",
    title: "Saasify",
    description:
      "A modern, fully responsive SaaS landing page built with Next.js, TailwindCSS, ShadCN, and Framer Motion. Features dark/light mode, dynamic pages, and smooth animations.",
    link: "https://saasify-landing-website.vercel.app/",
    repository: "https://github.com/saasify-landing-website/saasify-landing-website",
    tags: ["templates", "landing", "modern", "saas"]
  },
  {
    id: "saas-wallet",
    title: "SaasWallet",
    description:
      "A SaaS landing page built with Nextjs 14, Typescript, Tailwind and Shadcn. Digital wallet platform with customizable cards, no payment fees, and comprehensive financial management.",
    link: "https://saas-wallet.vercel.app/",
    repository: "https://github.com/saas-wallet/saas-wallet",
    tags: ["templates", "modern"]
  },
  {
    id: "web-hosting",
    title: "WebHosting",
    description:
      "A webhosting landing page built with Next14, Shadcn, Lenis and Tailwind. Premium hosting services with cloud infrastructure, 24/7 support, and scalable solutions.",
    link: "https://web-hosting-landing-page.vercel.app/",
    repository: "https://github.com/web-hosting-landing-page/web-hosting-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "woo-commerce",
    title: "WooCommerce",
    description:
      "An alternate woo-commerce landing page built with Next14, Shadcn, and Tailwind. E-commerce focused design with modern UI patterns and responsive layouts.",
    link: "https://alternate-woo-commerce-landing-page.vercel.app/",
    repository: "https://github.com/alternate-woo-commerce-landing-page/alternate-woo-commerce-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "award-winning",
    title: "AwardWinning",
    description:
      "Award winning landing page using React, Three.js and GSAP. Advanced animations and 3D effects for creating immersive user experiences.",
    link: "https://award-wining-landing-page.vercel.app/",
    repository: "https://github.com/award-wining-landing-page/award-wining-landing-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "open-enterprise",
    title: "OpenEnterprise",
    description:
      "Open enterprise landing page built with Nextjs, Shadcn, and Tailwind. Professional business platform with modern design and enterprise-grade features.",
    link: "https://open-enterprise-beta.vercel.app/",
    repository: "https://github.com/open-enterprise-beta/open-enterprise-beta",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "landing-page-shadcn",
    title: "LandingPageShadcn",
    description:
      "Create stunning React landing pages effortlessly with ShadcnUI template. Streamlined development process with pre-built components and modern design patterns.",
    link: "https://landing-page-shadcn.vercel.app/",
    repository: "https://github.com/landing-page-shadcn/landing-page-shadcn",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "shadcn-ui-landing",
    title: "ShadcnUiLanding",
    description:
      "Build your React landing page effortlessly with the required sections to your project. Comprehensive template with essential landing page components.",
    link: "https://shadcn-ui-landing.vercel.app/",
    repository: "https://github.com/shadcn-ui-landing/shadcn-ui-landing",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "orbitai-ui",
    title: "OrbitAI",
    description:
      "SaaS Landing Page UI built with Next.js, Tailwindcss, Shadcn UI, and Framer Motion. Modern design with smooth animations and responsive layouts.",
    link: "https://orbitai-ui.vercel.app/",
    repository: "https://github.com/orbitai-ui/orbitai-ui",
    tags: ["templates", "landing", "modern", "saas"]
  },
  {
    id: "astra-ai",
    title: "AstraAI",
    description:
      "AI-powered website builder landing page that allows users to create fully functional websites with minimal effort. Built with modern web technologies and AI integration.",
    link: "https://astra-ai-galembeck.vercel.app/",
    repository: "https://github.com/astra-ai-galembeck/astra-ai-galembeck",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "fitness-club",
    title: "FitnessClub",
    description:
      "A modern fitness club landing page built with React, TypeScript, and shadcn/ui. Health and wellness focused design with modern UI patterns.",
    link: "https://fitness-club-page.vercel.app/",
    repository: "https://github.com/fitness-club-page/fitness-club-page",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "shadcn-dashboard",
    title: "ShadcnDashboard",
    description:
      "Admin Dashboard Starter with Nextjs 15 and Shadcn ui. Complete admin panel template with modern design and functionality.",
    link: "https://shadcn-dashboard.kiranism.dev/dashboard/overview",
    repository: "https://github.com/kiranism/shadcn-dashboard",
    tags: ["templates", "dashboard", "modern", "enhanced"]
  },
  {
    id: "horizon-ui",
    title: "HorizonUI",
    description:
      "Shadcn UI NextJS Boilerplate ⚡ Free Open-source ChatGPT UI Admin Dashboard Template - Horizon AI Boilerplate.",
    link: "https://horizon-ui.com/shadcn-nextjs-boilerplate",
    repository: "https://github.com/horizon-ui/shadcn-nextjs-boilerplate",
    tags: ["templates", "dashboard", "ai", "modern", "enhanced"]
  },
  {
    id: "tablecn-advanced",
    title: "Tablecn Advanced",
    description:
      "Shadcn table with server-side sorting, filtering, and pagination. Advanced data table component with full backend integration.",
    link: "https://tablecn.com",
    repository: "https://github.com/tablecn/tablecn",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "next-saas-start",
    title: "NextSaaSStart",
    description:
      "Get started quickly with Next.js, Postgres, Stripe, and shadcn/ui. Full-stack SaaS starter template with essential integrations.",
    link: "https://next-saas-start.vercel.app",
    repository: "https://github.com/next-saas-start/next-saas-start",
    tags: ["templates", "saas", "enhanced", "modern"]
  },
  {
    id: "alvest-finance",
    title: "Alvest Finance",
    description:
      "AI-powered financial analytics platform with automated insights and recommendations. Features expense tracking, real-time data, and secure authentication built with Next.js, Supabase, and shadcn/ui.",
    link: "https://alvest-finance.vercel.app/",
    repository: "https://github.com/ezeslucky/Ai-Saas-Finance",
    tags: ["templates", "finance", "ai", "saas", "enhanced", "modern"]
  },
  {
    id: "ai-finance-platform-piyush",
    title: "AI Finance Platform",
    description:
      "Full-stack AI finance platform powered by Google Gemini API. Includes intelligent financial analysis, expense tracking, and automated recommendations with Supabase, Prisma, Inngest, and ArcJet security.",
    link: "https://github.com/piyush-eon/ai-finance-platform",
    repository: "https://github.com/piyush-eon/ai-finance-platform",
    tags: ["templates", "finance", "ai", "saas", "enhanced", "modern"]
  },
  {
    id: "finance-platform-josue",
    title: "Finance Platform",
    description:
      "Personal finance SaaS platform with Plaid integration for bank connectivity. Features transaction tracking, categorization, account management, and CSV imports built with Next.js 14, Hono.js, and PostgreSQL.",
    link: "https://github.com/JosueIsOffline/finance-platform",
    repository: "https://github.com/JosueIsOffline/finance-platform",
    tags: ["templates", "finance", "saas", "enhanced", "modern"]
  },
  {
    id: "finance-forge",
    title: "Finance Forge",
    description:
      "Finance SaaS dashboard with customizable widgets and Recharts visualizations. Built with Next.js 14, Hono.js, Drizzle ORM, Clerk authentication, and mobile-friendly TanStack tables.",
    link: "https://finance-forge-mocha.vercel.app/",
    repository: "https://github.com/collinskchirchir/finance-forge",
    tags: ["templates", "finance", "saas", "dashboard", "enhanced", "modern"]
  },
  {
    id: "finance-tracker-thounny",
    title: "Finance Tracker",
    description:
      "Personal finance tracker with Plaid banking integration and Lemon Squeezy payments. Features transaction monitoring, categorization, account management, and CSV import capabilities.",
    link: "https://finance-tracker-rosy.vercel.app/",
    repository: "https://github.com/thounny/finance-tracker",
    tags: ["templates", "finance", "saas", "enhanced", "modern"]
  },
  {
    id: "mdtaquiimam",
    title: "MdTaquiImam",
    description:
      "A Simple Portfolio made with Nextjs and Shadcn UI. Clean, professional portfolio template for developers and designers.",
    link: "https://mdtaquiimam.vercel.app/",
    repository: "https://github.com/mdtaquiimam/mdtaquiimam",
    tags: ["templates", "portfolio", "modern"]
  },
  {
    id: "nextjs-15-starter",
    title: "Nextjs15Starter",
    description:
      "This starter template is built with Next.js 15, React 19, TypeScript 5, Tailwind CSS 3, Shadcn UI and comes packed with several powerful tools and configurations to accelerate your project setup and streamline development workflows using VS Code.",
    link: "https://nextjs-15-starter-shadcn.vercel.app",
    repository: "https://github.com/nextjs-15-starter-shadcn/nextjs-15-starter-shadcn",
    tags: ["templates", "enhanced", "modern"]
  },
  {
    id: "shadcn-ui-sidebar",
    title: "ShadcnUISidebar",
    description:
      "A stunning, functional and responsive retractable sidebar for Next.js built on top of shadcn/ui. Advanced navigation component with smooth animations.",
    link: "https://shadcn-ui-sidebar.salimi.my",
    repository: "https://github.com/shadcn-ui-sidebar/shadcn-ui-sidebar",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "shadcnui-expansions",
    title: "ShadcnuiExpansions",
    description:
      "More components built on top of shadcn-ui. Extended component library expanding the core shadcn/ui toolkit.",
    link: "https://shadcnui-expansions.typeart.cc",
    repository: "https://github.com/shadcnui-expansions/shadcnui-expansions",
    tags: ["components", "enhanced"]
  },
  {
    id: "ai-elements",
    title: "AIElements",
    description:
      "AI Elements is a component library and custom registry built on top of shadcn/ui to help you build AI-native applications faster. It provides pre-built components like conversations, messages and more.",
    link: "https://ai-sdk.dev/elements/overview",
    repository: "https://github.com/ai-sdk/ai-sdk",
    tags: ["components", "ai", "specialized", "enhanced"]
  },
  {
    id: "prompt-kit",
    title: "PromptKit",
    description:
      "High-quality, accessible, and customizable components for AI interfaces. Specialized components for building AI-powered applications.",
    link: "https://www.prompt-kit.com",
    repository: "https://github.com/prompt-kit/prompt-kit",
    tags: ["components", "ai", "specialized", "enhanced"]
  },
  {
    id: "shadcn-crm-dashboard",
    title: "ShadcnCrmDashboard",
    description:
      "Transform how you connect with customers. Piper brings AI-powered insights, automation, and a delightful interface to your CRM.",
    link: "https://shadcn-crm-dashboard.vercel.app/#home",
    repository: "https://github.com/shadcn-crm-dashboard/shadcn-crm-dashboard",
    tags: ["templates", "crm", "ai", "modern", "enhanced"]
  },
  {
    id: "twblocks-saas",
    title: "TWBlocks SaaS",
    description:
      "Beautifully designed website blocks for your SaaS website. Easily customizable with shadcn-ui themes and works in dark- and light mode.",
    link: "https://www.twblocks.com",
    repository: "https://github.com/twblocks/twblocks",
    tags: ["templates", "specialized", "saas"]
  },
  {
    id: "fullcalendar-shadcn",
    title: "FullCalendarShadcn",
    description:
      "A simple scheduling application built using FullCalendar, NextJS, and shadcn/ui components. Calendar and scheduling template.",
    link: "https://fullcalendar-shadcn-example.vercel.app",
    repository: "https://github.com/fullcalendar-shadcn/fullcalendar-shadcn-example",
    tags: ["templates", "specialized", "modern"]
  },
  {
    id: "nextjs-typescript-mdx-blog",
    title: "NextjsTypescriptMdxBlog",
    description:
      "UPDATED to Next.js App Router! Starter template built with Contentlayer, MDX, shadcn-ui, and Tailwind CSS.",
    link: "https://nextjs-typescript-mdx-blog.vercel.app",
    repository: "https://github.com/nextjs-typescript-mdx-blog/nextjs-typescript-mdx-blog",
    tags: ["templates", "blog", "mdx", "modern", "enhanced"]
  },
  {
    id: "shadcn-extension",
    title: "ShadcnExtension",
    description:
      "An open source component collection that extends your ui library, built using shadcn component.",
    link: "https://shadcn-extension.vercel.app",
    repository: "https://github.com/shadcn-extension/shadcn-extension",
    tags: ["components", "enhanced"]
  },
  {
    id: "invoify-new",
    title: "Invoify New",
    description:
      "An invoice generator app built using Next.js, Typescript, and Shadcn. Complete invoice management solution.",
    link: "https://invoify.vercel.app",
    repository: "https://github.com/invoify/invoify",
    tags: ["templates", "specialized", "modern"]
  },
  {
    id: "lms-course-platform",
    title: "LMSCoursePlatform",
    description:
      "A modern, feature-rich Learning Management System built with Next.js 15, Sanity CMS, Clerk, and Stripe. Features real-time content updates, course progress tracking, and secure payment processing.",
    link: "https://github.com/sonnysangha/lms-course-platform-saas-nextjs15-sanity-stripe-clerk-shadcn-typescript",
    repository: "https://github.com/sonnysangha/lms-course-platform-saas-nextjs15-sanity-stripe-clerk-shadcn-typescript",
    tags: ["templates", "lms", "saas", "enhanced", "modern"]
  },
  {
    id: "shadcn-ui-mcp-server",
    title: "ShadcnUIMCPServer",
    description:
      "A mcp server to allow LLMS gain context about shadcn ui component structure, usage and installation, compatible with react, svelte 5, and vue.",
    link: "https://github.com/Jpisnice/shadcn-ui-mcp-server",
    repository: "https://github.com/Jpisnice/shadcn-ui-mcp-server",
    tags: ["tools", "enhanced"]
  },
  {
    id: "shadcn-multi-select",
    title: "ShadcnMultiSelect",
    description:
      "A multi-select component designed with shadcn/ui. Advanced selection component with multiple options support.",
    link: "https://shadcn-multi-select-component.vercel.app",
    repository: "https://github.com/shadcn-multi-select-component/shadcn-multi-select-component",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-editor",
    title: "ShadcnEditor",
    description:
      "Lexical base rich text editor using shadcn/ui components. Full-featured text editor with modern UI.",
    link: "https://shadcn-editor.vercel.app",
    repository: "https://github.com/shadcn-editor/shadcn-editor",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "next-auth5-shadcn",
    title: "NextAuth5Shadcn",
    description:
      "Full Next Auth Solution with Nextjs and shadcn/ui. Complete authentication template with modern security features.",
    link: "https://github.com/codersaadi/next-auth5-shadcn",
    repository: "https://github.com/codersaadi/next-auth5-shadcn",
    tags: ["templates", "auth", "enhanced"]
  },
  {
    id: "shadcn-sidebar",
    title: "ShadcnSidebar",
    description:
      "This is a prebuild template NextJS using Shadcn ui as a css framework. Sidebar navigation template.",
    link: "https://github.com/Yudian00/shadcn-sidebar",
    repository: "https://github.com/Yudian00/shadcn-sidebar",
    tags: ["templates", "specialized"]
  },
  {
    id: "relivator",
    title: "Relivator",
    description:
      "relivator: next.js 15 react 19 ecommerce template ▲ better-auth polar shadcn/ui tailwind drizzle orm typescript ts radix, postgres neon, app router saas commerce ecommerce shop pricing payments dark mode full stack free ⭐ more stars 👉 more features.",
    link: "https://relivator.com",
    repository: "https://github.com/relivator/relivator",
    tags: ["templates", "ecommerce", "saas", "enhanced", "modern"]
  },
  {
    id: "my-first-blog",
    title: "MyFirstBlog",
    description:
      "A static blog template built using NextJS 14, Velite, Tailwind, Shadcn/UI and MDX. Follow along on YouTube!",
    link: "https://my-first-blog-dusky.vercel.app",
    repository: "https://github.com/my-first-blog/my-first-blog",
    tags: ["templates", "blog", "mdx", "modern"]
  },
  {
    id: "shadcn-chatbot-kit-new",
    title: "ShadcnChatbotKit New",
    description:
      "Beautifully designed chatbot components based on shadcn/ui. AI chatbot interface components for modern applications.",
    link: "https://shadcn-chatbot-kit.vercel.app/",
    repository: "https://github.com/shadcn-chatbot-kit/shadcn-chatbot-kit",
    tags: ["components", "ai", "specialized", "enhanced"]
  },
  {
    id: "shadcn-form",
    title: "ShadcnForm",
    description:
      "A dynamic form-building tool that allows users to create, customize, and validate forms seamlessly within web applications.",
    link: "https://www.shadcn-form.com",
    repository: "https://github.com/shadcn-form/shadcn-form",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "time-openstatus",
    title: "TimeOpenstatus",
    description:
      "A simple shadcn/ui TimePicker component. Time selection component with clean design.",
    link: "https://time.openstatus.dev",
    repository: "https://github.com/time-openstatus/time-openstatus",
    tags: ["components", "specialized"]
  },
  {
    id: "shadcn-portfoliox",
    title: "ShadcnPortfoliox",
    description:
      "A portfolio template, which uses shadcn-ui and Next.JS. Professional portfolio design template.",
    link: "https://shadcn-portfoliox.vercel.app/",
    repository: "https://github.com/shadcn-portfoliox/shadcn-portfoliox",
    tags: ["templates", "portfolio", "modern"]
  },
  {
    id: "shadcn-dashboard-simple",
    title: "ShadcnDashboardSimple",
    description:
      "A Simple Shadcn Dashboard. Clean and minimal dashboard template.",
    link: "https://shadcn-dashboard.netlify.app",
    repository: "https://github.com/shadcn-dashboard/shadcn-dashboard",
    tags: ["templates", "dashboard", "modern"]
  },
  {
    id: "country-state-dropdown",
    title: "CountryStateDropdown",
    description:
      "This Component is built with Nextjs, Tailwindcss, Shadcn-ui & Zustand for state management. Geographic selection component.",
    link: "https://country-state-dropdown.vercel.app/",
    repository: "https://github.com/country-state-dropdown/country-state-dropdown",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-nextjs-dashboard",
    title: "ShadcnNextjsDashboard",
    description:
      "Admin Dashboard UI built with Shadcn and NextJS. Complete admin panel template.",
    link: "https://shadcn-nextjs-dashboard.vercel.app/",
    repository: "https://github.com/shadcn-nextjs-dashboard/shadcn-nextjs-dashboard",
    tags: ["templates", "dashboard", "modern", "enhanced"]
  },
  {
    id: "booking-clone",
    title: "BookingClone",
    description:
      "Booking.com clone built with Next.js 14, shadcn, tailwind, typescript, and oxylabs. Complete travel booking platform template.",
    link: "https://github.com/sonnysangha/booking.com-clone-nextjs-14-shadcn-tailwind-typescript-oxylabs",
    repository: "https://github.com/sonnysangha/booking.com-clone-nextjs-14-shadcn-tailwind-typescript-oxylabs",
    tags: ["templates", "travel", "enhanced", "modern"]
  },
  {
    id: "attio",
    title: "Attio",
    description:
      "Attio website built with Nextjs, Shadcn, Tailwind and Framer motion. Modern business website template.",
    link: "https://attio-three.vercel.app/",
    repository: "https://github.com/attio-three/attio-three",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "pexllecn",
    title: "Pexllecn",
    description:
      "Building a complete nextjs starter supported by shadcn components. Comprehensive starter template with full component coverage.",
    link: "https://pexllecn.vercel.app/",
    repository: "https://github.com/pexllecn/pexllecn",
    tags: ["templates", "enhanced", "modern"]
  },
  {
    id: "next-dashboard",
    title: "NextDashboard",
    description:
      "Admin dashboard on NextJS and Shadcn UI. Professional admin interface template.",
    link: "https://next-dashboard-liart.vercel.app/",
    repository: "https://github.com/next-dashboard-liart/next-dashboard-liart",
    tags: ["templates", "dashboard", "modern"]
  },
  {
    id: "openai-rt-shadcn",
    title: "OpenaiRtShadcn",
    description:
      "Leverage the OpenAI Realtime API (12-17-2024) with this Next.js 15 starter template featuring shadcn/ui components, tool-calling & localization. Use starter to build Voice AI apps with WebRTC.",
    link: "https://openai-rt-shadcn.vercel.app/",
    repository: "https://github.com/openai-rt-shadcn/openai-rt-shadcn",
    tags: ["templates", "ai", "enhanced", "modern"]
  },
  {
    id: "nextjs-shadcn-dnd",
    title: "NextjsShadcnDnd",
    description:
      "Sortable Drag and Drop with Next.js, Shadcn UI, and DnD-Kit. Interactive drag and drop component.",
    link: "https://nextjs-shadcn-dnd.vercel.app/",
    repository: "https://github.com/nextjs-shadcn-dnd/nextjs-shadcn-dnd",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "pinoyoverflow",
    title: "Pinoyoverflow",
    description:
      "React | TypeScript | NextJS | MongoDB | Tailwind CSS | Clerk | shadcn/ui | Prism | zod. Full-stack development platform.",
    link: "https://www.pinoyoverflow.com/",
    repository: "https://github.com/pinoyoverflow/pinoyoverflow",
    tags: ["templates", "fullstack", "enhanced", "modern"]
  },
  {
    id: "pricing-page-shadcn",
    title: "PricingPageShadcn",
    description:
      "Pricing Page template made with Shadcn UI & Next.js 14. Completely customizable pricing component.",
    link: "https://pricing-page-shadcn.vercel.app/",
    repository: "https://github.com/pricing-page-shadcn/pricing-page-shadcn",
    tags: ["components", "specialized", "modern"]
  },
  {
    id: "shadcn-image-cropper",
    title: "ShadcnImageCropper",
    description:
      "Image cropper built with shadcn/ui and react-image-crop. Image editing component with crop functionality.",
    link: "https://shadcn-image-cropper.vercel.app/",
    repository: "https://github.com/shadcn-image-cropper/shadcn-image-cropper",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "time-rdsx",
    title: "TimeRdsx",
    description:
      "ShadCN Date Time Picker. Advanced date and time selection component.",
    link: "https://time.rdsx.dev/",
    repository: "https://github.com/time-rdsx/time-rdsx",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "nextjs-shadcn-admin",
    title: "NextjsShadcnAdmin",
    description:
      "Multi language NextJS app-router admin template built on top of Shadcn, tailwindcss and next-intl. Internationalized admin template.",
    link: "https://nextjs-shadcn-admin.vercel.app/",
    repository: "https://github.com/nextjs-shadcn-admin/nextjs-shadcn-admin",
    tags: ["templates", "dashboard", "i18n", "enhanced", "modern"]
  },
  {
    id: "nextjs-weather-app",
    title: "NextjsWeatherApp",
    description:
      "Real-time weather app build with Next.js 14, Typescript and Shadcn UI. It's a simple, yet powerful app that gives you all the weather information you need, in a beautiful and easy-to-use interface.",
    link: "https://github.com/DariusLukasukas/nextjs-weather-app",
    repository: "https://github.com/DariusLukasukas/nextjs-weather-app",
    tags: ["templates", "weather", "modern"]
  },
  {
    id: "onur-dev-new",
    title: "OnurDev New",
    description:
      "My personal website built using Next.js, Tailwind CSS, shadcn/ui, Contentful, Raindrop, Supabase and deployed on Vercel. Production example of the stack in action.",
    link: "https://onur.dev/",
    repository: "https://github.com/onur/onur.dev",
    tags: ["templates", "portfolio", "modern"]
  },
  {
    id: "nextjs-typescript-mongodb",
    title: "NextjsTypescriptMongodb",
    description:
      "A very minimal Next.js template that uses server actions, Prisma, PostgreSQL, TailwindCSS, Shadcn, Zod and Next auth. Minimal full-stack template.",
    link: "https://nextjs-typescript-and-mongodb-psi.vercel.app/",
    repository: "https://github.com/nextjs-typescript-and-mongodb-psi/nextjs-typescript-and-mongodb-psi",
    tags: ["templates", "fullstack", "enhanced", "modern"]
  },
  {
    id: "indie-starter",
    title: "IndieStarter",
    description:
      "Collection of UI components and free shadcn form builder. Component library with form building tools.",
    link: "https://ui.indie-starter.dev/",
    repository: "https://github.com/indie-starter/ui",
    tags: ["components", "enhanced"]
  },
  {
    id: "shadcn-timeline",
    title: "ShadcnTimeline",
    description:
      "Customizable and re-usable timeline component for you to use in your projects. Built on top of shadcn. Timeline visualization component.",
    link: "https://timdehof.github.io/shadcn-timeline/",
    repository: "https://github.com/timdehof/shadcn-timeline",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "credenza",
    title: "Credenza",
    description:
      "Ready-made responsive modal component for shadcn/ui. Modal and dialog component library.",
    link: "https://credenza.rdev.pro/",
    repository: "https://github.com/credenza/credenza",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-cookie-consent",
    title: "ShadcnCookieConsent",
    description:
      "(updated) Beautifully designed, customizable cookie consent for web built on top of shadcn-ui and tailwind-css! Cookie management component.",
    link: "https://shadcn-cookie-consent.vercel.app/",
    repository: "https://github.com/shadcn-cookie-consent/shadcn-cookie-consent",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "shadcn-ui-theme-explorer",
    title: "ShadcnUIThemeExplorer",
    description:
      "A theme explorer for shadcn UI. Theme customization and exploration tool.",
    link: "https://shadcn-ui-theme-explorer.vercel.app/",
    repository: "https://github.com/shadcn-ui-theme-explorer/shadcn-ui-theme-explorer",
    tags: ["tools", "enhanced"]
  },
  {
    id: "kokonutui",
    title: "KokonutUI",
    description:
      "Collection of UI components. Built for Next.js and React with Tailwind CSS and shadcn/ui. Component library for modern applications.",
    link: "https://kokonutui.com/",
    repository: "https://github.com/kokonutui/kokonutui",
    tags: ["components", "modern"]
  },
  {
    id: "mkdocs-shadcn",
    title: "MkdocsShadcn",
    description:
      "MkDocs in NextJs. Documentation site template with shadcn/ui styling.",
    link: "https://www.mkdocs-shadcn.org/",
    repository: "https://github.com/mkdocs-shadcn/mkdocs-shadcn",
    tags: ["templates", "documentation", "modern"]
  },
  {
    id: "enhanced-button",
    title: "EnhancedButton",
    description:
      "An enhanced version of the default shadcn-button component. Advanced button component with extended functionality.",
    link: "https://enhanced-button.vercel.app/",
    repository: "https://github.com/enhanced-button/enhanced-button",
    tags: ["components", "enhanced"]
  },
  {
    id: "forms-ouassim",
    title: "FormsOuassim",
    description:
      "Shadcn/ui form builder. Dynamic form creation and management tool.",
    link: "https://forms.ouassim.tech/",
    repository: "https://github.com/forms-ouassim/forms-ouassim",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "parallel-routes-demo",
    title: "ParallelRoutesDemo",
    description:
      "v0 + Shadcn UI version. Next.js parallel routes demonstration with shadcn/ui components.",
    link: "https://parallel-routes-demo.vercel.app/leerob",
    repository: "https://github.com/parallel-routes-demo/parallel-routes-demo",
    tags: ["templates", "specialized", "modern"]
  },
  {
    id: "components-work",
    title: "ComponentsWork",
    description:
      "Next.js components built with Tailwind, Typescript, brijr/craft, shadcn/ui, and more. Component library for professional applications.",
    link: "https://components.work/",
    repository: "https://github.com/components-work/components-work",
    tags: ["components", "enhanced", "modern"]
  },
  {
    id: "telegram-mini-app",
    title: "TelegramMiniApp",
    description:
      "Telegram mini app boiler plate using Nextjs, shadcn/ui, tailwindcss and @tma.js/sdk. Telegram bot application template.",
    link: "https://github.com/Buidlso/telegram-mini-app-nextjs-boilerplate",
    repository: "https://github.com/Buidlso/telegram-mini-app-nextjs-boilerplate",
    tags: ["templates", "telegram", "enhanced", "modern"]
  },
  {
    id: "multiversx-nextjs-dapp",
    title: "MultiversxNextjsDapp",
    description:
      "Open source Next.js app template for the MultiversX blockchain. Including Shadcn UI and Tailwind. Blockchain application template.",
    link: "https://multiversx-nextjs-dapp.netlify.app/",
    repository: "https://github.com/multiversx-nextjs-dapp/multiversx-nextjs-dapp",
    tags: ["templates", "blockchain", "modern"]
  },
  {
    id: "awwwards",
    title: "Awwwards",
    description:
      "Awwwards website built with Nextjs, Tailwind, Framer motion and Shadcn. Award-winning design showcase template.",
    link: "https://awwwards-nine.vercel.app/",
    repository: "https://github.com/awwwards-nine/awwwards-nine",
    tags: ["templates", "showcase", "modern"]
  },
  {
    id: "shadcn-calendar-component",
    title: "ShadcnCalendarComponent",
    description:
      "A calendar date picker component designed with shadcn/ui. Calendar and date selection component.",
    link: "https://shadcn-calendar-component.vercel.app/",
    repository: "https://github.com/shadcn-calendar-component/shadcn-calendar-component",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "furniro-ecommerce",
    title: "FurniroEcommerce",
    description:
      "A fullstack ecommerce application built with Nextjs, Shadcn, Zod, MongoDB, Stripe and Framer motion. Complete e-commerce platform template.",
    link: "https://furniro-ecommerce-blue.vercel.app/",
    repository: "https://github.com/furniro-ecommerce-blue/furniro-ecommerce-blue",
    tags: ["templates", "ecommerce", "fullstack", "enhanced", "modern"]
  },
  {
    id: "relative",
    title: "Relative",
    description:
      "Marketing site template crafted with Next.js, shadcn/ui, and Tailwind. Provides essential sections to launch quickly with consistent design.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-relative/",
    repository: "https://github.com/shadcnblockscom/shadcnblockscom-relative",
    tags: ["templates", "modern"]
  },
  {
    id: "charter",
    title: "Charter",
    description:
      "Fintech-style app template built on Next.js with shadcn/ui and Tailwind. Ideal foundation for finance, SaaS, or operations-heavy apps.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-charter/",
    repository: "https://github.com/shadcnblockscom/shadcnblockscom-charter",
    tags: ["templates", "modern"]
  },
  {
    id: "streamline",
    title: "Streamline",
    description:
      "Minimal yet unique landing page template built with Next.js 15, shadcn/ui, and Tailwind 4. Focused on clarity and performance.",
    link: "https://www.shadcntemplates.com/theme/shadcnblockscom-streamline/",
    repository: "https://github.com/shadcnblockscom/shadcnblockscom-streamline",
    tags: ["templates", "modern"]
  },
  {
    id: "forge",
    title: "Forge",
    description:
      "Next.js shadcn boilerplate designed to have everything ready to start building new projects. Reduces setup time and standardizes best practices.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["templates", "enhanced"]
  },
  {
    id: "starter",
    title: "Starter",
    description:
      "Next.js shadcn starter kit providing authentication, payment, and testing tools out of the box. Optimized for developer velocity.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["templates", "enhanced"]
  },
  {
    id: "ai-boilerplate",
    title: "AI Boilerplate",
    description:
      "Next.js shadcn AI web app boilerplate with a range of UI components and an admin interface. Great baseline for AI-focused products.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["templates", "specialized", "enhanced"]
  },
  {
    id: "chadnext",
    title: "ChadNext",
    description:
      "Next.js shadcn starter kit designed to streamline development by providing essential features preconfigured and integrated.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["templates", "enhanced"]
  },
  {
    id: "saasy-land",
    title: "SaaSy Land",
    description:
      "A SaaS landing page template tailored to validate ideas and market offerings quickly with a consistent design language.",
    link: "https://htmlrev.com/free-shadcn-templates.html",
    repository: "https://github.com/htmlrev/free-shadcn-templates",
    tags: ["templates", "saas"]
  },
  {
    id: "saas-stripe",
    title: "Saas Stripe",
    description:
      "Open-source SaaS starter with user roles and admin panel using Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, shadcn/ui, Stripe, and Server Actions.",
    link: "https://www.shadcntemplates.com/theme/mickasmt-next-saas-stripe-starter/",
    repository: "https://github.com/mickasmt/next-saas-stripe-starter",
    tags: ["templates", "enhanced", "saas"]
  },

  // Innovative Individual Components & Tools
  {
    id: "phone-input",
    title: "Phone Input",
    description:
      "Production-grade phone input built on top of shadcn/ui input. Includes country select, formatting, and comprehensive setup docs.",
    link: "https://shadcn-phone-input.vercel.app/",
    repository: "https://github.com/shadcn-phone-input/shadcn-phone-input",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "autocomplete",
    title: "Autocomplete",
    description:
      "Custom autocomplete built using Shadcn UI and Fancy Multi Select. Interactive demo and instructions for adapting to your use cases.",
    link: "https://armand-salle.fr/post/autocomplete-select-shadcn-ui/",
    repository: "https://github.com/armand-salle/autocomplete-select-shadcn-ui",
    tags: ["components", "specialized"]
  },
  {
    id: "sidebar",
    title: "Sidebar",
    description:
      "Composable, themeable, and customizable sidebar component documented in the official shadcn/ui site. Practical foundation for app shells.",
    link: "https://ui.shadcn.com/docs/components/sidebar",
    repository: "https://github.com/shadcn/ui/tree/main/components/ui/sidebar",
    tags: ["components", "enhanced"]
  },
  {
    id: "novel",
    title: "Novel",
    description:
      "Notion-style WYSIWYG editor with AI-powered autocompletion. Demonstrates advanced rich text editing capabilities with modern UX.",
    link: "https://github.com/steven-tey/novel",
    repository: "https://github.com/steven-tey/novel",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "charts",
    title: "Charts",
    description:
      "Official chart library built with Recharts following shadcn UI principles. Copy/paste components for fast, consistent data visualization.",
    link: "https://www.shadcntemplates.com/theme/shadcn-ui-charts/",
    repository: "https://github.com/shadcn-ui/charts",
    tags: ["components", "enhanced"]
  },
  {
    id: "plate",
    title: "Plate",
    description:
      "Rich-text editor ecosystem for React, commonly paired with shadcn/ui. Highly extensible plugins and features for complex editing flows.",
    link: "https://github.com/udecode/plate",
    repository: "https://github.com/udecode/plate",
    tags: ["components", "enhanced"]
  },
  {
    id: "vaul",
    title: "Vaul",
    description:
      "Accessible drawer component for React. Pairs naturally with shadcn/ui primitives for app navigation and modals.",
    link: "https://github.com/emilkowalski/vaul",
    repository: "https://github.com/emilkowalski/vaul",
    tags: ["components", "enhanced"]
  },
  {
    id: "number-flow",
    title: "Number Flow",
    description:
      "React component for transitioning, formatting, and localizing numbers. Ideal for counters, KPIs, and dashboards.",
    link: "https://github.com/barvian/number-flow",
    repository: "https://github.com/barvian/number-flow",
    tags: ["components", "enhanced"]
  },
  {
    id: "auto-form",
    title: "Auto Form",
    description:
      "Automatically render forms from your existing data schema. Reduces repetitive UI work while staying customizable.",
    link: "https://github.com/vantezzen/autoform",
    repository: "https://github.com/vantezzen/autoform",
    tags: ["components", "enhanced"]
  },
  {
    id: "next-stepper",
    title: "next-stepper",
    description:
      "Dynamic multi-step form built with Next.js, shadcn/ui, zustand, and framer-motion. A pattern for progressive data collection.",
    link: "https://github.com/ebulku/next-stepper",
    repository: "https://github.com/ebulku/next-stepper",
    tags: ["components", "enhanced"]
  },
  {
    id: "form-builder",
    title: "Form Builder",
    description:
      "Dynamic form-building tool enabling users to create, customize, and validate forms seamlessly within web applications.",
    link: "https://github.com/hasanharman/form-builder",
    repository: "https://github.com/hasanharman/form-builder",
    tags: ["components", "enhanced"]
  },

  // Real-world Apps & Demos
  {
    id: "giats-portfolio",
    title: "GiatsPortfolio",
    description:
      "Award-winning personal portfolio website by Evangelos Giatsidis built with Next.js, React Three Fiber, and GSAP animations. Multi-award-winning site with CSS Design Awards, Awwwards, and GSAP recognition.",
    link: "https://giats.me/",
    repository: "https://github.com/Giats2498/giats-portfolio",
    tags: ["templates", "portfolio", "award", "modern", "enhanced"]
  },
  {
    id: "hans-zimmer",
    title: "HansZimmer",
    description:
      "An Award-Winning German Composer & Music Producer tribute website. Built with Next.js, Framer Motion, and Chakra UI for an immersive musical experience.",
    link: "https://hans-zimmer-denosaurabh.vercel.app/",
    repository: "https://github.com/denosaurabh/hans-zimmer",
    tags: ["templates", "tribute", "award", "modern"]
  },
  {
    id: "award-winning-landing-page",
    title: "AwardWinningLandingPage",
    description:
      "Award_Wining_LandingPage using react and threejs and Gsap. Advanced animations and 3D effects for creating immersive user experiences.",
    link: "https://award-wining-landing-page.vercel.app/",
    repository: "https://github.com/HamzaAmir97/Award_Wining_LandingPage",
    tags: ["templates", "landing", "award", "modern"]
  },
  {
    id: "craftzdog-homepage",
    title: "CraftzdogHomepage",
    description:
      "My homepage built with modern web technologies and creative design patterns.",
    link: "https://www.craftz.dog/",
    repository: "https://github.com/craftzdog/craftzdog-homepage",
    tags: ["templates", "landing", "modern"]
  },
  {
    id: "space-particles",
    title: "SpaceParticles",
    description:
      "Landing page using particles from three.js in the background. Interactive particle system for engaging user experience.",
    link: "https://majestic-gumdrop-2aae1c.netlify.app/",
    repository: "https://github.com/1Ness1/space",
    tags: ["templates", "landing", "three", "modern"]
  },
  {
    id: "shivam-3d-portfolio",
    title: "Shivam3DPortfolio",
    description:
      "3D Portfolio is my personal portfolio website created using Next.js, Tailwind CSS, Three.js, React Three Fiber, and a collection of other technologies. This website showcases my skills, experiences, projects, and allows users to contact me. It also offers a dark and light theme to enhance the user experience.",
    link: "https://shivam-sharma-myportfolio.vercel.app/",
    repository: "https://github.com/Shivam-Sharma-1/3D-Portfolio",
    tags: ["templates", "portfolio", "three", "modern", "enhanced"]
  },
  {
    id: "iphone-15-pro-clone",
    title: "IPhone15ProClone",
    description:
      "Recreate the Apple iPhone 15 Pro website, combining GSAP animations and Three.js 3D effects. From custom animations to animated 3D models, this tutorial covers it all.",
    link: "https://iphone-doc.vercel.app/",
    repository: "https://github.com/starcluster18/iphone",
    tags: ["templates", "landing", "three", "modern", "enhanced"]
  },
  {
    id: "erik-johnson-portfolio",
    title: "ErikJohnsonPortfolio",
    description:
      "Very interactive sample portfolio with ThreeJS. Showcases advanced 3D interactions and immersive experiences.",
    link: "https://erik-johnson.netlify.app/",
    repository: "https://github.com/appledesire/3D-visual-portfolio",
    tags: ["templates", "portfolio", "three", "modern"]
  },
  {
    id: "threecise",
    title: "Threecise",
    description:
      "Threecise is an innovative web application powered by Nextjs and Threejs react three fiber, crafted to revolutionize the way developers engage with dance moves and workouts. Tackling common issues like deciphering complex movements from videos and refining precise body actions during exercises.",
    link: "https://threecise.vercel.app/",
    repository: "https://github.com/Sourabh-Bharale/Threecise",
    tags: ["templates", "specialized", "three", "modern", "enhanced"]
  },
  {
    id: "face-object-detection",
    title: "FaceObjectDetection",
    description:
      "Real-time Webcam Object / Face Detection with MediaPipe. Advanced computer vision implementation using Next.js and Three.js technologies.",
    link: "https://yiyd1004.github.io/nextjs_face_object_detection/",
    repository: "https://github.com/yiyd1004/nextjs_face_object_detection",
    tags: ["templates", "specialized", "three", "ai", "modern"]
  },
  {
    id: "phaminhieu-portfolio",
    title: "PhaminhieuPortfolio",
    description:
      "My portfolio build with Nextjs and Threejs. Modern 3D portfolio showcasing creative web development skills.",
    link: "https://phaminhieu.threes.dev/",
    repository: "https://github.com/phaminhieuu/pmh-portfolio",
    tags: ["templates", "portfolio", "three", "modern"]
  },
  {
    id: "r3f-spotify-game",
    title: "R3fSpotifyGame",
    description:
      "A music game built with react-three-fiber and the Spotify API. Interactive 3D gaming experience combining music and 3D graphics.",
    link: "https://streamable.com/",
    repository: "https://github.com/filahf/r3f-spotify-game",
    tags: ["templates", "gaming", "three", "modern"]
  },
  {
    id: "threejs-page-transition",
    title: "ThreejsPageTransition",
    description:
      "Web application that uses THREE.JS and NextJS for the transitions between pages. Created to test the possibility of merging SPA's and awwwards-like page transitions.",
    link: "https://next-training-six.vercel.app/",
    repository: "https://github.com/michalzalobny/threejs-page-transition",
    tags: ["templates", "specialized", "three", "modern", "enhanced"]
  },
  {
    id: "taxonomy",
    title: "Taxonomy",
    description:
      "Open-source example app using Next.js 13 server components. Demonstrates authentication, subscriptions, API routes, static pages, and more in a modern stack.",
    link: "https://tx.shadcn.com/",
    repository: "https://github.com/tx/tx",
    tags: ["templates", "modern", "enhanced"]
  },
  {
    id: "tablecn",
    title: "Tablecn",
    description:
      "Task and data management interface with server-driven filtering and sorting. Shows robust table UX patterns and state handling.",
    link: "https://tablecn.com/",
    repository: "https://github.com/tablecn/tablecn",
    tags: ["components", "specialized"]
  },
  {
    id: "shadcn-chatbot-kit",
    title: "shadcn Chatbot Kit",
    description:
      "Toolkit for building beautifully designed chatbot components based on shadcn/ui. Fully customizable components to ship AI apps in hours, not days.",
    link: "https://shadcn-chatbot-kit.vercel.app/",
    repository: "https://github.com/shadcn-chatbot-kit/shadcn-chatbot-kit",
    tags: ["components", "specialized", "enhanced"]
  },
  {
    id: "skateshop",
    title: "Skateshop",
    description:
      "Open-source e-commerce storefront built with modern Next.js features and shadcn/ui. A complete example of product, cart, and checkout flows.",
    link: "https://www.shadcntemplates.com/theme/sadmann7-skateshop/",
    repository: "https://github.com/sadmann7/skateshop",
    tags: ["templates", "enhanced"]
  },
  {
    id: "invoify",
    title: "Invoify",
    description:
      "Invoice generator app built with Next.js and TypeScript using shadcn. Demonstrates CRUD flows and document-style UI interactions.",
    link: "https://www.shadcntemplates.com/theme/al1abb-invoify/",
    repository: "https://github.com/al1abb/invoify",
    tags: ["templates"]
  },
  {
    id: "inbox-zero",
    title: "Inbox Zero",
    description:
      "Open-source AI personal assistant for email designed to help reach inbox zero quickly. Real-world AI UI patterns with shadcn/ui.",
    link: "https://www.shadcntemplates.com/theme/elie222-inbox-zero/",
    repository: "https://github.com/elie222/inbox-zero",
    tags: ["templates", "specialized"]
  },
  {
    id: "onur-dev",
    title: "Onur.dev",
    description:
      "Personal website using Next.js, Tailwind CSS, shadcn/ui, Contentful, Raindrop, and Supabase; deployed on Vercel. Production example of the stack in action.",
    link: "https://www.shadcntemplates.com/theme/suyalcinkaya-onur/",
    repository: "https://github.com/suyalcinkaya/onur.dev",
    tags: ["templates", "modern"]
  },
  {
    id: "hamish-williams-portfolio",
    title: "Hamish Williams Portfolio",
    description:
      "My personal portfolio website built using React and three js. Features modern design with Three.js animations and interactive 3D elements.",
    link: "https://hamishw.com/",
    repository: "https://github.com/HamishMW/portfolio",
    tags: ["templates", "portfolio", "three", "modern"]
  },
  {
    id: "henry-heffernan-portfolio",
    title: "Henry Heffernan Portfolio",
    description:
      "Personal portfolio website showcasing modern web development skills with clean design and professional presentation.",
    link: "https://henryheffernan.com/",
    repository: "https://github.com/henryjeff/portfolio-website",
    tags: ["templates", "portfolio", "modern"]
  },
  {
    id: "magic-portfolio",
    title: "Magic Portfolio",
    description:
      "Build your timeless portfolio with Once UI's Magic Portfolio. Modern portfolio template with elegant design and smooth interactions.",
    link: "https://magic-portfolio.com/",
    repository: "https://github.com/once-ui-system/magic-portfolio",
    tags: ["templates", "portfolio", "modern"]
  },
  {
    id: "21st",
    title: "21st",
    description:
      "Marketplace for shadcn/ui-based React Tailwind components, blocks, and hooks (an \"npm for design engineers\"). Highlights the ecosystem's commercial maturity.",
    link: "https://21st.dev/",
    repository: "https://github.com/21st/21st",
    tags: ["templates", "enhanced"]
  },
  {
    id: "stack-auth",
    title: "Stack",
    description:
      "Open-source Auth0/Clerk alternative. Demonstrates authentication flows and admin features built with modern Next.js + shadcn/ui.",
    link: "https://www.shadcntemplates.com/theme/stack-auth-stack/",
    repository: "https://github.com/stack-auth/stack-auth",
    tags: ["templates", "specialized"]
  },
  {
    id: "next-wp",
    title: "Next Wp",
    description:
      "Headless WordPress built with the Next.js App Router and React Server Components. Shows how shadcn/ui fits into content-heavy sites.",
    link: "https://www.shadcntemplates.com/theme/9d8dev-next-wp/",
    repository: "https://github.com/9d8dev/next-wp",
    tags: ["templates", "enhanced"]
  },
  {
    id: "file-drive",
    title: "FileDrive",
    description:
      "File storage application with organizations, file upload, management, and role-based authorization. Complete file management solution built with modern web technologies.",
    link: "https://github.com/webdevcody/file-drive",
    repository: "https://github.com/webdevcody/file-drive",
    tags: ["templates", "specialized", "enhanced", "modern"]
  },
]


