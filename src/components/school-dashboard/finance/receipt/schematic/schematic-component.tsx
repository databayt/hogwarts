// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"

import { getTemporaryAccessToken } from "./get-temporary-access-token"
import SchematicEmbed from "./schematic-embed"

async function SchematicComponent({ componentId }: { componentId?: string }) {
  if (!componentId) {
    return null
  }

  const accessToken = await getTemporaryAccessToken()

  if (!accessToken) {
    throw new Error("No access token found for user")
  }

  return <SchematicEmbed accessToken={accessToken} componentId={componentId} />
}

export default SchematicComponent
