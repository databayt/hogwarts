"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Shield,
  UserPlus,
  UserMinus,
  Copy,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import {
  getAllUsersWithPermissions,
  getPermissionsByModule,
  grantPermission,
  revokePermission,
  bulkGrantPermissions,
  bulkRevokePermissions,
  copyPermissions,
  type UserPermissionSummary,
  type ModulePermissionSummary,
} from "./actions"
import type { FinanceAction, FinanceModule } from "@/components/platform/finance/lib/permissions"

const FINANCE_MODULES: FinanceModule[] = [
  "invoice",
  "receipt",
  "banking",
  "fees",
  "salary",
  "payroll",
  "timesheet",
  "wallet",
  "budget",
  "expenses",
  "accounts",
  "reports",
]

const FINANCE_ACTIONS: FinanceAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "process",
  "export",
]

const MODULE_LABELS: Record<FinanceModule, string> = {
  invoice: "Invoices",
  receipt: "Receipts",
  banking: "Banking",
  fees: "Fees",
  salary: "Salary",
  payroll: "Payroll",
  timesheet: "Timesheet",
  wallet: "Wallet",
  budget: "Budget",
  expenses: "Expenses",
  accounts: "Accounts",
  reports: "Reports",
}

const ACTION_COLORS: Record<FinanceAction, string> = {
  view: "bg-blue-100 text-blue-800",
  create: "bg-green-100 text-green-800",
  edit: "bg-yellow-100 text-yellow-800",
  delete: "bg-red-100 text-red-800",
  approve: "bg-purple-100 text-purple-800",
  process: "bg-indigo-100 text-indigo-800",
  export: "bg-gray-100 text-gray-800",
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  ACCOUNTANT: "bg-blue-100 text-blue-800",
  TEACHER: "bg-green-100 text-green-800",
  STUDENT: "bg-yellow-100 text-yellow-800",
  GUARDIAN: "bg-purple-100 text-purple-800",
  STAFF: "bg-gray-100 text-gray-800",
  DEVELOPER: "bg-pink-100 text-pink-800",
  USER: "bg-orange-100 text-orange-800",
}

export function PermissionManagementContent() {
  const [users, setUsers] = useState<UserPermissionSummary[]>([])
  const [modules, setModules] = useState<ModulePermissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<FinanceModule | "all">("all")

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersResult, modulesResult] = await Promise.all([
        getAllUsersWithPermissions(),
        getPermissionsByModule(),
      ])

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data)
      } else {
        toast.error(usersResult.error || "Failed to load users")
      }

      if (modulesResult.success && modulesResult.data) {
        setModules(modulesResult.data)
      } else {
        toast.error(modulesResult.error || "Failed to load modules")
      }
    } catch (error) {
      toast.error("Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.userRole === roleFilter

    const matchesModule =
      moduleFilter === "all" ||
      user.permissions.some((p) => p.module === moduleFilter)

    return matchesSearch && matchesRole && matchesModule
  })

  // Get unique roles from users
  const uniqueRoles = Array.from(new Set(users.map((u) => u.userRole)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Permission Management
          </h2>
          <p className="text-muted-foreground">
            Manage finance module permissions for users
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Module</Label>
              <Select
                value={moduleFilter}
                onValueChange={(value) =>
                  setModuleFilter(value as FinanceModule | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {FINANCE_MODULES.map((module) => (
                    <SelectItem key={module} value={module}>
                      {MODULE_LABELS[module]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">By User ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="modules">By Module ({modules.length})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading users...</p>
              </CardContent>
            </Card>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserPermissionCard
                  key={user.userId}
                  user={user}
                  onRefresh={loadData}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading modules...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {FINANCE_MODULES.map((module) => {
                const moduleData = modules.find((m) => m.module === module)
                return (
                  <ModulePermissionCard
                    key={module}
                    module={module}
                    data={moduleData}
                    onRefresh={loadData}
                  />
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// User Permission Card Component
function UserPermissionCard({
  user,
  onRefresh,
}: {
  user: UserPermissionSummary
  onRefresh: () => void
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{user.userName}</CardTitle>
            <CardDescription>{user.userEmail}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={ROLE_COLORS[user.userRole] || "bg-gray-100"}>
              {user.userRole}
            </Badge>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Edit Permissions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <EditPermissionsDialog
                  user={user}
                  onClose={() => setEditDialogOpen(false)}
                  onRefresh={onRefresh}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CopyPermissionsDialog
                  fromUser={user}
                  onClose={() => setCopyDialogOpen(false)}
                  onRefresh={onRefresh}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {user.permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom permissions. Using role-based defaults.
          </p>
        ) : (
          <div className="space-y-3">
            {user.permissions.map((perm) => (
              <div key={perm.module} className="flex items-start gap-2">
                <strong className="text-sm min-w-[100px]">
                  {MODULE_LABELS[perm.module]}:
                </strong>
                <div className="flex flex-wrap gap-1">
                  {perm.actions.map((action) => (
                    <Badge
                      key={action}
                      variant="secondary"
                      className={ACTION_COLORS[action]}
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Module Permission Card Component
function ModulePermissionCard({
  module,
  data,
  onRefresh,
}: {
  module: FinanceModule
  data?: ModulePermissionSummary
  onRefresh: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{MODULE_LABELS[module]}</CardTitle>
        <CardDescription>
          {data?.users.length || 0} users with custom permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data || data.users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom permissions for this module.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.userName}</div>
                      <small className="text-muted-foreground">{user.userEmail}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.userRole]}>
                      {user.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.actions.map((action) => (
                        <Badge
                          key={action}
                          variant="secondary"
                          className={ACTION_COLORS[action]}
                        >
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// Edit Permissions Dialog
function EditPermissionsDialog({
  user,
  onClose,
  onRefresh,
}: {
  user: UserPermissionSummary
  onClose: () => void
  onRefresh: () => void
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<
    Map<FinanceModule, Set<FinanceAction>>
  >(() => {
    const map = new Map<FinanceModule, Set<FinanceAction>>()
    for (const perm of user.permissions) {
      map.set(perm.module, new Set(perm.actions))
    }
    return map
  })
  const [saving, setSaving] = useState(false)

  const togglePermission = (module: FinanceModule, action: FinanceAction) => {
    setSelectedPermissions((prev) => {
      const newMap = new Map(prev)
      if (!newMap.has(module)) {
        newMap.set(module, new Set())
      }
      const actions = newMap.get(module)!
      if (actions.has(action)) {
        actions.delete(action)
      } else {
        actions.add(action)
      }
      return newMap
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Calculate permissions to grant and revoke
      const toGrant: Array<{ module: FinanceModule; action: FinanceAction }> = []
      const toRevoke: Array<{ module: FinanceModule; action: FinanceAction }> = []

      // Current permissions
      const currentPerms = new Set(
        user.permissions.flatMap((p) =>
          p.actions.map((a) => `${p.module}:${a}`)
        )
      )

      // New permissions
      const newPerms = new Set<string>()
      for (const [module, actions] of selectedPermissions.entries()) {
        for (const action of actions) {
          newPerms.add(`${module}:${action}`)
        }
      }

      // Find grants (in new but not in current)
      for (const perm of newPerms) {
        if (!currentPerms.has(perm)) {
          const [module, action] = perm.split(":")
          toGrant.push({ module: module as FinanceModule, action: action as FinanceAction })
        }
      }

      // Find revokes (in current but not in new)
      for (const perm of currentPerms) {
        if (!newPerms.has(perm)) {
          const [module, action] = perm.split(":")
          toRevoke.push({ module: module as FinanceModule, action: action as FinanceAction })
        }
      }

      // Execute grants and revokes
      if (toGrant.length > 0) {
        const result = await bulkGrantPermissions(user.userId, toGrant)
        if (!result.success) {
          toast.error("Failed to grant some permissions")
        } else {
          toast.success(`Granted ${result.granted} permissions`)
        }
      }

      if (toRevoke.length > 0) {
        const result = await bulkRevokePermissions(user.userId, toRevoke)
        if (!result.success) {
          toast.error("Failed to revoke some permissions")
        } else {
          toast.success(`Revoked ${result.revoked} permissions`)
        }
      }

      if (toGrant.length === 0 && toRevoke.length === 0) {
        toast.info("No changes to save")
      }

      onRefresh()
      onClose()
    } catch (error) {
      toast.error("Failed to save permissions")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Permissions for {user.userName}</DialogTitle>
        <DialogDescription>
          Select which actions this user can perform on each module
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {FINANCE_MODULES.map((module) => (
          <div key={module} className="space-y-2">
            <h4 className="font-semibold">{MODULE_LABELS[module]}</h4>
            <div className="grid grid-cols-2 gap-2 pl-4">
              {FINANCE_ACTIONS.map((action) => {
                const isChecked =
                  selectedPermissions.get(module)?.has(action) || false
                return (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module}-${action}`}
                      checked={isChecked}
                      onCheckedChange={() => togglePermission(module, action)}
                    />
                    <Label
                      htmlFor={`${module}-${action}`}
                      className="text-sm cursor-pointer"
                    >
                      {action}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  )
}

// Copy Permissions Dialog
function CopyPermissionsDialog({
  fromUser,
  onClose,
  onRefresh,
}: {
  fromUser: UserPermissionSummary
  onClose: () => void
  onRefresh: () => void
}) {
  const [users, setUsers] = useState<UserPermissionSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      const result = await getAllUsersWithPermissions()
      if (result.success && result.data) {
        // Filter out the source user
        setUsers(result.data.filter((u) => u.userId !== fromUser.userId))
      }
    }
    loadUsers()
  }, [fromUser.userId])

  const handleCopy = async () => {
    if (!selectedUserId) {
      toast.error("Please select a target user")
      return
    }

    setCopying(true)
    try {
      const result = await copyPermissions(fromUser.userId, selectedUserId)
      if (result.success) {
        toast.success(`Copied ${result.copied} permissions`)
        onRefresh()
        onClose()
      } else {
        toast.error(result.error || "Failed to copy permissions")
      }
    } catch (error) {
      toast.error("Failed to copy permissions")
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Copy Permissions</DialogTitle>
        <DialogDescription>
          Copy permissions from {fromUser.userName} to another user
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label>Target User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.userId} value={user.userId}>
                  {user.userName} ({user.userEmail})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Permissions to copy:</h4>
          {fromUser.permissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No custom permissions to copy
            </p>
          ) : (
            <div className="space-y-2">
              {fromUser.permissions.map((perm) => (
                <div key={perm.module} className="text-sm">
                  <strong>{MODULE_LABELS[perm.module]}:</strong>{" "}
                  {perm.actions.join(", ")}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={copying}>
          Cancel
        </Button>
        <Button
          onClick={handleCopy}
          disabled={copying || !selectedUserId || fromUser.permissions.length === 0}
        >
          {copying ? "Copying..." : "Copy Permissions"}
        </Button>
      </DialogFooter>
    </>
  )
}
