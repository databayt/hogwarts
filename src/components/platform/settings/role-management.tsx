"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Trash2,
  Key,
  UserCog,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

// All available roles in the system
export const USER_ROLES = [
  { value: "DEVELOPER", label: "Developer", description: "Platform admin with full access", color: "destructive" },
  { value: "ADMIN", label: "Admin", description: "School administrator", color: "default" },
  { value: "TEACHER", label: "Teacher", description: "Teaching staff", color: "secondary" },
  { value: "STUDENT", label: "Student", description: "Enrolled student", color: "outline" },
  { value: "GUARDIAN", label: "Guardian", description: "Parent/Guardian", color: "outline" },
  { value: "ACCOUNTANT", label: "Accountant", description: "Finance staff", color: "secondary" },
  { value: "STAFF", label: "Staff", description: "General school staff", color: "outline" },
  { value: "USER", label: "User", description: "Basic user", color: "outline" },
] as const;

export type UserRole = typeof USER_ROLES[number]["value"];

// Permissions for each role
const ROLE_PERMISSIONS = {
  DEVELOPER: ["*"], // All permissions
  ADMIN: [
    "users.view", "users.create", "users.edit", "users.delete",
    "students.view", "students.create", "students.edit", "students.delete",
    "teachers.view", "teachers.create", "teachers.edit", "teachers.delete",
    "classes.view", "classes.create", "classes.edit", "classes.delete",
    "finances.view", "finances.edit",
    "reports.view", "reports.create",
    "settings.view", "settings.edit",
  ],
  TEACHER: [
    "students.view",
    "classes.view", "classes.edit",
    "assignments.create", "assignments.edit", "assignments.delete",
    "grades.create", "grades.edit",
    "attendance.create", "attendance.edit",
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
    "finances.view", "finances.edit", "finances.create",
    "fees.view", "fees.edit", "fees.create",
    "reports.view", "reports.create",
  ],
  STAFF: [
    "announcements.view",
    "timetable.view",
    "reports.view",
  ],
  USER: [
    "announcements.view",
  ],
};

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  lastActive?: Date;
  image?: string;
}

interface RoleManagementProps {
  dictionary?: Dictionary["school"];
  currentUserId?: string;
  isDeveloperMode?: boolean;
}

export function RoleManagement({
  dictionary,
  currentUserId,
  isDeveloperMode = false,
}: RoleManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "John Admin",
      email: "admin@school.edu",
      role: "ADMIN",
      status: "active",
      lastActive: new Date(),
    },
    {
      id: "2",
      name: "Sarah Teacher",
      email: "teacher@school.edu",
      role: "TEACHER",
      status: "active",
      lastActive: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      name: "Mike Student",
      email: "student@school.edu",
      role: "STUDENT",
      status: "active",
      lastActive: new Date(Date.now() - 86400000),
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER" as UserRole,
  });

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      try {
        // In production, call server action to update role
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        SuccessToast("Role updated successfully");
      } catch (error) {
        ErrorToast("Failed to update role");
      }
    });
  };

  // Handle user status change
  const handleStatusChange = async (userId: string, status: User["status"]) => {
    startTransition(async () => {
      try {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, status } : user
          )
        );
        SuccessToast(`User ${status === "active" ? "activated" : "suspended"}`);
      } catch (error) {
        ErrorToast("Failed to update user status");
      }
    });
  };

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      ErrorToast("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      try {
        const user: User = {
          id: Date.now().toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: "active",
          lastActive: new Date(),
        };
        setUsers((prev) => [...prev, user]);
        setNewUser({ name: "", email: "", role: "USER" });
        setIsAddUserOpen(false);
        SuccessToast("User added successfully");
      } catch (error) {
        ErrorToast("Failed to add user");
      }
    });
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      ErrorToast("You cannot delete your own account");
      return;
    }

    startTransition(async () => {
      try {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        SuccessToast("User deleted successfully");
      } catch (error) {
        ErrorToast("Failed to delete user");
      }
    });
  };

  const getRoleBadgeVariant = (role: UserRole): any => {
    const roleConfig = USER_ROLES.find((r) => r.value === role);
    return roleConfig?.color || "outline";
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Developer Mode Alert */}
      {isDeveloperMode && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Developer Mode Active
            </CardTitle>
            <CardDescription>
              You have full access to all features and can manage all user roles.
              This mode is for testing and development only.
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
                User & Role Management
              </CardTitle>
              <CardDescription className="mt-2">
                Manage user accounts, assign roles, and control permissions
              </CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and assign a role
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@school.edu"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
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
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span>{role.label}</span>
                              <span className="text-xs text-muted-foreground">
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
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={isPending}>
                    Add User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* User Statistics */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.status === "active").length}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === "ADMIN" || u.role === "DEVELOPER").length}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Teachers</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.role === "TEACHER").length}
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.id === currentUserId && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              You
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
                              {USER_ROLES.find((r) => r.value === user.role)?.label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                <Badge variant={role.color as any}>
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
                        variant={
                          user.status === "active"
                            ? "default"
                            : user.status === "suspended"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastActive
                        ? formatLastActive(user.lastActive)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditUserOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleStatusChange(
                              user.id,
                              user.status === "active" ? "suspended" : "active"
                            )
                          }
                          disabled={user.id === currentUserId}
                        >
                          {user.status === "active" ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUserId}
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
            Role Permissions
          </CardTitle>
          <CardDescription>
            View and manage permissions for each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {USER_ROLES.map((role) => (
              <div key={role.value} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={role.color as any}>{role.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Permissions:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ROLE_PERMISSIONS[role.value]?.slice(0, 5).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
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
                    View All
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}