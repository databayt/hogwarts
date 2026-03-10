import { auth } from "@/auth"

import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { ChangePasswordForm } from "./form"

export default async function PasswordSettingsContent() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  const hasPassword = !!user?.password

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          {hasPassword
            ? "Update your password by entering your current password and a new one."
            : "Set a password for your account. You currently sign in via a social provider."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm hasPassword={hasPassword} />
      </CardContent>
    </Card>
  )
}
