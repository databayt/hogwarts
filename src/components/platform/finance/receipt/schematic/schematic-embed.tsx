"use client"

import React from "react"
import {
  EmbedProvider,
  SchematicEmbed as SchematicEmbedComponent,
} from "@schematichq/schematic-components"

function SchematicEmbed({
  accessToken,
  componentId,
}: {
  accessToken: string
  componentId: string
}) {
  return (
    <EmbedProvider>
      <SchematicEmbedComponent accessToken={accessToken} id={componentId} />
    </EmbedProvider>
  )
}

export default SchematicEmbed
