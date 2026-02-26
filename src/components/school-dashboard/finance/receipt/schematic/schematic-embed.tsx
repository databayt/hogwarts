"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
