"use client";

import { useSidebar } from "@/components/ui/sidebar";

interface ProfileHeaderProps {
  role: "student" | "teacher" | "staff" | "parent"
  data: any
}

export default function ProfileHeader({ role, data }: ProfileHeaderProps) {
  const { state, open, openMobile, isMobile } = useSidebar();
  
  // Determine if we should use mobile layout
  const useMobileLayout = isMobile || (open && !isMobile);
  
  const getRoleSpecificContent = () => {
    switch (role) {
      case "student":
        return {
          greeting: `Hi 👋, I'm ${data.givenName} ${data.surname}`,
          subtitle: "Student & Tech Enthusiast 🎓",
          subjects: [
            { name: "Math", color: "#659ad3" },
            { name: "Sci", color: "#1572b6" },
            { name: "Eng", color: "#f24e1e" },
            { name: "Hist", color: "#ffa000" },
            { name: "Geo", color: "#03569b" },
            { name: "Art", color: "#f34b7d" },
            { name: "PE", color: "#f0db4f" },
            { name: "CS", color: "#39cefd" },
            { name: "Chem", color: "#a259ff" },
            { name: "Bio", color: "#26a641" },
          ]
        }
      case "teacher":
        return {
          greeting: `Hi 👋, I'm ${data.givenName} ${data.surname}`,
          subtitle: "Teacher & Educator 👩‍🏫",
          subjects: [
            { name: "Math", color: "#659ad3" },
            { name: "Adv", color: "#1572b6" },
            { name: "Calc", color: "#f24e1e" },
          ]
        }
      case "staff":
        return {
          greeting: `Hi 👋, I'm ${data.givenName} ${data.surname}`,
          subtitle: "Staff Member & Administrator 👨‍💼",
          subjects: [
            { name: "Admin", color: "#659ad3" },
            { name: "HR", color: "#1572b6" },
            { name: "Finance", color: "#f24e1e" },
          ]
        }
      case "parent":
        return {
          greeting: `Hi 👋, I'm ${data.givenName} ${data.surname}`,
          subtitle: "Parent & Guardian 👨‍👩‍👧‍👦",
          subjects: [
            { name: "Child1", color: "#659ad3" },
            { name: "Child2", color: "#1572b6" },
            { name: "Support", color: "#f24e1e" },
          ]
        }
      default:
        return {
          greeting: "Hi 👋, I'm Unknown",
          subtitle: "Unknown Role",
          subjects: []
        }
    }
  }

  const roleContent = getRoleSpecificContent()

  return (
    <div className=" rounded-lg py-6">
      <div className="mb-6">
        <h2 className="mb-2">{roleContent.greeting}</h2>
        <p className="text-muted-foreground mb-4">{roleContent.subtitle}</p>

        <ul className="space-y-2 muted">
          <li className="flex items-center">
            <span className="text-[#39d353] mr-2">📖</span>
            Currently studying Advanced Mathematics and Computer Science.
          </li>
          <li className="flex items-center">
            <span className="text-[#39d353] mr-2">🎯</span>
            Preparing for Engineering entrance exams
          </li>
          <li className="flex items-center">
            <span className="text-[#ffffff] mr-2">💡</span>
            Ask me about Science projects or coding assignments.
          </li>
          <li className="flex items-center">
            <span className="text-[#ffa000] mr-2">🤝</span>
            Looking to collaborate on school tech projects & study groups
          </li>
          <li className="flex items-center">
            <span className="text-[#ffa000] mr-2">⚡</span>
            Fun fact: I love building apps and participating in science fairs.
          </li>
        </ul>
      </div>

      <div className="mb-6">
        <h5 className="mb-3">Current Subjects:</h5>
        <div className="flex flex-wrap gap-3">
          {roleContent.subjects.map((subject, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name}
            </div>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${useMobileLayout ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Academic Performance */}
        <div>
          <h5 className="mb-3">Subject Performance</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#26a641] mr-2"></div>
                <span className="muted">Mathematics 95%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#1f6feb] mr-2"></div>
                <span className="muted">Computer Science 92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#a259ff] mr-2"></div>
                <span className="muted">Physics 88%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#ffa000] mr-2"></div>
                <span className="muted">Chemistry 85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#f24e1e] mr-2"></div>
                <span className="muted">English 82%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h5 className="mb-3">📚 Recent Projects</h5>
          <div className="space-y-2 muted">
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Solar System Model
              </a>
              <span className="text-muted-foreground">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Math Calculator App
              </a>
              <span className="text-muted-foreground">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Chemistry Lab Report
              </a>
            </div>
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                History Timeline
              </a>
              <span className="text-muted-foreground">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Literature Analysis
              </a>
            </div>
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Science Fair Project
              </a>
              <span className="text-muted-foreground">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Programming Assignment
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
