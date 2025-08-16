export default function RepositoryGrid() {
  const repositories = [
    {
      name: "eMart",
      visibility: "Public",
      description: "eMart is a Flutter-based e-commerce platform with separate applications for users and admins.",
      language: "Dart",
      stars: 3,
      forks: null,
    },
    {
      name: "reConnect",
      visibility: "Public",
      description:
        "ReConnect is a powerful chat app designed to bring people closer together. It offers a seamless and user-friendly platform for reconnecting with old friends, family, and even making new connections.",
      language: "Dart",
      stars: 1,
      forks: null,
    },
    {
      name: "cached_image",
      visibility: "Public",
      description: "A flutter library to show images from the internet and keep them in the cache directory.",
      language: "Dart",
      stars: 2,
      forks: null,
    },
    {
      name: "suite",
      visibility: "Public",
      description: "JARS is a super-effective and lightweight solution for Flutter.",
      language: "Dart",
      stars: 4,
      forks: 1,
    },
    {
      name: "pub_cli",
      visibility: "Public",
      description: "PUB CLI Tool to help you new flutter project",
      language: "Dart",
      stars: 1,
      forks: null,
    },
    {
      name: "Business-AtoZ-Analysis",
      visibility: "Public",
      description: "Advanced system for analyzing daily employee attendance and performance data",
      language: "HTML",
      stars: null,
      forks: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {repositories.map((repo, index) => (
        <div key={index} className=" border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-muted-foreground mr-2" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 0 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8zM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.25.25 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25z" />
              </svg>
              <a href="#" className="text-[#1f6feb] hover:underline font-semibold">
                {repo.name}
              </a>
            </div>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-1">
              {repo.visibility}
            </span>
          </div>

          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{repo.description}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-1 ${repo.language === "Dart" ? "bg-[#00b4ab]" : "bg-[#e34c26]"}`}
                ></div>
                <span>{repo.language}</span>
              </div>

              {repo.stars && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
                  </svg>
                  <span>{repo.stars}</span>
                </div>
              )}

              {repo.forks && (
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878z" />
                  </svg>
                  <span>{repo.forks}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
