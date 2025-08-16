export default function StudentDashboard() {
  return (
    <div className="bg-[#212830] rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">🎓</span>
        Student Dashboard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1117] rounded-lg p-4">
          <h4 className="font-semibold text-[#39d353] mb-2">Upcoming Assignments</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Math Quiz</span>
              <span className="text-[#ffa000]">Due: Dec 20</span>
            </div>
            <div className="flex justify-between">
              <span>Science Project</span>
              <span className="text-[#f85149]">Due: Dec 18</span>
            </div>
            <div className="flex justify-between">
              <span>History Essay</span>
              <span className="text-[#39d353]">Due: Dec 25</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1117] rounded-lg p-4">
          <h4 className="font-semibold text-[#1f6feb] mb-2">Current GPA</h4>
          <div className="text-2xl font-bold text-[#39d353]">3.8</div>
          <div className="text-sm text-[#9198a1]">Semester Average</div>
        </div>

        <div className="bg-[#0d1117] rounded-lg p-4">
          <h4 className="font-semibold text-[#a259ff] mb-2">Attendance</h4>
          <div className="text-2xl font-bold text-[#39d353]">95%</div>
          <div className="text-sm text-[#9198a1]">This Month</div>
        </div>
      </div>
    </div>
  )
}
