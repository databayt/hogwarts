"use client"

import React, { useEffect, useState, useTransition } from "react"
import {
  CircleCheck,
  Eye,
  Key,
  Pencil,
  Shield,
  Trash2,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  createUser,
  deleteUser,
  getSchoolUsers,
  updateUserRole,
} from "@/components/platform/settings/actions"

// All available roles in the system
export const getUserRoles = (dictionary?: Dictionary["school"]) =>
  [
    {
      value: "DEVELOPER",
      label: dictionary?.settings?.rolesList?.developer || "Developer",
      description:
        dictionary?.settings?.rolesList?.developerDesc ||
        "Platform admin with full access",
      color: "destructive",
    },
    {
      value: "ADMIN",
      label: dictionary?.settings?.rolesList?.admin || "Admin",
      description:
        dictionary?.settings?.rolesList?.adminDesc || "School administrator",
      color: "default",
    },
    {
      value: "TEACHER",
      label: dictionary?.settings?.rolesList?.teacher || "Teacher",
      description:
        dictionary?.settings?.rolesList?.teacherDesc || "Teaching staff",
      color: "secondary",
    },
    {
      value: "STUDENT",
      label: dictionary?.settings?.rolesList?.student || "Student",
      description:
        dictionary?.settings?.rolesList?.studentDesc || "Enrolled student",
      color: "outline",
    },
    {
      value: "GUARDIAN",
      label: dictionary?.settings?.rolesList?.guardian || "Guardian",
      description:
        dictionary?.settings?.rolesList?.guardianDesc || "Parent/Guardian",
      color: "outline",
    },
    {
      value: "ACCOUNTANT",
      label: dictionary?.settings?.rolesList?.accountant || "Accountant",
      description:
        dictionary?.settings?.rolesList?.accountantDesc || "Finance staff",
      color: "secondary",
    },
    {
      value: "STAFF",
      label: dictionary?.settings?.rolesList?.staff || "Staff",
      description:
        dictionary?.settings?.rolesList?.staffDesc || "General school staff",
      color: "outline",
    },
    {
      value: "USER",
      label: dictionary?.settings?.rolesList?.user || "User",
      description: dictionary?.settings?.rolesList?.userDesc || "Basic user",
      color: "outline",
    },
  ] as const

export const USER_ROLES = getUserRoles() // Default without dictionary

export type UserRole = (typeof USER_ROLES)[number]["value"]

// Permissions for each role
const ROLE_PERMISSIONS = {
  DEVELOPER: ["*"], // All permissions
  ADMIN: [
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "students.view",
    "students.create",
    "students.edit",
    "students.delete",
    "teachers.view",
    "teachers.create",
    "teachers.edit",
    "teachers.delete",
    "classes.view",
    "classes.create",
    "classes.edit",
    "classes.delete",
    "finances.view",
    "finances.edit",
    "reports.view",
    "reports.create",
    "settings.view",
    "settings.edit",
  ],
  TEACHER: [
    "students.view",
    "classes.view",
    "classes.edit",
    "assignments.create",
    "assignments.edit",
    "assignments.delete",
    "grades.create",
    "grades.edit",
    "attendance.create",
    "attendance.edit",
    "reports.view",
  ],
  STUDENT: [
    "assignments.view",
    "grades.view",
    "attendance.view",
    "timetable.view",
    "announcements.view",
  ],
  GUARDIAN: [
    "students.view", // Only their children
    "grades.view",
    "attendance.view",
    "fees.view",
    "announcements.view",
  ],
  ACCOUNTANT: [
    "finances.view",
    "finances.edit",
    "finances.create",
    "fees.view",
    "fees.edit",
    "fees.create",
    "reports.view",
    "reports.create",
  ],
  STAFF: ["announcements.view", "timetable.view", "reports.view"],
  USER: ["announcements.view"],
}

interface User {
  id: string
  username: string | null
  email: string
  role: UserRole
  image?: string | null
  createdAt: Date
  emailVerified: Date | null
  isTwoFactorEnabled: boolean
}

interface RoleManagementProps {
  dictionary?: Dictionary["school"]
  currentUserId?: string
  isDeveloperMode?: boolean
}

export function RoleManagement({
  dictionary,
  currentUserId,
  isDeveloperMode = false,
}: RoleManagementProps) {
  const [isPending, startTransition] = useTransition()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get localized role labels
  const USER_ROLES_LOCALIZED = React.useMemo(
    () => getUserRoles(dictionary),
    [dictionary]
  )

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "USER" as UserRole,
  })

  // Fetch users on component mount
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      try {
        const result = await getSchoolUsers()
        if (result.success && result.users) {
          setUsers(result.users as User[])
        } else {
          ErrorToast(result.message || "Failed to fetch users")
        }
      } catch (error) {
        ErrorToast("Failed to fetch users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("userId", userId)
        formData.append("role", newRole)

        const result = await updateUserRole(formData)

        if (result.success) {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, role: newRole } : user
            )
          )
          SuccessToast(result.message || "Role updated successfully")
        } else {
          ErrorToast(result.message || "Failed to update role")
        }
      } catch (error) {
        ErrorToast("Failed to update role")
      }
    })
  }

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email) {
      ErrorToast("Please fill in all fields")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("username", newUser.username)
        formData.append("email", newUser.email)
        formData.append("role", newUser.role)

        const result = await createUser(formData)

        if (result.success) {
          // Refresh the user list
          const usersResult = await getSchoolUsers()
          if (usersResult.success && usersResult.users) {
            setUsers(usersResult.users as User[])
          }
          setNewUser({ username: "", email: "", role: "USER" })
          setIsAddUserOpen(false)
          SuccessToast(result.message || "User added successfully")
        } else {
          ErrorToast(result.message || "Failed to add user")
        }
      } catch (error) {
        ErrorToast("Failed to add user")
      }
    })
  }

  // Delete user (with confirmation)
  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    if (userToDelete === currentUserId) {
      ErrorToast("You cannot delete your own account")
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteUser(userToDelete)

        if (result.success) {
          setUsers((prev) => prev.filter((user) => user.id !== userToDelete))
          SuccessToast(result.message || "User deleted successfully")
        } else {
          ErrorToast(result.message || "Failed to delete user")
        }
      } catch (error) {
        ErrorToast("Failed to delete user")
      } finally {
        setIsDeleteDialogOpen(false)
        setUserToDelete(null)
      }
    })
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    const roleConfig = USER_ROLES_LOCALIZED.find((r) => r.value === role)
    return (roleConfig?.color || "outline") as
      | "destructive"
      | "default"
      | "secondary"
      | "outline"
  }

  const getUserInitials = (name: string | null) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-96 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-16 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Developer Mode Alert */}
      {isDeveloperMode && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <TriangleAlert className="h-5 w-5" />
              {dictionary?.settings?.userManagementLabels
                ?.developerModeActive || "Developer Mode Active"}
            </CardTitle>
            <CardDescription>
              {dictionary?.settings?.userManagementLabels?.developerModeDesc ||
                "You have full access to all features and can manage all user roles. This mode is for testing and development only."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* User Management Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {dictionary?.settings?.userManagementLabels
                  ?.userRoleManagement || "User & Role Management"}
              </CardTitle>
              <CardDescription className="mt-2">
                {dictionary?.settings?.userManagementLabels?.manageUsersDesc ||
                  "Manage user accounts, assign roles, and control permissions"}
              </CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {dictionary?.settings?.userManagementLabels?.addUser ||
                    "Add User"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {dictionary?.settings?.userManagementLabels
                      ?.createNewUser || "Add New User"}
                  </DialogTitle>
                  <DialogDescription>
                    {dictionary?.settings?.userManagementLabels
                      ?.createUserDesc ||
                      "Create a new user account and assign a role"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      {dictionary?.settings?.userManagementLabels?.username ||
                        "Username"}
                    </Label>
                    <Input
                      id="username"
                      placeholder={
                        dictionary?.settings?.userManagementLabels
                          ?.enterUsername || "Enter username"
                      }
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {dictionary?.settings?.userManagementLabels?.email ||
                        "Email"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={
                        dictionary?.settings?.userManagementLabels
                          ?.enterEmail || "user@school.edu"
                      }
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      {dictionary?.settings?.userManagementLabels?.role ||
                        "Role"}
                    </Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value as UserRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES_LOCALIZED.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span>{role.label}</span>
                              <span className="text-muted-foreground text-xs">
                                {role.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                  >
                    {dictionary?.settings?.userManagementLabels?.cancel ||
                      "Cancel"}
                  </Button>
                  <Button onClick={handleAddUser} disabled={isPending}>
                    {dictionary?.settings?.userManagementLabels?.addUser ||
                      "Add User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* User Statistics */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="bg-background rounded-xl p-3">
              <p className="text-muted-foreground text-sm">
                {dictionary?.settings?.userManagementLabels?.totalUsers ||
                  "Total Users"}
              </p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-muted-foreground text-sm">
                {dictionary?.settings?.userManagementLabels?.verified ||
                  "Verified"}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.emailVerified).length}
              </p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-muted-foreground text-sm">
                {dictionary?.settings?.userManagementLabels?.admins || "Admins"}
              </p>
              <p className="text-2xl font-bold">
                {
                  users.filter(
                    (u) => u.role === "ADMIN" || u.role === "DEVELOPER"
                  ).length
                }
              </p>
            </div>
            <div className="bg-background rounded-xl p-3">
              <p className="text-muted-foreground text-sm">
                {dictionary?.settings?.userManagementLabels?.teachers ||
                  "Teachers"}
              </p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === "TEACHER").length}
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-background overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {dictionary?.settings?.userManagementLabels?.user || "User"}
                  </TableHead>
                  <TableHead>
                    {dictionary?.settings?.userManagementLabels?.email ||
                      "Email"}
                  </TableHead>
                  <TableHead>
                    {dictionary?.settings?.userManagementLabels?.role || "Role"}
                  </TableHead>
                  <TableHead>
                    {dictionary?.settings?.userManagementLabels
                      ?.emailVerified || "Verified"}
                  </TableHead>
                  <TableHead>
                    {dictionary?.settings?.userManagementLabels?.twoFactor ||
                      "2FA"}
                  </TableHead>
                  <TableHead className="text-right">
                    {dictionary?.settings?.userManagementLabels?.actions ||
                      "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {getUserInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.username || user.email}
                          </p>
                          {user.id === currentUserId && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {dictionary?.settings?.userManagementLabels
                                ?.you || "You"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as UserRole)
                        }
                        disabled={user.id === currentUserId && !isDeveloperMode}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {
                                USER_ROLES_LOCALIZED.find(
                                  (r) => r.value === user.role
                                )?.label
                              }
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES_LOCALIZED.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    role.color as
                                      | "destructive"
                                      | "default"
                                      | "secondary"
                                      | "outline"
                                  }
                                >
                                  {role.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.emailVerified ? "default" : "secondary"}
                      >
                        {user.emailVerified
                          ? dictionary?.settings?.userManagementLabels?.yes ||
                            "Yes"
                          : dictionary?.settings?.userManagementLabels?.no ||
                            "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.isTwoFactorEnabled ? "default" : "outline"
                        }
                      >
                        {user.isTwoFactorEnabled
                          ? dictionary?.settings?.userManagementLabels
                              ?.enabled || "Enabled"
                          : dictionary?.settings?.userManagementLabels
                              ?.disabled || "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUserToDelete(user.id)
                            setIsDeleteDialogOpen(true)
                          }}
                          disabled={user.id === currentUserId || isPending}
                          title={
                            dictionary?.settings?.userManagementLabels
                              ?.deleteUser || "Delete user"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {dictionary?.settings?.userManagementLabels?.rolePermissions ||
              "Role Permissions"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.userManagementLabels
              ?.viewManagePermissions ||
              "View and manage permissions for each role"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {USER_ROLES_LOCALIZED.map((role) => (
              <div key={role.value} className="bg-background rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          role.color as
                            | "destructive"
                            | "default"
                            | "secondary"
                            | "outline"
                        }
                      >
                        {role.label}
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {role.description}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-muted-foreground text-xs">
                        Permissions:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ROLE_PERMISSIONS[role.value]
                          ?.slice(0, 5)
                          .map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-xs"
                            >
                              {perm}
                            </Badge>
                          ))}
                        {ROLE_PERMISSIONS[role.value]?.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{ROLE_PERMISSIONS[role.value].length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    {dictionary?.settings?.userManagementLabels?.viewAll ||
                      "View All"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dictionary?.settings?.userManagementLabels?.deleteConfirmTitle ||
                "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dictionary?.settings?.userManagementLabels?.deleteConfirmDesc ||
                "This action cannot be undone. This will permanently delete the user account and remove all associated data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              {dictionary?.settings?.userManagementLabels?.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {dictionary?.settings?.userManagementLabels?.deleteUserButton ||
                "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
