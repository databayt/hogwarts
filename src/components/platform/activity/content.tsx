import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/atom/page-header";
import { IconPlus } from "@tabler/icons-react";

export default async function ActivityContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Co-curricular Activities"
        description="Manage sports, clubs, and extracurricular activities"
        className="text-start max-w-none"
      />

      <Tabs defaultValue="sports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="sports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sports Activities</CardTitle>
                <CardDescription>
                  Manage sports teams and athletic programs
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Sport
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {["Cricket", "Football", "Basketball", "Badminton"].map((sport) => (
                  <div key={sport} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{sport} Team</h3>
                    <p className="text-sm text-muted-foreground">
                      15 students enrolled • Practice: Mon, Wed, Fri
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clubs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Clubs</CardTitle>
                <CardDescription>
                  Organize and manage student interest groups
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Club
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {["Science Club", "Drama Club", "Music Club", "Debate Club"].map((club) => (
                  <div key={club} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{club}</h3>
                    <p className="text-sm text-muted-foreground">
                      20 members • Meets every Thursday
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  School events and competitions
                </CardDescription>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  { name: "Annual Sports Day", date: "March 15, 2024" },
                  { name: "Science Fair", date: "April 10, 2024" },
                  { name: "Cultural Festival", date: "May 5, 2024" },
                ].map((event) => (
                  <div key={event.name} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
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