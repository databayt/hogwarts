export default function ProjectGrid() {
  const projects = [
    {
      name: "Solar System Model",
      type: "Science Project",
      description: "Interactive 3D model of the solar system with planetary motion simulation and educational content.",
      subject: "Physics",
      grade: "A+",
      status: "Completed",
    },
    {
      name: "Student Portal App",
      type: "Programming",
      description: "Mobile application for students to track assignments, grades, and communicate with teachers.",
      subject: "Computer Science",
      grade: "A",
      status: "In Progress",
    },
    {
      name: "Chemical Reactions Lab",
      type: "Lab Report",
      description: "Comprehensive analysis of acid-base reactions with detailed observations and conclusions.",
      subject: "Chemistry",
      grade: "A-",
      status: "Completed",
    },
    {
      name: "Literature Analysis",
      type: "Essay",
      description: "Critical analysis of themes and character development in contemporary literature.",
      subject: "English",
      grade: "B+",
      status: "Completed",
    },
    {
      name: "Historical Timeline",
      type: "Research Project",
      description: "Interactive timeline of major historical events with multimedia presentations.",
      subject: "History",
      grade: "A",
      status: "Completed",
    },
    {
      name: "Math Competition Prep",
      type: "Study Group",
      description: "Collaborative preparation materials and practice problems for upcoming mathematics competition.",
      subject: "Mathematics",
      grade: "Ongoing",
      status: "Active",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <div key={index} className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-muted-foreground mr-2" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z" />
              </svg>
              <a href="#" className="text-[#1f6feb] hover:underline font-semibold">
                {project.name}
              </a>
            </div>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-1">
              {project.type}
            </span>
          </div>

          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-1 ${
                    project.subject === "Physics"
                      ? "bg-[#1f6feb]"
                      : project.subject === "Computer Science"
                        ? "bg-[#39cefd]"
                        : project.subject === "Chemistry"
                          ? "bg-[#a259ff]"
                          : project.subject === "English"
                            ? "bg-[#f24e1e]"
                            : project.subject === "History"
                              ? "bg-[#ffa000]"
                              : "bg-[#26a641]"
                  }`}
                ></div>
                <span>{project.subject}</span>
              </div>

              {project.grade && project.grade !== "Ongoing" && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
                  </svg>
                  <span>{project.grade}</span>
                </div>
              )}

              <div className="flex items-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    project.status === "Completed"
                      ? "bg-[#26a641] text-white"
                      : project.status === "In Progress"
                        ? "bg-[#ffa000] text-white"
                        : "bg-[#1f6feb] text-white"
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
