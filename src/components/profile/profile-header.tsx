export default function ProfileHeader() {
  const subjects = [
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

  return (
    <div className="bg-[#212830] rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Hi 👋, I'm Rahul Sharma</h2>
        <p className="text-[#9198a1] mb-4">Grade 12 Science Student & Tech Enthusiast 🎓</p>

        <ul className="space-y-2 text-sm">
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
        <h3 className="text-lg font-semibold mb-3">Current Subjects:</h3>
        <div className="flex flex-wrap gap-3">
          {subjects.map((subject, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Performance */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Subject Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#26a641] mr-2"></div>
                <span className="text-sm">Mathematics 95%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#1f6feb] mr-2"></div>
                <span className="text-sm">Computer Science 92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#a259ff] mr-2"></div>
                <span className="text-sm">Physics 88%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#ffa000] mr-2"></div>
                <span className="text-sm">Chemistry 85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#f24e1e] mr-2"></div>
                <span className="text-sm">English 82%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📚 Recent Projects</h3>
          <div className="space-y-2 text-sm">
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Solar System Model
              </a>
              <span className="text-[#9198a1]">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Math Calculator App
              </a>
              <span className="text-[#9198a1]">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Chemistry Lab Report
              </a>
            </div>
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                History Timeline
              </a>
              <span className="text-[#9198a1]">, </span>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Literature Analysis
              </a>
            </div>
            <div>
              <a href="#" className="text-[#1f6feb] hover:underline">
                Science Fair Project
              </a>
              <span className="text-[#9198a1]">, </span>
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
