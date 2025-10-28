import { getTemporaryAccessToken } from './get-temporary-access-token'
import SchematicEmbed from './schematic-embed'
import React from 'react'

async function SchematicComponent({ componentId }: { componentId?: string }) {
  if (!componentId) {
    return null
  }

  const accessToken = await getTemporaryAccessToken()

  if (!accessToken) {
    throw new Error('No access token found for user')
  }

  return <SchematicEmbed accessToken={accessToken} componentId={componentId} />
}

export default SchematicComponent
