import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus } from "@tabler/icons-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Props {
  dictionary?: Dictionary;
}

export default async function FacilityContent({ dictionary }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1>{dictionary?.facility?.title || "Facility Management"}</h1>
        <p className="text-muted-foreground">
          {dictionary?.facility?.subtitle || "Manage school infrastructure and resources"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">35</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">In Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">5</div>
            <p className="text-xs text-muted-foreground">Currently booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">2</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Classrooms & Halls</CardTitle>
                <CardDescription>
                  Manage classroom allocation and hall bookings
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { name: "Auditorium", capacity: 500, status: "available" },
                  { name: "Conference Room", capacity: 50, status: "in-use" },
                  { name: "Computer Lab 1", capacity: 40, status: "available" },
                  { name: "Library Hall", capacity: 100, status: "available" },
                ].map((room) => (
                  <div key={room.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {room.capacity} people
                      </p>
                    </div>
                    <Badge variant={room.status === "available" ? "success" : "default"}>
                      {room.status === "available" ? "Available" : "In Use"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Laboratory Facilities</CardTitle>
                <CardDescription>
                  Science and computer laboratories
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Lab
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { name: "Physics Lab", equipment: 45, status: "operational" },
                  { name: "Chemistry Lab", equipment: 52, status: "operational" },
                  { name: "Biology Lab", equipment: 38, status: "maintenance" },
                  { name: "Computer Lab", equipment: 40, status: "operational" },
                ].map((lab) => (
                  <div key={lab.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{lab.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {lab.equipment} equipment items
                      </p>
                    </div>
                    <Badge variant={lab.status === "operational" ? "success" : "warning"}>
                      {lab.status === "operational" ? "Operational" : "Maintenance"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>
                Track and manage school equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { name: "Projectors", total: 25, available: 20 },
                  { name: "Laptops", total: 50, available: 45 },
                  { name: "Sports Equipment", total: 100, available: 85 },
                  { name: "Musical Instruments", total: 30, available: 28 },
                ].map((item) => (
                  <div key={item.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <span className="text-sm font-medium">
                        {item.available}/{item.total} available
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.available / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transport Vehicles</CardTitle>
                <CardDescription>
                  School buses and transport fleet
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { number: "Bus 001", capacity: 50, route: "North Route", status: "active" },
                  { number: "Bus 002", capacity: 50, route: "South Route", status: "active" },
                  { number: "Bus 003", capacity: 40, route: "East Route", status: "maintenance" },
                  { number: "Van 001", capacity: 15, route: "Special", status: "active" },
                ].map((vehicle) => (
                  <div key={vehicle.number} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{vehicle.number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.route} • Capacity: {vehicle.capacity}
                      </p>
                    </div>
                    <Badge variant={vehicle.status === "active" ? "success" : "warning"}>
                      {vehicle.status === "active" ? "Active" : "Maintenance"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}