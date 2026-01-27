"use client"

/**
 * GeofenceForm - Create/Pencil Geofence UI
 * Allows admins to create circular geofences for their school
 */
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"

import { createCircularGeofence } from "./actions"
import {
  circularGeofenceSchema,
  type CircularGeofenceInput,
} from "./validation"

interface GeofenceFormProps {
  onSuccess?: () => void
}

const GEOFENCE_TYPES = [
  { value: "SCHOOL_GROUNDS", label: "School Grounds (Main Campus)" },
  { value: "CLASSROOM", label: "Classroom" },
  { value: "BUS_ROUTE", label: "Bus Route" },
  { value: "PLAYGROUND", label: "Playground" },
  { value: "CAFETERIA", label: "Cafeteria" },
  { value: "LIBRARY", label: "Library" },
] as const

const PRESET_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
]

export function GeofenceForm({ onSuccess }: GeofenceFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CircularGeofenceInput>({
    resolver: zodResolver(circularGeofenceSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      type: "SCHOOL_GROUNDS" as const,
      centerLat: 24.7136, // Riyadh default
      centerLon: 46.6753,
      radiusMeters: 500,
      color: "#3b82f6",
      isActive: true,
    },
  })

  const onSubmit: SubmitHandler<CircularGeofenceInput> = async (data) => {
    try {
      setIsSubmitting(true)

      const result = await createCircularGeofence(data)

      if (result.success) {
        toast.success("Geofence created successfully")
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to create geofence")
      }
    } catch (error) {
      console.error("Error creating geofence:", error)
      toast.error("Failed to create geofence")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get current location from browser
  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("centerLat", position.coords.latitude)
          form.setValue("centerLon", position.coords.longitude)
          toast.success("Location set to current position")
        },
        (error) => {
          console.error("Geolocation error:", error)
          toast.error("Failed to get current location")
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      )
    } else {
      toast.error("Geolocation not supported by your browser")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Geofence</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Geofence</DialogTitle>
          <DialogDescription>
            Define a circular area that will automatically mark attendance when
            students enter
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geofence Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main Campus, Math Building"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A unique name to identify this geofence
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geofence Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GEOFENCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    SCHOOL_GROUNDS type will trigger automatic attendance
                    marking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Center Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="centerLat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="24.7136"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centerLon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="46.6753"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
            >
              Use Current Location
            </Button>

            {/* Radius */}
            <FormField
              control={form.control}
              name="radiusMeters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radius (meters) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={5000}
                      step={10}
                      placeholder="500"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Radius in meters (10m - 5000m). Larger radius covers more
                    area.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map Color</FormLabel>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color.value,
                          borderColor:
                            field.value === color.value ? "#000" : color.value,
                        }}
                        onClick={() => field.onChange(color.value)}
                        title={color.label}
                      />
                    ))}
                    <FormControl>
                      <Input type="color" className="h-8 w-16" {...field} />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Choose a color for this geofence on the map
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Icons.loaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Geofence
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
