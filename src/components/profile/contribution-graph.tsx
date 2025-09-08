export default function ContributionGraph() {
  // Generate contribution data for the year
  const generateContributions = () => {
    const contributions = []
    const startDate = new Date("2024-01-01")
    const endDate = new Date("2024-12-31")

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const intensity = Math.random()
      let level = 0
      if (intensity > 0.8) level = 4
      else if (intensity > 0.6) level = 3
      else if (intensity > 0.4) level = 2
      else if (intensity > 0.2) level = 1

      contributions.push({
        date: new Date(d),
        level,
      })
    }
    return contributions
  }

  const contributions = generateContributions()

  const getColorForLevel = (level: number) => {
    switch (level) {
      case 0:
        return "#161b22"
      case 1:
        ;("#0e4429")
      case 2:
        return "#006d32"
      case 3:
        return "#26a641"
      case 4:
        return "#39d353"
      default:
        return "#161b22"
    }
  }

  return (
    <div className="rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3>Learn how we count contributions</h3>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
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

      <div className="overflow-x-auto">
        <div className="grid grid-cols-53 gap-1 min-w-max">
          {contributions.map((contribution, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getColorForLevel(contribution.level) }}
              title={`${contribution.level} contributions on ${contribution.date.toDateString()}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <div className="rounded p-2">
          <div className="space-y-1 text-xs">
            <div>2024</div>
            <div>2023</div>
            <div>2022</div>
            <div>2021</div>
          </div>
        </div>
      </div>
    </div>
  )
}
