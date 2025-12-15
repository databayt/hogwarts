"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"

// Function to clean Facebook URL hash
const cleanUrlHash = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    // Check if URL has the Facebook hash fragment
    if (window.location.hash === "#_=_") {
      // Clean the hash
      const cleanUrl = window.location.href.replace(/#.*$/, "")
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }
}

export const Social = () => {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const tenant = searchParams.get("tenant")

  console.log("🚀 Social component loaded on:", {
    hostname:
      typeof window !== "undefined" ? window.location.hostname : "server",
    href: typeof window !== "undefined" ? window.location.href : "server",
  })

  // Clean URL hash on component mount - this will handle Facebook redirects
  useEffect(() => {
    cleanUrlHash()

    // Debug: Log component mount
    console.log("Social component mounted on:", {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href,
      callbackUrl,
    })

    // Additional debug info
    console.log("Window location details:", {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
    })

    // Test if we're in a subdomain context
    const isSubdomain =
      window.location.hostname.includes(".localhost") &&
      window.location.hostname !== "localhost"
    console.log("Subdomain detection:", {
      hostname: window.location.hostname,
      isSubdomain,
      includesLocalhost: window.location.hostname.includes(".localhost"),
      notLocalhost: window.location.hostname !== "localhost",
    })
  }, [])

  const onClick = async (provider: "google" | "facebook") => {
    console.log("=====================================")
    console.log(`🚀 OAuth ${provider.toUpperCase()} INITIATED`)
    console.log("=====================================")

    // Ensure we're on client side
    if (typeof window === "undefined") {
      console.log("❌ onClick called on server side, aborting")
      return
    }

    // Log current page state
    console.log("📍 Current Page State:", {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      searchParams: Object.fromEntries(
        new URLSearchParams(window.location.search).entries()
      ),
      callbackUrlFromParams: callbackUrl,
      tenantFromParams: tenant,
    })

    // Check if we're on a subdomain
    const currentHost = window.location.hostname
    const isProdSubdomain =
      currentHost.endsWith(".databayt.org") && currentHost !== "ed.databayt.org"
    const isDevSubdomain =
      currentHost.includes(".localhost") && currentHost !== "localhost"
    const isSubdomain = isProdSubdomain || isDevSubdomain

    console.log("🔍 Host detection debug:", {
      currentHost,
      isProdSubdomain,
      isDevSubdomain,
      isSubdomain,
      endsWithDatabayt: currentHost.endsWith(".databayt.org"),
      notEdDatabayt: currentHost !== "ed.databayt.org",
    })

    console.log("🚀 OAUTH FLOW INITIATED:", {
      provider,
      currentHost,
      isSubdomain,
      callbackUrl,
      tenant,
      currentUrl: window.location.href,
    })

    // Determine tenant - use subdomain detection or URL parameter
    let tenantSubdomain = null

    if (isSubdomain) {
      tenantSubdomain = currentHost.split(".")[0]
      console.log("🎯 Tenant from subdomain detection:", tenantSubdomain)
    } else if (tenant) {
      tenantSubdomain = tenant
      console.log("🎯 Tenant from URL parameter:", tenantSubdomain)
    }

    // If we have a tenant (either from subdomain or parameter), use custom OAuth flow
    if (tenantSubdomain) {
      // Use appropriate URL based on environment
      const dashboardUrl =
        process.env.NODE_ENV === "production"
          ? `https://${tenantSubdomain}.databayt.org/dashboard`
          : `http://${tenantSubdomain}.localhost:3000/dashboard`

      console.log("🔗 TENANT OAUTH INITIATED:", {
        tenantSubdomain,
        provider,
        dashboardUrl,
        currentHost,
        environment: process.env.NODE_ENV,
        source: isSubdomain ? "subdomain_detection" : "url_parameter",
        isProdSubdomain,
        isDevSubdomain,
      })

      // Store tenant info for fallback
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem("oauth_tenant", tenantSubdomain)
        sessionStorage.setItem("oauth_callback_url", dashboardUrl)
        console.log("💾 Stored OAuth context:", {
          tenant: tenantSubdomain,
          callbackUrl: dashboardUrl,
        })
      }

      signIn(provider, {
        callbackUrl: `${dashboardUrl}?tenant=${tenantSubdomain}`,
      })
      return
    }

    // Default OAuth flow for main domain
    // IMPORTANT: Preserve the original callbackUrl from the login page
    const finalCallbackUrl = callbackUrl || DEFAULT_LOGIN_REDIRECT

    console.log("\n🌐 MAIN DOMAIN OAUTH FLOW")
    console.log("📊 OAuth Configuration:", {
      provider,
      callbackUrl: finalCallbackUrl,
      originalCallbackUrl: callbackUrl,
      DEFAULT_LOGIN_REDIRECT,
      currentHost,
      searchParamsString: searchParams.toString(),
      allSearchParams: Object.fromEntries(searchParams.entries()),
    })

    // Store the callback URL server-side AND client-side
    if (callbackUrl) {
      console.log("\n💾 STORING CALLBACK URL...")

      // Store server-side via API (most reliable)
      try {
        console.log("📡 Calling store-callback API...")
        const response = await fetch("/api/auth/store-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callbackUrl }),
        })

        const responseData = await response.json()
        console.log("📡 Store-callback API response:", {
          status: response.status,
          ok: response.ok,
          data: responseData,
          headers: {
            "content-type": response.headers.get("content-type"),
            "set-cookie": response.headers.get("set-cookie"),
          },
        })

        if (response.ok) {
          console.log("✅ Callback URL stored server-side via API")
        } else {
          console.log(
            "⚠️ Failed to store callback URL server-side:",
            responseData
          )
        }
      } catch (error) {
        console.log("❌ Error calling store-callback API:", error)
        console.log("Stack:", error instanceof Error ? error.stack : "No stack")
      }

      // Also store client-side as backup
      if (typeof window !== "undefined") {
        // Store in session storage
        if (window.sessionStorage) {
          sessionStorage.setItem("oauth_callback_intended", callbackUrl)
          console.log("✅ Stored in session storage:", {
            key: "oauth_callback_intended",
            value: callbackUrl,
            verified:
              sessionStorage.getItem("oauth_callback_intended") === callbackUrl,
          })
        }

        // Store as a cookie with proper domain settings
        const cookieDomain =
          process.env.NODE_ENV === "production" ? ".databayt.org" : ""
        const cookieString = `oauth_callback_intended=${encodeURIComponent(callbackUrl)}; path=/; max-age=900; SameSite=Lax${cookieDomain ? `; Domain=${cookieDomain}` : ""}`
        document.cookie = cookieString
        console.log("🍪 Stored in client cookie:", {
          key: "oauth_callback_intended",
          value: callbackUrl,
          cookie: document.cookie.includes("oauth_callback_intended"),
        })
      }
    } else {
      console.log("⚠️ No callback URL to store")
    }

    console.log("\n🔐 CALLING NEXTAUTH SIGNIN...")
    console.log("📋 Final configuration:", {
      provider,
      callbackUrl: finalCallbackUrl,
      redirect: true,
      timestamp: new Date().toISOString(),
    })

    // Check all storage mechanisms right before redirect
    console.log("🔍 Pre-redirect storage check:")
    if (typeof window !== "undefined") {
      // Check sessionStorage
      console.log("  Session Storage:", {
        oauth_callback_intended: sessionStorage.getItem(
          "oauth_callback_intended"
        ),
        oauth_tenant: sessionStorage.getItem("oauth_tenant"),
        oauth_callback_url: sessionStorage.getItem("oauth_callback_url"),
      })

      // Check cookies
      console.log(
        "  Document cookies:",
        document.cookie
          .split(";")
          .filter((c) => c.includes("oauth") || c.includes("callback"))
      )
    }

    // Try to ensure the callback URL is preserved
    // NextAuth might not properly pass callbackUrl through OAuth providers
    // So we'll try multiple approaches

    console.log("🚀 INITIATING OAUTH REDIRECT NOW...")

    // Approach 1: Standard NextAuth way with explicit redirect parameter
    // Also try passing it as state for OAuth providers
    const signInOptions: any = {
      callbackUrl: finalCallbackUrl,
      redirect: true,
    }

    // For OAuth providers, also try to use the state parameter
    if (provider === "google" || provider === "facebook") {
      // Add state parameter to preserve callback through OAuth flow
      signInOptions.state = btoa(
        JSON.stringify({
          callbackUrl: finalCallbackUrl,
          timestamp: Date.now(),
        })
      )
      console.log("📦 Added state parameter for OAuth:", signInOptions.state)
    }

    console.log("🎯 Final signIn options:", signInOptions)

    signIn(provider, signInOptions)

    console.log("✅ SignIn called - redirect should happen now")

    // Note: If the above doesn't work, we're also storing in cookie and sessionStorage
    // The redirect callback will check those as fallback
  }

  return (
    <div className="space-y-4">
      {/* Debug test button */}
      {/* <Button
        size="sm"
        variant="outline"
        onClick={() => {
          console.log('Debug button clicked!');
          console.log('Current location:', window.location.href);
          console.log('Hostname:', window.location.hostname);
        }}
        className="w-full"
      >
        🐛 Debug Test Button
      </Button> */}

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={() => onClick("google")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Google
        </Button>
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={() => {
            console.log("Facebook button clicked!")
            onClick("facebook")
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              fill="currentColor"
            />
          </svg>
          Facebook
        </Button>
      </div>
    </div>
  )
}
