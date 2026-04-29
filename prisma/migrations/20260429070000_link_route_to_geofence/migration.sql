-- Link Route → GeoFence for boarding via geofence events (M2-3)

-- AddColumn
ALTER TABLE "transportation_routes" ADD COLUMN "geofenceId" TEXT;

-- CreateIndex
CREATE INDEX "transportation_routes_geofenceId_idx" ON "transportation_routes"("geofenceId");

-- AddForeignKey
ALTER TABLE "transportation_routes" ADD CONSTRAINT "transportation_routes_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geo_fences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
