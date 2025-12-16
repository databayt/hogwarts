/**
 * Mock for next/server module
 *
 * Provides mock implementations of NextRequest and NextResponse
 * for use in Vitest tests where the real next/server module
 * cannot be loaded (jsdom environment).
 *
 * @see vitest.config.mts - alias configuration
 */

/**
 * Mock NextRequest class
 *
 * Implements the essential NextRequest interface for testing.
 * Extends the native Request API with Next.js-specific properties.
 */
export class NextRequest extends Request {
  public nextUrl: URL
  public cookies: {
    get: (name: string) => { name: string; value: string } | undefined
    getAll: () => { name: string; value: string }[]
    set: (name: string, value: string) => void
    delete: (name: string) => void
    has: (name: string) => boolean
  }
  public geo?: {
    city?: string
    country?: string
    region?: string
    latitude?: string
    longitude?: string
  }
  public ip?: string

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)

    // Parse URL
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    this.nextUrl = new URL(url, "http://localhost:3000")

    // Cookie storage
    const cookieStore = new Map<string, string>()

    // Parse cookies from header
    const cookieHeader = this.headers.get("cookie") || ""
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=")
      if (name && value) {
        cookieStore.set(name, value)
      }
    })

    this.cookies = {
      get: (name: string) => {
        const value = cookieStore.get(name)
        return value ? { name, value } : undefined
      },
      getAll: () => {
        return Array.from(cookieStore.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      set: (name: string, value: string) => {
        cookieStore.set(name, value)
      },
      delete: (name: string) => {
        cookieStore.delete(name)
      },
      has: (name: string) => cookieStore.has(name),
    }

    // Default geo and IP
    this.geo = {
      city: "Test City",
      country: "US",
      region: "CA",
    }
    this.ip = "127.0.0.1"
  }
}

/**
 * Mock NextResponse class
 *
 * Implements the essential NextResponse interface for testing.
 * Provides static methods for common response patterns.
 */
export class NextResponse extends Response {
  public cookies: {
    get: (name: string) => { name: string; value: string } | undefined
    getAll: () => { name: string; value: string }[]
    set: (
      name: string,
      value: string,
      options?: {
        path?: string
        maxAge?: number
        httpOnly?: boolean
        secure?: boolean
        sameSite?: "strict" | "lax" | "none"
      }
    ) => void
    delete: (name: string) => void
  }

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init)

    const cookieStore = new Map<string, string>()

    this.cookies = {
      get: (name: string) => {
        const value = cookieStore.get(name)
        return value ? { name, value } : undefined
      },
      getAll: () => {
        return Array.from(cookieStore.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      set: (name: string, value: string) => {
        cookieStore.set(name, value)
      },
      delete: (name: string) => {
        cookieStore.delete(name)
      },
    }
  }

  /**
   * Create a JSON response
   */
  static json<T>(data: T, init?: ResponseInit): NextResponse {
    const body = JSON.stringify(data)
    const headers = new Headers(init?.headers)
    headers.set("content-type", "application/json")
    return new NextResponse(body, {
      ...init,
      headers,
    })
  }

  /**
   * Create a redirect response
   */
  static redirect(url: string | URL, status: number = 307): NextResponse {
    const urlString = typeof url === "string" ? url : url.href
    return new NextResponse(null, {
      status,
      headers: {
        Location: urlString,
      },
    })
  }

  /**
   * Create a rewrite response (internal redirect)
   */
  static rewrite(destination: string | URL): NextResponse {
    const urlString =
      typeof destination === "string" ? destination : destination.href
    const response = new NextResponse(null)
    // In real Next.js, this sets internal headers for rewriting
    response.headers.set("x-middleware-rewrite", urlString)
    return response
  }

  /**
   * Create a next() response (continue to next middleware/page)
   */
  static next(init?: { request?: { headers?: Headers } }): NextResponse {
    const response = new NextResponse(null)
    response.headers.set("x-middleware-next", "1")
    if (init?.request?.headers) {
      init.request.headers.forEach((value, key) => {
        response.headers.set(`x-middleware-request-${key}`, value)
      })
    }
    return response
  }
}

/**
 * URL pattern matcher (simplified mock)
 */
export class URLPattern {
  private pattern: string

  constructor(pattern: { pathname: string }) {
    this.pattern = pattern.pathname
  }

  test(url: string | URL): boolean {
    const urlString = typeof url === "string" ? url : url.pathname
    // Simple pattern matching (real implementation is more complex)
    const regexPattern = this.pattern
      .replace(/:\w+/g, "[^/]+")
      .replace(/\*/g, ".*")
    return new RegExp(`^${regexPattern}$`).test(urlString)
  }

  exec(
    url: string | URL
  ): { pathname: { groups: Record<string, string> } } | null {
    if (this.test(url)) {
      return {
        pathname: { groups: {} },
      }
    }
    return null
  }
}

// Re-export types that might be imported
export type { NextRequest as NextRequestType }
export type { NextResponse as NextResponseType }
