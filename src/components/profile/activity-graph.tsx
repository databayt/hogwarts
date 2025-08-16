export default function ActivityGraph() {
  // Generate activity data for school year (simplified representation)
  const generateActivityData = () => {
    const data = []
    const startDate = new Date("2024-01-01")
    const endDate = new Date("2024-12-31")

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const activity = Math.floor(Math.random() * 5) // 0-4 activity levels
      data.push({
        date: new Date(d),
        activity: activity,
        level: activity === 0 ? 0 : activity === 1 ? 1 : activity === 2 ? 2 : activity === 3 ? 3 : 4,
      })
    }
    return data
  }

  const activityData = generateActivityData()

  return (
    <div className="bg-[#212830] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Academic Activity</h3>
        <div className="flex items-center space-x-2 text-xs text-[#9198a1]">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-sm bg-[#161b22]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#0e4429]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#006d32]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#26a641]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#39d353]"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Activity Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-53 gap-1 mb-4" style={{ minWidth: "800px" }}>
          {activityData.map((day, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm ${
                day.level === 0
                  ? "bg-[#161b22]"
                  : day.level === 1
                    ? "bg-[#0e4429]"
                    : day.level === 2
                      ? "bg-[#006d32]"
                      : day.level === 3
                        ? "bg-[#26a641]"
                        : "bg-[#39d353]"
              }`}
              title={`${day.date.toDateString()}: ${day.activity} activities`}
            ></div>
          ))}
        </div>
      </div>

      <p className="text-sm text-[#9198a1]">Learn how academic activity is calculated and displayed.</p>
    </div>
  )
}
