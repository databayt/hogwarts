"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Field Components
import {
  FieldDemo,
  FieldCheckbox,
  FieldChoiceCard,
  FieldSlider,
  FieldHear,
} from "./field-components"

// Input Groups
import {
  InputGroupDemo,
  InputGroupButton,
  InputGroupTextarea,
  EmptyInputGroup,
} from "./input-groups"

// Button Groups
import {
  ButtonGroupDemo,
  ButtonGroupInputGroup,
  ButtonGroupNested,
  ButtonGroupPopover,
} from "./button-groups"

// Display Components
import { ItemDemo, ItemAvatar, EmptyAvatarGroup } from "./display"

// Feedback Components
import { SpinnerBadge, SpinnerEmpty } from "./feedback"

// Settings Components
import { AppearanceSettings } from "./settings"

// Forms
import { NotionPromptForm } from "./forms"

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
          21 components from the official shadcn/ui v4 repository, adapted to project
          standards with semantic tokens, TypeScript strict mode, and full accessibility.
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
                Form field wrappers demonstrating various input patterns and field layouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">Payment Form Demo</h3>
                <FieldDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Checkbox Field</h3>
                <FieldCheckbox />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Choice Card (Radio Group)</h3>
                <FieldChoiceCard />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Range Slider</h3>
                <FieldSlider />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Multi-Select Pills</h3>
                <FieldHear />
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
                <h3 className="mb-4 text-lg font-medium">Input Group Patterns</h3>
                <InputGroupDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Input with Action Buttons</h3>
                <InputGroupButton />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Code Editor Interface</h3>
                <InputGroupTextarea />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">404 Empty State</h3>
                <EmptyInputGroup />
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
                <ButtonGroupDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Messaging Interface</h3>
                <ButtonGroupInputGroup />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Nested Button Groups</h3>
                <ButtonGroupNested />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">AI Assistant Interface</h3>
                <ButtonGroupPopover />
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
                List items, avatars, and display patterns for content presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="mb-4 text-lg font-medium">List Item Patterns</h3>
                <ItemDemo />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">User List with Avatars</h3>
                <ItemAvatar />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Empty Team State</h3>
                <EmptyAvatarGroup />
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
                <SpinnerBadge />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Processing State</h3>
                <SpinnerEmpty />
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
                <h3 className="mb-4 text-lg font-medium">Compute Environment Settings</h3>
                <AppearanceSettings />
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
                <h3 className="mb-4 text-lg font-medium">Notion-Style AI Prompt</h3>
                <NotionPromptForm />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
