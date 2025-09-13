"use client"

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    postalCode: initialData?.postalCode || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
  });

  // Update parent component when location data changes
  useEffect(() => {
    onLocationChange(locationData);
  }, [locationData, onLocationChange]);

  const handleInputChange = (field: keyof LocationFormData, value: string | number) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Location Details</h3>
        </div>
        
        <div className="grid gap-4">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street"
              value={locationData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          {/* City and State Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={locationData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                type="text"
                placeholder="NY"
                value={locationData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
          </div>

          {/* Country and Postal Code Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                placeholder="United States"
                value={locationData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal/ZIP Code</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="10001"
                value={locationData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
              />
            </div>
          </div>

          {/* Coordinates Section (Optional - Hidden by default) */}
          <details className="mt-4">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Advanced: GPS Coordinates (Optional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="40.7128"
                  value={locationData.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="-74.0060"
                  value={locationData.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </details>
        </div>
      </Card>

      {/* Display Selected Location Summary */}
      {(locationData.address || locationData.city) && (
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
                locationData.country,
                locationData.postalCode
              ].filter(Boolean).join(", ")}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}