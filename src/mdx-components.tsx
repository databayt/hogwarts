// @ts-nocheck
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardsActivityGoal } from "@/components/atom/activity-goal"
import AgentHeading from "@/components/atom/agent-heading"
// AI components
import {
  AiPromptInputPreview,
  AiStatusIndicatorPreview,
  AiStreamingTextPreview,
} from "@/components/atom/ai-previews"
import { AIResponseDisplay } from "@/components/atom/ai-response-display"
import { Announcement } from "@/components/atom/announcement"
import { ButtonGroup } from "@/components/atom/button-group"
import { CardsCalendar } from "@/components/atom/calendar"
import { CardForm } from "@/components/atom/card-form"
import { CardHoverEffect } from "@/components/atom/card-hover-effect"
import { CardPreview } from "@/components/atom/card-preview"
import { CardsMetric } from "@/components/atom/cards-metric"
import { DividerWithText } from "@/components/atom/divider-with-text"
import ExpandButton from "@/components/atom/expand-button"
import { Faceted } from "@/components/atom/faceted"
import { FontsPreview } from "@/components/atom/fonts-preview"
import { FormField, FormFieldText } from "@/components/atom/form-field"
import { GradientAnimation } from "@/components/atom/gradient-animation"
import { HeaderSection } from "@/components/atom/header-section"
import { IconsPreview } from "@/components/atom/icons-preview"
import { InfiniteMovingCards as InfiniteCards } from "@/components/atom/infinite-cards"
import { InfiniteSlider } from "@/components/atom/infinite-slider"
import { LabeledInput } from "@/components/atom/labeled-input"
// Form atoms
import { LabeledSelect } from "@/components/atom/labeled-select"
import { LabeledTextarea } from "@/components/atom/labeled-textarea"
import Loading from "@/components/atom/loading"
import { CardsMetric as CardsMetricSingle } from "@/components/atom/metric"
import { ModalSystem } from "@/components/atom/modal-system"
// New small atoms
import { OAuthButton } from "@/components/atom/oauth-button"
import { OAuthButtonGroup } from "@/components/atom/oauth-button-group"
import { PageActionsPreview } from "@/components/atom/page-actions-preview"
import { PageHeader } from "@/components/atom/page-header"
import { PaymentMethodSelector } from "@/components/atom/payment-method-selector"
import { ProgressiveBlur } from "@/components/atom/progressive-blur"
import { PromptInput } from "@/components/atom/prompt-input"
import { Reasoning } from "@/components/atom/reasoning"
import { CardsReportIssue } from "@/components/atom/report-issue"
import { Response } from "@/components/atom/response"
import { SettingsToggleRow } from "@/components/atom/settings-toggle-row"
import { CardsShare } from "@/components/atom/share"
// Atom components
import { InfiniteMovingCards } from "@/components/atom/simple-marquee"
import { SortablePreview } from "@/components/atom/sortable-preview"
import { CardsStats } from "@/components/atom/stats"
import { StickyScroll } from "@/components/atom/sticky-scroll"
import { TabsNav } from "@/components/atom/tabs"
import { ThemeProvider } from "@/components/atom/theme-provider"
import { TwoButtonsPreview } from "@/components/atom/two-buttons-preview"
import { UserInfoCard } from "@/components/atom/user-info-card"
// Flow diagram components
import {
  AuthFlowDiagram,
  GetStartedFlow,
  LiveDemoFlow,
  LoginFlow,
  LogoutFlow,
  PlatformLinkFlow,
  TestCredentialsReference,
  UrlsReference,
} from "@/components/docs/auth-flow"
import { CodeBlockCommand } from "@/components/docs/code-block-command"
import { CodeTabs } from "@/components/docs/code-tabs"
import { ComponentPreview } from "@/components/docs/component-preview"
import { ComponentSource } from "@/components/docs/component-source"
import { CopyButton } from "@/components/docs/copy-button"
import { DirectoryStructure } from "@/components/docs/directory-structure"
import { ListingStructure } from "@/components/docs/listing-structure"
import { PrismaStructure } from "@/components/docs/prisma-structure"
import { StoryVideo } from "@/components/docs/story-video"
import { Structure } from "@/components/docs/structure"

// This file is required to use MDX in `app` directory.

// Create a default dictionary for MDX components that require it
const defaultDictionary = {
  locale: "en",
  cards: {},
} as any
const mdxComponents = {
  // Allows customizing built-in components, e.g. to add styling.
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "font-heading mt-2 scroll-m-28 text-3xl font-bold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => {
    return (
      <h2
        id={props.children
          ?.toString()
          .replace(/ /g, "-")
          .replace(/'/g, "")
          .replace(/\?/g, "")
          .toLowerCase()}
        className={cn(
          "font-heading [&+]*:[code]:text-xl mt-10 scroll-m-28 text-xl font-medium tracking-tight first:mt-0 lg:mt-16 [&+.steps]:!mt-0 [&+.steps>h3]:!mt-4 [&+h3]:!mt-6 [&+p]:!mt-4",
          className
        )}
        {...props}
      />
    )
  },
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "font-heading mt-12 scroll-m-28 text-lg font-medium tracking-tight [&+p]:!mt-4 *:[code]:text-xl",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "font-heading mt-8 scroll-m-28 text-base font-medium tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "mt-8 scroll-m-28 text-base font-medium tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "mt-8 scroll-m-28 text-base font-medium tracking-tight",
        className
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("font-medium underline underline-offset-4", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("leading-relaxed [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  ),
  strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className={cn("font-medium", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-6 ms-6 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-6 ms-6 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("mt-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mt-6 border-s-2 ps-6 italic", className)}
      {...props}
    />
  ),
  img: ({
    className,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn("rounded-md", className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="no-scrollbar my-6 w-full overflow-y-auto rounded-lg border">
      <table
        className={cn(
          "relative w-full overflow-hidden border-none text-sm [&_tbody_tr:last-child]:border-b-0",
          className
        )}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("m-0 border-b", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-2 text-start font-bold [&[align=center]]:text-center [&[align=right]]:text-right rtl:[&[align=right]]:text-left",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-4 py-2 text-start whitespace-nowrap [&[align=center]]:text-center [&[align=right]]:text-right rtl:[&[align=right]]:text-left",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, children, ...props }: React.ComponentProps<"pre">) => {
    return (
      <pre
        className={cn(
          "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none has-[[data-highlighted-line]]:px-0 has-[[data-line-numbers]]:px-0 has-[[data-slot=tabs]]:p-0",
          className
        )}
        {...props}
      >
        {children}
      </pre>
    )
  },
  figure: ({ className, ...props }: React.ComponentProps<"figure">) => {
    return <figure className={cn(className)} {...props} />
  },
  code: ({
    className,
    __raw__,
    __npm__,
    __yarn__,
    __pnpm__,
    __bun__,
    ...props
  }: React.ComponentProps<"code"> & {
    __raw__?: string
    __npm__?: string
    __yarn__?: string
    __pnpm__?: string
    __bun__?: string
  }) => {
    // Inline Code.
    if (typeof props.children === "string") {
      return (
        <code
          className={cn(
            "bg-muted relative rounded-md px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem] break-words outline-none",
            className
          )}
          {...props}
        />
      )
    }

    // npm command.
    const isNpmCommand = __npm__ && __yarn__ && __pnpm__ && __bun__
    if (isNpmCommand) {
      return (
        <CodeBlockCommand
          __npm__={__npm__}
          __yarn__={__yarn__}
          __pnpm__={__pnpm__}
          __bun__={__bun__}
        />
      )
    }

    // Default codeblock.
    return (
      <>
        {__raw__ && <CopyButton value={__raw__} />}
        <code {...props} />
      </>
    )
  },
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ComponentPreview,
  ComponentSource,
  CodeTabs,
  Tabs: ({ className, ...props }: ComponentProps<typeof Tabs>) => {
    return <Tabs className={cn("relative mt-6 w-full", className)} {...props} />
  },
  TabsList: ({ className, ...props }: ComponentProps<typeof TabsList>) => (
    <TabsList
      className={cn(
        "justify-start gap-4 rounded-none bg-transparent px-0",
        className
      )}
      {...props}
    />
  ),
  TabsTrigger: ({
    className,
    ...props
  }: ComponentProps<typeof TabsTrigger>) => (
    <TabsTrigger
      className={cn(
        "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary dark:data-[state=active]:border-primary hover:text-primary rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent",
        className
      )}
      {...props}
    />
  ),
  TabsContent: ({
    className,
    ...props
  }: ComponentProps<typeof TabsContent>) => (
    <TabsContent
      className={cn(
        "relative [&_h3.font-heading]:text-base [&_h3.font-heading]:font-medium *:[figure]:first:mt-0 [&>.steps]:mt-6",
        className
      )}
      {...props}
    />
  ),
  Step: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <h3
      className={cn(
        "font-heading mt-8 scroll-m-32 text-xl font-medium tracking-tight",
        className
      )}
      {...props}
    />
  ),
  Steps: ({ ...props }) => (
    <div
      className="[&>h3]:step steps mb-12 [counter-reset:step] *:[h3]:first:!mt-0"
      {...props}
    />
  ),
  // Atom components
  SimpleMarquee: InfiniteMovingCards,
  Response,
  Sortable: SortablePreview,
  StickyScroll,
  ThemeProvider,
  InfiniteSlider,
  InfiniteCards,
  ProgressiveBlur,
  Faceted,
  ExpandButton,
  HeaderSection,
  PageActions: PageActionsPreview,
  PageHeader,
  TabsNav,
  Announcement,
  Loading,
  TwoButtons: TwoButtonsPreview,
  AgentHeading,
  GradientAnimation,
  CardHoverEffect,
  Card: CardPreview,
  CardsMetric,
  PromptInput,
  Reasoning,
  Icons: IconsPreview,
  Fonts: FontsPreview,
  ActivityGoal: () => <CardsActivityGoal dictionary={defaultDictionary} />,
  ReportIssue: () => <CardsReportIssue dictionary={defaultDictionary} />,
  Share: () => <CardsShare dictionary={defaultDictionary} />,
  Calendar: () => <CardsCalendar dictionary={defaultDictionary} />,
  Metric: () => <CardsMetricSingle dictionary={defaultDictionary} />,
  Stats: () => <CardsStats dictionary={defaultDictionary} />,
  // New small atoms
  OAuthButton,
  OAuthButtonGroup,
  DividerWithText,
  UserInfoCard,
  SettingsToggleRow,
  FormField,
  FormFieldText,
  PaymentMethodSelector,
  DirectoryStructure,
  ListingStructure,
  Structure,
  PrismaStructure,
  // AI components
  AiPromptInput: AiPromptInputPreview,
  AiStatusIndicator: AiStatusIndicatorPreview,
  AiStreamingText: AiStreamingTextPreview,
  AiResponseDisplay: AIResponseDisplay,
  ModalSystem,
  // Form atoms
  LabeledSelect,
  LabeledInput,
  LabeledTextarea,
  CardForm,
  ButtonGroup,
  StoryVideo,
  // Flow diagram components
  AuthFlowDiagram,
  PlatformLinkFlow,
  GetStartedFlow,
  LiveDemoFlow,
  LoginFlow,
  LogoutFlow,
  TestCredentialsReference,
  UrlsReference,
}

export function useMDXComponents(
  components: Record<string, React.ComponentType<any>>
): Record<string, React.ComponentType<any>> {
  return {
    ...mdxComponents,
    ...components,
  }
}

export { mdxComponents }
