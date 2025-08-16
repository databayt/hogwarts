import Image from "next/image"

export default function ProfileSidebar() {
  return (
    <div className="space-y-4">
      {/* Profile Image */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-[#3d444d]">
          <Image
            src="/young-indian-man-headshot.png"
            alt="Student Profile"
            width={256}
            height={256}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#212830] rounded-full flex items-center justify-center border-2 border-[#0d1117]">
          <span className="text-lg">📚</span>
        </div>
      </div>

      {/* User Info */}
      <div>
        <h1 className="text-2xl font-bold text-[#ffffff] mb-1">Rahul Sharma</h1>
        <p className="text-[#9198a1] text-sm mb-2">Student ID: STU2024001</p>
        <p className="text-[#9198a1] text-sm mb-2">Grade 12 - Science Stream</p>
        <p className="text-[#9198a1] text-sm">Academic Year: 2024-25</p>
      </div>

      {/* Action Button */}
      <button className="w-full bg-[#3d444d] hover:bg-[#4c5561] text-[#ffffff] py-2 px-4 rounded-lg transition-colors">
        View Full Profile
      </button>

      {/* Academic Stats */}
      <div className="flex space-x-4 text-sm">
        <span className="text-[#9198a1]">
          <span className="text-[#ffffff] font-semibold">8</span> subjects
        </span>
        <span className="text-[#9198a1]">
          <span className="text-[#ffffff] font-semibold">12</span> projects
        </span>
      </div>

      {/* Achievement Badges */}
      <div className="flex space-x-2 mt-4">
        <div className="w-12 h-12 rounded-full bg-[#212830] flex items-center justify-center" title="Honor Roll">
          <span className="text-2xl">🏆</span>
        </div>
        <div
          className="w-12 h-12 rounded-full bg-[#212830] flex items-center justify-center"
          title="Perfect Attendance"
        >
          <span className="text-2xl">📅</span>
        </div>
        <div
          className="w-12 h-12 rounded-full bg-[#212830] flex items-center justify-center"
          title="Science Fair Winner"
        >
          <span className="text-2xl">🔬</span>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#212830] flex items-center justify-center" title="GPA">
          <span className="text-xl font-bold">3.8</span>
        </div>
      </div>
    </div>
  )
}
