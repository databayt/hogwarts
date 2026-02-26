// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid"

const configuration = new Configuration({
  basePath:
    PlaidEnvironments[
      process.env.PLAID_ENV as keyof typeof PlaidEnvironments
    ] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
