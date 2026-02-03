import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/atom/modal"
import { siteConfig } from "@/components/saas-marketing/pricing/config/site"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"

function SignInModal({
  showSignInModal,
  setShowSignInModal,
}: {
  showSignInModal: boolean
  setShowSignInModal: Dispatch<SetStateAction<boolean>>
}) {
  const [signInClicked, setSignInClicked] = useState(false)

  return (
    <Modal showModal={showSignInModal} setShowModal={setShowSignInModal}>
      <div className="w-full">
        <div className="bg-background flex flex-col items-center justify-center space-y-3 border-b px-4 py-6 pt-8 text-center md:px-16">
          <a href={siteConfig.url}>
            <Icons.logo className="size-10" />
          </a>
          <h3>Login</h3>
          <p className="muted text-gray-500">
            This is strictly for demo purposes - only your email and profile
            picture will be stored.
          </p>
        </div>

        <div className="bg-secondary/50 flex flex-col space-y-4 px-4 py-8 md:px-16">
          <Button
            variant="default"
            disabled={signInClicked}
            onClick={() => {
              setSignInClicked(true)
              signIn("google", { redirect: false }).then(() =>
                setTimeout(() => {
                  setShowSignInModal(false)
                }, 400)
              )
            }}
          >
            {signInClicked ? (
              <Icons.spinner className="me-2 size-4 animate-spin" />
            ) : (
              <Icons.google className="me-2 size-4" />
            )}{" "}
            Sign In with Google
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function useSignInModal() {
  const [showSignInModal, setShowSignInModal] = useState(false)

  const SignInModalCallback = useCallback(() => {
    return (
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    )
  }, [showSignInModal, setShowSignInModal])

  return useMemo(
    () => ({
      setShowSignInModal,
      SignInModal: SignInModalCallback,
    }),
    [setShowSignInModal, SignInModalCallback]
  )
}
