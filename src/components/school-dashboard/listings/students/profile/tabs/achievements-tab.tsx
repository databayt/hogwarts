import { format } from "date-fns"
import { Award, Medal, Plus, Star, Target, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Achievement, Student } from "../../registration/types"

interface AchievementsTabProps {
  student: Student
}

export function AchievementsTab({ student }: AchievementsTabProps) {
  // Use real achievements from database
  const achievements: Achievement[] = student.achievements || []

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ACADEMIC":
        return "🎓"
      case "SPORTS":
        return "⚽"
      case "ARTS":
        return "🎨"
      case "CULTURAL":
        return "🎭"
      case "LEADERSHIP":
        return "👔"
      case "COMMUNITY_SERVICE":
        return "🤝"
      default:
        return "🏆"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ACADEMIC":
        return "bg-blue-100 text-blue-800"
      case "SPORTS":
        return "bg-green-100 text-green-800"
      case "ARTS":
        return "bg-purple-100 text-purple-800"
      case "CULTURAL":
        return "bg-orange-100 text-orange-800"
      case "LEADERSHIP":
        return "bg-indigo-100 text-indigo-800"
      case "COMMUNITY_SERVICE":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelBadge = (level?: string) => {
    switch (level) {
      case "INTERNATIONAL":
        return { color: "bg-red-100 text-red-800", icon: "🌍" }
      case "NATIONAL":
        return { color: "bg-orange-100 text-orange-800", icon: "🏛️" }
      case "STATE":
        return { color: "bg-yellow-100 text-yellow-800", icon: "📍" }
      case "DISTRICT":
        return { color: "bg-green-100 text-green-800", icon: "🏘️" }
      case "SCHOOL":
        return { color: "bg-blue-100 text-blue-800", icon: "🏫" }
      default:
        return { color: "bg-gray-100 text-gray-800", icon: "🏆" }
    }
  }

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0)
  const categoryCounts = achievements.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6">
      {/* Add Achievement Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          <Plus className="me-2 h-4 w-4" />
          Add Achievement
        </Button>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Achievements
                </p>
                <p className="text-2xl font-bold">{achievements.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Academic</p>
                <p className="text-2xl font-bold">
                  {categoryCounts["ACADEMIC"] || 0}
                </p>
              </div>
              <Medal className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Sports</p>
                <p className="text-2xl font-bold">
                  {categoryCounts["SPORTS"] || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement List */}
      <div className="grid gap-4">
        {achievements.map((achievement) => {
          const levelBadge = getLevelBadge(achievement.level)

          return (
            <Card key={achievement.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {/* Achievement Icon */}
                    <div className="text-4xl">
                      {getCategoryIcon(achievement.category)}
                    </div>

                    {/* Achievement Details */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="flex items-center gap-2 font-medium">
                          {achievement.title}
                          {achievement.position && (
                            <Badge variant="default" className="text-xs">
                              {achievement.position}
                            </Badge>
                          )}
                        </h4>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {achievement.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={getCategoryColor(achievement.category)}
                        >
                          {achievement.category.replace("_", " ")}
                        </Badge>
                        {achievement.level && (
                          <Badge
                            variant="secondary"
                            className={levelBadge.color}
                          >
                            <span className="me-1">{levelBadge.icon}</span>
                            {achievement.level}
                          </Badge>
                        )}
                        {achievement.points && achievement.points > 0 && (
                          <Badge variant="outline">
                            {achievement.points} points
                          </Badge>
                        )}
                      </div>

                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <span>
                          {format(
                            new Date(achievement.achievementDate),
                            "dd MMM yyyy"
                          )}
                        </span>
                        {achievement.issuedBy && (
                          <>
                            <span>•</span>
                            <span>Issued by: {achievement.issuedBy}</span>
                          </>
                        )}
                        {achievement.certificateNo && (
                          <>
                            <span>•</span>
                            <span>
                              Certificate: {achievement.certificateNo}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {achievement.certificateUrl && (
                    <Button variant="outline" size="sm">
                      <Award className="me-1 h-4 w-4" />
                      View Certificate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {achievements.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Trophy className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              No achievements recorded yet
            </p>
            <Button variant="outline" className="mt-4">
              <Plus className="me-2 h-4 w-4" />
              Add First Achievement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Achievement Summary by Year */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Achievement Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Get unique years from actual achievements */}
              {Array.from(
                new Set(
                  achievements.map((a) =>
                    new Date(a.achievementDate).getFullYear()
                  )
                )
              )
                .sort((a, b) => b - a)
                .map((year) => {
                  const yearAchievements = achievements.filter(
                    (a) => new Date(a.achievementDate).getFullYear() === year
                  )
                  return (
                    <div key={year} className="border-primary border-s-2 ps-4">
                      <h5 className="mb-2 font-medium">{year}</h5>
                      <div className="space-y-1">
                        {yearAchievements.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span>{getCategoryIcon(a.category)}</span>
                            <span>{a.title}</span>
                            <span className="text-muted-foreground">
                              ({format(new Date(a.achievementDate), "MMM dd")})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
