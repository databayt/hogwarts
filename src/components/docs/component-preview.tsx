"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "center" | "start" | "end"
}

export function ComponentPreview({
  children,
  className,
  align = "center",
  ...props
}: ComponentPreviewProps) {
  const Preview = React.useMemo(() => {
    const Component = React.Children.only(children) as React.ReactElement & {
      type: { render?: (() => React.ReactElement) | undefined; __docgenInfo?: unknown }
    }

    if (!Component) {
      return (
        <p className="muted">
          No preview available.
        </p>
      )
    }

    return Component
  }, [children])

  const codeToString = React.useMemo(() => {
    if (React.isValidElement(children)) {
      const element = children as React.ReactElement<unknown>
      const props = element.props || {}
      const { children: childrenProp, ...restProps } = props as Record<string, unknown>

      // Remove unwanted props.
      const cleanedProps = Object.fromEntries(
        Object.entries(restProps).filter(([key]) =>
          !["__reactInternalInstance", "__reactInternalMemoizedUnmaskedChildContext", "__reactInternalMemoizedMaskedChildContext"].includes(key)
        )
      )

      const jsx = React.createElement(
        element.type as React.ComponentType<Record<string, unknown>> | string,
        cleanedProps,
        childrenProp as React.ReactNode
      )
      return jsx
    }

    return null
  }, [children])

  return (
    <div
      className={cn("relative my-4 flex flex-col space-y-2", className)}
      {...props}
    >
      <Tabs defaultValue="preview" className="relative me-auto w-full">
        <div className="flex items-center justify-between pb-3">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 muted shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 muted shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border">
          <div
            className={cn("flex min-h-[350px] w-full justify-center p-10", {
              "items-center": align === "center",
              "items-start": align === "start",
              "items-end": align === "end",
            })}
          >
            {Preview}
          </div>
        </TabsContent>
        <TabsContent value="code">
          <div className="flex flex-col space-y-4">
            <div className="w-full rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
              {codeToString ? (
                <pre className="language-tsx">
                  <code>{JSON.stringify(codeToString, null, 2)}</code>
                </pre>
              ) : (
                <p className="muted">
                  Code not available.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 