"use client"

import { useState } from "react"
import {
  CircleAlert,
  Edit2,
  MapPin,
  MoreHorizontal,
  Power,
  PowerOff,
  School,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

import { deleteGeofence, updateGeofenceStatus } from "./actions"

interface Geofence {
  id: string
  name: string
  type: string
  isActive: boolean
  centerLat: number | null
  centerLon: number | null
  radiusMeters: number | null
  color: string | null
}

interface GeofenceListProps {
  geofences: Geofence[]
  onRefresh?: () => void
}

const typeConfig: Record<
  string,
  { label: string; icon: typeof School; color: string }
> = {
  SCHOOL_GROUNDS: {
    label: "School Grounds",
    icon: School,
    color: "bg-green-100 text-green-800",
  },
  CLASSROOM: {
    label: "Classroom",
    icon: MapPin,
    color: "bg-blue-100 text-blue-800",
  },
  LIBRARY: {
    label: "Library",
    icon: MapPin,
    color: "bg-purple-100 text-purple-800",
  },
  CAFETERIA: {
    label: "Cafeteria",
    icon: MapPin,
    color: "bg-orange-100 text-orange-800",
  },
  PLAYGROUND: {
    label: "Playground",
    icon: MapPin,
    color: "bg-yellow-100 text-yellow-800",
  },
  BUS_ROUTE: {
    label: "Bus Route",
    icon: MapPin,
    color: "bg-gray-100 text-gray-800",
  },
}

export function GeofenceList({ geofences, onRefresh }: GeofenceListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(
    null
  )
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleToggleStatus = async (geofence: Geofence) => {
    setIsUpdating(geofence.id)
    try {
      const result = await updateGeofenceStatus(geofence.id, !geofence.isActive)
      if (result.success) {
        toast.success(
          `Geofence ${geofence.isActive ? "deactivated" : "activated"}`
        )
        onRefresh?.()
      } else {
        toast.error(result.error || "Failed to update geofence")
      }
    } catch (error) {
      toast.error("Failed to update geofence")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDelete = async () => {
    if (!selectedGeofence) return

    try {
      const result = await deleteGeofence(selectedGeofence.id)
      if (result.success) {
        toast.success("Geofence deleted")
        onRefresh?.()
      } else {
        toast.error(result.error || "Failed to delete geofence")
      }
    } catch (error) {
      toast.error("Failed to delete geofence")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedGeofence(null)
    }
  }

  if (geofences.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No Geofences Created</h3>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            Create your first geofence to enable automatic attendance tracking
            when students enter designated areas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {geofences.map((geofence) => {
          const config = typeConfig[geofence.type] || {
            label: geofence.type,
            icon: MapPin,
            color: "bg-gray-100 text-gray-800",
          }
          const IconComponent = config.icon

          return (
            <Card
              key={geofence.id}
              className={`transition-opacity ${!geofence.isActive ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: geofence.color || "#3b82f6",
                        opacity: 0.2,
                      }}
                    >
                      <IconComponent
                        className="h-5 w-5"
                        style={{ color: geofence.color || "#3b82f6" }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {geofence.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        <Badge variant="secondary" className={config.color}>
                          {config.label}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(geofence)}
                        disabled={isUpdating === geofence.id}
                      >
                        {geofence.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedGeofence(geofence)
                          setDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Location Info */}
                {geofence.centerLat && geofence.centerLon && (
                  <div className="text-muted-foreground space-y-1 text-xs">
                    <p>
                      Center: {geofence.centerLat.toFixed(4)},{" "}
                      {geofence.centerLon.toFixed(4)}
                    </p>
                    {geofence.radiusMeters && (
                      <p>Radius: {geofence.radiusMeters}m</p>
                    )}
                  </div>
                )}

                {/* Status Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        geofence.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm">
                      {geofence.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Switch
                    checked={geofence.isActive}
                    onCheckedChange={() => handleToggleStatus(geofence)}
                    disabled={isUpdating === geofence.id}
                  />
                </div>

                {/* Auto-attendance indicator */}
                {geofence.type === "SCHOOL_GROUNDS" && geofence.isActive && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-700">
                    <CircleAlert className="h-3 w-3" />
                    <span>Auto-marks attendance on entry (6-10 AM)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Geofence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedGeofence?.name}
              &quot;? This action cannot be undone and will also delete all
              associated events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
