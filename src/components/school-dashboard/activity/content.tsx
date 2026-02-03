import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export default async function ActivityContent() {
  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title="Co-curricular Activities"
        description="Manage sports, clubs, and extracurricular activities"
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
                <Plus className="mr-2 h-4 w-4" />
                Add Sport
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {["Cricket", "Football", "Basketball", "Badminton"].map(
                  (sport) => (
                    <div key={sport} className="rounded-lg border p-4">
                      <h3 className="font-semibold">{sport} Team</h3>
                      <p className="text-muted-foreground text-sm">
                        15 students enrolled • Practice: Mon, Wed, Fri
                      </p>
                    </div>
                  )
                )}
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
                <Plus className="mr-2 h-4 w-4" />
                Add Club
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[
                  "Science Club",
                  "Drama Club",
                  "Music Club",
                  "Debate Club",
                ].map((club) => (
                  <div key={club} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{club}</h3>
                    <p className="text-muted-foreground text-sm">
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
                <Plus className="mr-2 h-4 w-4" />
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
                  <div key={event.name} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {event.date}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
