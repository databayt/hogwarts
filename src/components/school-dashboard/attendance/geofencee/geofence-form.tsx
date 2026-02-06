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
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createCircularGeofence } from "./actions"
import {
  circularGeofenceSchema,
  type CircularGeofenceInput,
} from "./validation"

interface GeofenceFormProps {
  onSuccess?: () => void
  dictionary?: Dictionary["school"]
}

type GeofenceZoneType =
  | "SCHOOL_GROUNDS"
  | "CLASSROOM"
  | "BUS_ROUTE"
  | "PLAYGROUND"
  | "CAFETERIA"
  | "LIBRARY"

const GEOFENCE_TYPE_VALUES: GeofenceZoneType[] = [
  "SCHOOL_GROUNDS",
  "CLASSROOM",
  "BUS_ROUTE",
  "PLAYGROUND",
  "CAFETERIA",
  "LIBRARY",
]

type ColorKey = "blue" | "green" | "orange" | "red" | "purple" | "pink"

const PRESET_COLORS: { value: string; key: ColorKey }[] = [
  { value: "#3b82f6", key: "blue" },
  { value: "#10b981", key: "green" },
  { value: "#f59e0b", key: "orange" },
  { value: "#ef4444", key: "red" },
  { value: "#8b5cf6", key: "purple" },
  { value: "#ec4899", key: "pink" },
]

export function GeofenceForm({ onSuccess, dictionary }: GeofenceFormProps) {
  const t = dictionary?.attendance as Record<string, unknown> | undefined
  const geofenceDict = t?.geofence as Record<string, unknown> | undefined
  const formDict = t?.geofenceForm as Record<string, string> | undefined
  const colorsDict = t?.colors as Record<string, string> | undefined
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
        toast.success(
          (t?.success as Record<string, string> | undefined)?.geofenceCreated ||
            "Geofence created successfully"
        )
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(
          result.error ||
            (t?.errors as Record<string, string> | undefined)?.serverError ||
            "Failed to create geofence"
        )
      }
    } catch (error) {
      console.error("Error creating geofence:", error)
      toast.error(
        (t?.errors as Record<string, string> | undefined)?.serverError ||
          "Failed to create geofence"
      )
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
          toast.success(
            formDict?.locationSetSuccess || "Location set to current position"
          )
        },
        (error) => {
          console.error("Geolocation error:", error)
          toast.error(
            formDict?.locationError || "Failed to get current location"
          )
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      )
    } else {
      toast.error(
        formDict?.geolocationNotSupported ||
          "Geolocation not supported by your browser"
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{formDict?.createGeofence || "Create Geofence"}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formDict?.createNewGeofence || "Create New Geofence"}
          </DialogTitle>
          <DialogDescription>
            {formDict?.dialogDescription ||
              "Define a circular area that will automatically mark attendance when students enter"}
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
                  <FormLabel>
                    {formDict?.geofenceName || "Geofence Name"} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        formDict?.geofenceNamePlaceholder ||
                        "e.g., Main Campus, Math Building"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {formDict?.geofenceNameDescription ||
                      "A unique name to identify this geofence"}
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
                  <FormLabel>
                    {formDict?.description || "Description"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        formDict?.descriptionPlaceholder ||
                        "Optional description..."
                      }
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
                  <FormLabel>
                    {formDict?.geofenceType || "Geofence Type"} *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={formDict?.selectType || "Select type"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GEOFENCE_TYPE_VALUES.map((typeValue) => (
                        <SelectItem key={typeValue} value={typeValue}>
                          {(
                            geofenceDict?.zoneType as
                              | Record<string, string>
                              | undefined
                          )?.[typeValue] || typeValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {formDict?.typeDescription ||
                      "SCHOOL_GROUNDS type will trigger automatic attendance marking"}
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
                    <FormLabel>{formDict?.latitude || "Latitude"} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="24.7136"
                        dir="ltr"
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
                    <FormLabel>
                      {formDict?.longitude || "Longitude"} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="46.6753"
                        dir="ltr"
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
              {formDict?.useCurrentLocation || "Use Current Location"}
            </Button>

            {/* Radius */}
            <FormField
              control={form.control}
              name="radiusMeters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {formDict?.radius || "Radius (meters)"} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={5000}
                      step={10}
                      placeholder="500"
                      dir="ltr"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {formDict?.radiusDescription ||
                      "Radius in meters (10m - 5000m). Larger radius covers more area."}
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
                  <FormLabel>{formDict?.mapColor || "Map Color"}</FormLabel>
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
                        title={colorsDict?.[color.key] || color.key}
                      />
                    ))}
                    <FormControl>
                      <Input type="color" className="h-8 w-16" {...field} />
                    </FormControl>
                  </div>
                  <FormDescription>
                    {formDict?.mapColorDescription ||
                      "Choose a color for this geofence on the map"}
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
                {formDict?.cancel || "Cancel"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Icons.loaderCircle className="me-2 h-4 w-4 animate-spin" />
                )}
                {formDict?.createGeofence || "Create Geofence"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
