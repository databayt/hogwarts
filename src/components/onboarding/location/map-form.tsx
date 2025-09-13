"use client"

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { type LocationFormData } from "./validation";

interface MapFormProps {
  initialData?: Partial<LocationFormData>;
  onLocationChange: (data: LocationFormData) => void;
}

export function MapForm({ initialData, onLocationChange }: MapFormProps) {
  const [locationData, setLocationData] = useState<LocationFormData>({
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "",
    postalCode: "", // Keep empty for database compatibility
    latitude: 0, // Keep default for database compatibility
    longitude: 0, // Keep default for database compatibility
  });

  // Update parent component when location data changes
  useEffect(() => {
    onLocationChange(locationData);
  }, [locationData, onLocationChange]);

  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Location Details</h3>
        </div>
        
        <div className="grid gap-4">
          {/* Address */}
          <Input
            type="text"
            placeholder="Street Address (e.g., 123 Main Street)"
            value={locationData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full"
          />

          {/* City and State Row */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="City (e.g., New York)"
              value={locationData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />

            <Input
              type="text"
              placeholder="State/Province (e.g., NY)"
              value={locationData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>

          {/* Country */}
          <Input
            type="text"
            placeholder="Country (e.g., United States)"
            value={locationData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full"
          />
        </div>
      </Card>

      {/* Display Location Summary */}
      {(locationData.address || locationData.city || locationData.country) && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Summary
            </p>
            <p className="text-xs text-muted-foreground">
              {[
                locationData.address,
                locationData.city,
                locationData.state,
                locationData.country
              ].filter(Boolean).join(", ")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}