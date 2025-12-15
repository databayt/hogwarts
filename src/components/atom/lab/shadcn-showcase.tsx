"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Field Components

// Input Groups

// Button Groups

// Display Components

// Feedback Components

// Settings Components

// Forms
import {
  ShadcnAppearanceSettings,
  ShadcnButtonGroupDemo,
  ShadcnButtonGroupInputGroup,
  ShadcnButtonGroupNested,
  ShadcnButtonGroupPopover,
  ShadcnEmptyAvatarGroup,
  ShadcnEmptyInputGroup,
  ShadcnFieldCheckbox,
  ShadcnFieldChoiceCard,
  ShadcnFieldDemo,
  ShadcnFieldHear,
  ShadcnFieldSlider,
  ShadcnInputGroupButton,
  ShadcnInputGroupDemo,
  ShadcnInputGroupTextarea,
  ShadcnItemAvatar,
  ShadcnItemDemo,
  ShadcnNotionPromptForm,
  ShadcnSpinnerBadge,
  ShadcnSpinnerEmpty,
} from "./index"

/**
 * ShadcnShowcase - Comprehensive shadcn/ui v4 component showcase
 *
 * Displays all 21 components from shadcn/ui v4 repository organized by category.
 *
 * Categories:
 * - Field Components (5): Form field wrappers and input patterns
 * - Input Groups (4): Input grouping and decoration patterns
 * - Button Groups (4): Button grouping and action patterns
 * - Display (3): List and item display patterns
 * - Feedback (2): Loading states and indicators
 * - Settings (1): Configuration interfaces
 * - Forms (1): Advanced form patterns
 *
 * @example
 * ```tsx
 * <ShadcnShowcase />
 * ```
 */
export function ShadcnShowcase() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">shadcn/ui v4 Component Showcase</h1>
        <p className="text-muted-foreground">
          21 components from the official shadcn/ui v4 repository, adapted to
          project standards with semantic tokens, TypeScript strict mode, and
          full accessibility.
        </p>
      </div>

      <Tabs defaultValue="field" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="field">Fields</TabsTrigger>
          <TabsTrigger value="input">Inputs</TabsTrigger>
          <TabsTrigger value="button">Buttons</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>

        {/* Field Components Tab */}
        <TabsContent value="field" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Components</CardTitle>
              <CardDescription>
                Form field wrappers demonstrating various input patterns and
                field layouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Payment Form Demo</h3>
                <ShadcnFieldDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Checkbox Field</h3>
                <ShadcnFieldCheckbox />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Choice Card (Radio Group)
                </h3>
                <ShadcnFieldChoiceCard />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Range Slider</h3>
                <ShadcnFieldSlider />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Multi-Select Pills</h3>
                <ShadcnFieldHear />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Input Groups Tab */}
        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Groups</CardTitle>
              <CardDescription>
                Input grouping patterns with addons, buttons, and decorations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Input Group Patterns
                </h3>
                <ShadcnInputGroupDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Input with Action Buttons
                </h3>
                <ShadcnInputGroupButton />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Code Editor Interface
                </h3>
                <ShadcnInputGroupTextarea />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">404 Empty State</h3>
                <ShadcnEmptyInputGroup />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Button Groups Tab */}
        <TabsContent value="button" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Groups</CardTitle>
              <CardDescription>
                Button grouping patterns for actions, navigation, and controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Email Actions Demo</h3>
                <ShadcnButtonGroupDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Messaging Interface
                </h3>
                <ShadcnButtonGroupInputGroup />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Nested Button Groups
                </h3>
                <ShadcnButtonGroupNested />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  AI Assistant Interface
                </h3>
                <ShadcnButtonGroupPopover />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Components Tab */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Components</CardTitle>
              <CardDescription>
                List items, avatars, and display patterns for content
                presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">List Item Patterns</h3>
                <ShadcnItemDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">
                  User List with Avatars
                </h3>
                <ShadcnItemAvatar />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Empty Team State</h3>
                <ShadcnEmptyAvatarGroup />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Components Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Components</CardTitle>
              <CardDescription>
                Loading states, spinners, and user feedback indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Loading Badges</h3>
                <ShadcnSpinnerBadge />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Processing State</h3>
                <ShadcnSpinnerEmpty />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Components Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings Components</CardTitle>
              <CardDescription>
                Configuration interfaces and settings panels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Compute Environment Settings
                </h3>
                <ShadcnAppearanceSettings />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Forms</CardTitle>
              <CardDescription>
                Complex form patterns with advanced interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">
                  Notion-Style AI Prompt
                </h3>
                <ShadcnNotionPromptForm />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
