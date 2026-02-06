import Image from "next/image"
import Link from "next/link"
import { Bell, ChevronDown, GitFork, Plus, Star } from "lucide-react"

export default function GitHubProfile() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] px-4 py-3">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/public">
              <svg
                height="32"
                aria-hidden="true"
                viewBox="0 0 16 16"
                version="1.1"
                width="32"
                className="fill-white"
              >
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
            </Link>
            <div className="relative">
              <div className="flex h-8 items-center rounded-md border border-[#30363d] bg-[#0d1117]">
                <input
                  type="text"
                  placeholder="Search or jump to..."
                  className="w-64 bg-transparent px-3 py-1 text-sm text-[#c9d1d9] outline-none"
                />
                <div className="me-2 flex h-5 w-5 items-center justify-center rounded border border-[#30363d] text-[#8b949e]">
                  <span className="text-xs">/</span>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex">
              <ul className="flex gap-4 text-sm font-semibold">
                <li>
                  <Link
                    href="#"
                    className="text-[#c9d1d9] hover:text-[#f0f6fc]"
                  >
                    Pull requests
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-[#c9d1d9] hover:text-[#f0f6fc]"
                  >
                    Issues
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-[#c9d1d9] hover:text-[#f0f6fc]"
                  >
                    Codespaces
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-[#c9d1d9] hover:text-[#f0f6fc]"
                  >
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-[#c9d1d9] hover:text-[#f0f6fc]"
                  >
                    Explore
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[#c9d1d9]">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex items-center text-[#c9d1d9]">
              <Plus className="h-5 w-5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center text-[#c9d1d9]">
              <div className="h-5 w-5 overflow-hidden rounded-full border border-[#30363d]">
                <Image
                  src="/placeholder.svg?height=20&width=20"
                  alt="Profile"
                  width={20}
                  height={20}
                />
              </div>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <div className="relative">
              <div className="h-[300px] w-[300px] overflow-hidden rounded-full border-4 border-[#0d1117]">
                <Image
                  src="/placeholder.svg?height=300&width=300"
                  alt="Profile"
                  width={300}
                  height={300}
                  className="bg-[#6e68c6]"
                />
              </div>
              <button className="absolute right-2 bottom-2 rounded-full bg-[#0d1117] p-1 text-[#8b949e]">
                <svg
                  aria-hidden="true"
                  height="16"
                  viewBox="0 0 16 16"
                  version="1.1"
                  width="16"
                  className="fill-current"
                >
                  <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#f0f6fc]">
                chirag singla
              </h1>
              <p className="text-[#8b949e]">chiragsingla177</p>
            </div>

            <div>
              <p className="text-sm">
                Currently working in KAN LABS, NYC USA as an ML Engineer(Remote)
              </p>
            </div>

            <button className="w-full rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1 text-sm font-semibold text-[#c9d1d9]">
              Edit profile
            </button>

            <div className="flex items-center gap-2 text-sm">
              <Link
                href="#"
                className="flex items-center text-[#8b949e] hover:text-[#58a6ff]"
              >
                <svg
                  aria-hidden="true"
                  height="16"
                  viewBox="0 0 16 16"
                  version="1.1"
                  width="16"
                  className="me-1 fill-current"
                >
                  <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"></path>
                </svg>
                <span className="font-semibold">12</span> followers
              </Link>
              <span>·</span>
              <Link
                href="#"
                className="flex items-center text-[#8b949e] hover:text-[#58a6ff]"
              >
                <span className="font-semibold">3</span> following
              </Link>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-[#8b949e]">
                <svg className="me-2 h-4 w-4 fill-current" viewBox="0 0 16 16">
                  <path d="M11.536 3.464a5 5 0 0 1 0 7.072L8 14.07l-3.536-3.535a5 5 0 1 1 7.072-7.072v.001zm1.06 8.132a6.5 6.5 0 1 0-9.192 0l3.535 3.536a1.5 1.5 0 0 0 2.122 0l3.535-3.536zM8 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"></path>
                </svg>
                Delhi
              </div>
              <div className="flex items-center text-[#8b949e]">
                <svg className="me-2 h-4 w-4 fill-current" viewBox="0 0 16 16">
                  <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z"></path>
                </svg>
                <a
                  href="https://neuraltab.co/"
                  className="text-[#58a6ff] hover:underline"
                >
                  https://neuraltab.co/
                </a>
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-semibold">Achievements</h2>
              <div className="flex">
                <div className="h-12 w-12 rounded-full border border-[#30363d] bg-[#161b22] p-2">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
                      fill="#1F6FEB"
                      fillOpacity="0.4"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                      fill="#1F6FEB"
                      fillOpacity="0.4"
                    />
                    <path
                      d="M16 21.5L10.5 16L12.25 14.25L14.75 16.75V10.5H17.25V16.75L19.75 14.25L21.5 16L16 21.5Z"
                      fill="#1F6FEB"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <button className="rounded-full bg-[#238636] px-2 py-0.5 text-xs font-medium text-white">
                  Beta
                </button>
                <button className="ms-2 text-xs text-[#58a6ff]">
                  Send feedback
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-semibold">Organizations</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#"
                  className="block h-8 w-8 rounded-md border border-[#30363d] bg-[#161b22]"
                >
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt="Organization"
                    width={32}
                    height={32}
                  />
                </a>
                <a
                  href="#"
                  className="block h-8 w-8 rounded-md border border-[#30363d] bg-[#161b22]"
                >
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt="Organization"
                    width={32}
                    height={32}
                  />
                </a>
                <a
                  href="#"
                  className="block h-8 w-8 rounded-md border border-[#30363d] bg-[#161b22]"
                >
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt="Organization"
                    width={32}
                    height={32}
                  />
                </a>
                <a
                  href="#"
                  className="block h-8 w-8 rounded-md border border-[#30363d] bg-[#161b22]"
                >
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt="Organization"
                    width={32}
                    height={32}
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-[#30363d]">
              <nav className="flex overflow-x-auto">
                <Link
                  href="#"
                  className="flex items-center border-b-2 border-[#f78166] px-4 py-2 text-sm font-semibold text-[#c9d1d9]"
                >
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="me-2 fill-current"
                  >
                    <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"></path>
                  </svg>
                  Overview
                </Link>
                <Link
                  href="#"
                  className="flex items-center px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="me-2 fill-current"
                  >
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                  </svg>
                  Repositories
                  <span className="ms-2 rounded-full bg-[#30363d] px-2 py-0.5 text-xs">
                    27
                  </span>
                </Link>
                <Link
                  href="#"
                  className="flex items-center px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="me-2 fill-current"
                  >
                    <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM1.5 1.75v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25ZM11.75 3a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm-8.25.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0ZM8 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 3Z"></path>
                  </svg>
                  Projects
                </Link>
                <Link
                  href="#"
                  className="flex items-center px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="me-2 fill-current"
                  >
                    <path d="m8.878.392 5.25 3.045c.54.314.872.89.872 1.514v6.098a1.75 1.75 0 0 1-.872 1.514l-5.25 3.045a1.75 1.75 0 0 1-1.756 0l-5.25-3.045A1.75 1.75 0 0 1 1 11.049V4.951c0-.624.332-1.201.872-1.514L7.122.392a1.75 1.75 0 0 1 1.756 0ZM7.875 1.69l-4.63 2.685L8 7.133l4.755-2.758-4.63-2.685a.248.248 0 0 0-.25 0ZM2.5 5.677v5.372c0 .09.047.171.125.216l4.625 2.683V8.432Zm6.25 8.271 4.625-2.683a.25.25 0 0 0 .125-.216V5.677L8.75 8.432Z"></path>
                  </svg>
                  Packages
                </Link>
                <Link
                  href="#"
                  className="flex items-center px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-[#c9d1d9]"
                >
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="me-2 fill-current"
                  >
                    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                  </svg>
                  Stars
                </Link>
              </nav>
            </div>

            {/* Notification */}
            <div className="rounded-md border border-[#1f6feb] bg-[#161b22] p-4 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p>
                    You unlocked new Achievements with private contributions!
                    Show them off by including private contributions in your
                    Profile.
                  </p>
                  <p className="mt-1">
                    In{" "}
                    <a href="#" className="text-[#58a6ff] hover:underline">
                      settings
                    </a>
                    .
                  </p>
                </div>
                <button className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <svg
                    aria-hidden="true"
                    height="16"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="16"
                    className="fill-current"
                  >
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Pinned */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">Pinned</h2>
                <button className="text-xs text-[#8b949e] hover:text-[#58a6ff]">
                  Customize your pins
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Pinned Repo 1 */}
                <div className="rounded-md border border-[#30363d] p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center">
                      <svg
                        aria-hidden="true"
                        height="16"
                        viewBox="0 0 16 16"
                        version="1.1"
                        width="16"
                        className="me-2 fill-[#8b949e]"
                      >
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                      </svg>
                      <a
                        href="#"
                        className="font-semibold text-[#58a6ff] hover:underline"
                      >
                        DL-Python
                      </a>
                    </div>
                    <div className="flex items-center text-xs text-[#8b949e]">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      <span>Public</span>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-[#8b949e]">
                    Deep Learning Python Projects
                  </p>
                  <div className="flex items-center text-xs text-[#8b949e]">
                    <span className="me-3 flex items-center">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      Python
                    </span>
                    <span className="flex items-center">
                      <Star className="me-1 h-3 w-3" />1
                    </span>
                  </div>
                </div>

                {/* Pinned Repo 2 */}
                <div className="rounded-md border border-[#30363d] p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center">
                      <svg
                        aria-hidden="true"
                        height="16"
                        viewBox="0 0 16 16"
                        version="1.1"
                        width="16"
                        className="me-2 fill-[#8b949e]"
                      >
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                      </svg>
                      <a
                        href="#"
                        className="font-semibold text-[#58a6ff] hover:underline"
                      >
                        Machine-Learning
                      </a>
                    </div>
                    <div className="flex items-center text-xs text-[#8b949e]">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      <span>Public</span>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-[#8b949e]"></p>
                  <div className="flex items-center text-xs text-[#8b949e]">
                    <span className="me-3 flex items-center">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      Python
                    </span>
                    <span className="flex items-center">
                      <Star className="me-1 h-3 w-3" />2
                    </span>
                  </div>
                </div>

                {/* Pinned Repo 3 */}
                <div className="rounded-md border border-[#30363d] p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center">
                      <svg
                        aria-hidden="true"
                        height="16"
                        viewBox="0 0 16 16"
                        version="1.1"
                        width="16"
                        className="me-2 fill-[#8b949e]"
                      >
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                      </svg>
                      <a
                        href="#"
                        className="font-semibold text-[#58a6ff] hover:underline"
                      >
                        NLP-and-Speech
                      </a>
                    </div>
                    <div className="flex items-center text-xs text-[#8b949e]">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      <span>Public</span>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-[#8b949e]">
                    Code for various NLP and Speech Tasks
                  </p>
                  <div className="flex items-center text-xs text-[#8b949e]">
                    <span className="me-3 flex items-center">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      Python
                    </span>
                    <span className="flex items-center">
                      <Star className="me-1 h-3 w-3" />1
                    </span>
                  </div>
                </div>

                {/* Pinned Repo 4 */}
                <div className="rounded-md border border-[#30363d] p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center">
                      <svg
                        aria-hidden="true"
                        height="16"
                        viewBox="0 0 16 16"
                        version="1.1"
                        width="16"
                        className="me-2 fill-[#8b949e]"
                      >
                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                      </svg>
                      <a
                        href="#"
                        className="font-semibold text-[#58a6ff] hover:underline"
                      >
                        determine-algorithms-for-Rep-count
                      </a>
                    </div>
                    <div className="flex items-center text-xs text-[#8b949e]">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      <span>Public</span>
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-[#8b949e]"></p>
                  <div className="flex items-center text-xs text-[#8b949e]">
                    <span className="me-3 flex items-center">
                      <span className="me-1 h-3 w-3 rounded-full bg-[#3572a5]"></span>
                      Python
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution Activity */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  29 contributions in the last year
                </h2>
                <button className="text-xs text-[#8b949e] hover:text-[#58a6ff]">
                  Contribution settings
                </button>
              </div>

              {/* Contribution Graph */}
              <div className="mb-4 rounded-md border border-[#30363d] bg-[#161b22] p-4">
                <div className="grid grid-cols-53 gap-1">
                  {/* This is a simplified version of the contribution graph */}
                  {Array(53)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="grid grid-rows-7 gap-1">
                        {Array(7)
                          .fill(0)
                          .map((_, j) => {
                            // Randomly add some green squares to simulate contributions
                            const intensity =
                              Math.random() > 0.9
                                ? Math.floor(Math.random() * 4)
                                : 0
                            let bgColor = "#161b22"
                            if (intensity === 1) bgColor = "#0e4429"
                            if (intensity === 2) bgColor = "#006d32"
                            if (intensity === 3) bgColor = "#26a641"

                            return (
                              <div
                                key={j}
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: bgColor }}
                              ></div>
                            )
                          })}
                      </div>
                    ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#8b949e]">
                  <span>Learn how we count contributions</span>
                  <div className="flex items-center">
                    <span className="me-1">Less</span>
                    <div className="flex gap-1">
                      <div className="h-3 w-3 rounded-sm bg-[#161b22]"></div>
                      <div className="h-3 w-3 rounded-sm bg-[#0e4429]"></div>
                      <div className="h-3 w-3 rounded-sm bg-[#006d32]"></div>
                      <div className="h-3 w-3 rounded-sm bg-[#26a641]"></div>
                      <div className="h-3 w-3 rounded-sm bg-[#39d353]"></div>
                    </div>
                    <span className="ms-1">More</span>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <div className="border-b border-[#30363d] pb-4">
                  <h3 className="mb-2 text-sm font-semibold">March 2023</h3>
                  <div className="flex items-start gap-2">
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      className="mt-1 fill-[#8b949e]"
                    >
                      <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM13.75 8a5.25 5.25 0 1 0-10.5 0 5.25 5.25 0 0 0 10.5 0ZM9.75 8a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"></path>
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Created 21 commits in 2 repositories
                        </h4>
                        <button className="text-[#8b949e] hover:text-[#c9d1d9]">
                          <svg
                            aria-hidden="true"
                            height="16"
                            viewBox="0 0 16 16"
                            version="1.1"
                            width="16"
                            className="fill-current"
                          >
                            <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center">
                          <a
                            href="#"
                            className="me-2 text-sm font-semibold text-[#58a6ff] hover:underline"
                          >
                            chiragsingla177/Vector
                          </a>
                          <span className="rounded-full bg-[#238636] px-2 py-0.5 text-xs text-white">
                            20 commits
                          </span>
                        </div>
                        <div className="flex items-center">
                          <a
                            href="#"
                            className="me-2 text-sm font-semibold text-[#58a6ff] hover:underline"
                          >
                            chiragsingla177/MorphoU1
                          </a>
                          <span className="rounded-full bg-[#238636] px-2 py-0.5 text-xs text-white">
                            1 commit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#30363d] pb-4">
                  <div className="flex items-start gap-2">
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      className="mt-1 fill-[#8b949e]"
                    >
                      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Created 1 repository
                        </h4>
                        <div className="text-xs text-[#8b949e]">Mar 13</div>
                      </div>
                      <div className="mt-1 rounded-md border border-[#30363d] p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg
                              aria-hidden="true"
                              height="16"
                              viewBox="0 0 16 16"
                              version="1.1"
                              width="16"
                              className="me-2 fill-[#8b949e]"
                            >
                              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
                            </svg>
                            <a
                              href="#"
                              className="font-semibold text-[#58a6ff] hover:underline"
                            >
                              chiragsingla177/MorphoU1
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center rounded-full bg-[#30363d] px-2 py-0.5 text-xs text-[#8b949e]">
                              <span className="me-1 h-2 w-2 rounded-full bg-[#da5b0b]"></span>
                              Public
                            </span>
                            <span className="flex items-center rounded-full bg-[#30363d] px-2 py-0.5 text-xs text-[#8b949e]">
                              <span className="me-1 h-2 w-2 rounded-full bg-[#3572a5]"></span>
                              Python
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[#30363d] pb-4">
                  <div className="flex items-start gap-2">
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      className="mt-1 fill-[#8b949e]"
                    >
                      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Opened 2 pull requests in 1 repository
                        </h4>
                        <button className="text-[#8b949e] hover:text-[#c9d1d9]">
                          <svg
                            aria-hidden="true"
                            height="16"
                            viewBox="0 0 16 16"
                            version="1.1"
                            width="16"
                            className="fill-current"
                          >
                            <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <a
                              href="#"
                              className="text-sm font-semibold text-[#58a6ff] hover:underline"
                            >
                              chiragsingla177/Vector
                            </a>
                          </div>
                          <div className="text-xs text-[#8b949e]">Mar 17</div>
                        </div>
                        <div className="rounded-md border border-[#30363d] p-2">
                          <div className="flex items-center">
                            <div className="me-2 h-5 w-5 rounded-full bg-[#8957e5]">
                              <div className="flex h-full w-full items-center justify-center text-xs text-white">
                                <GitFork className="h-3 w-3" />
                              </div>
                            </div>
                            <div>
                              <a
                                href="#"
                                className="text-sm font-semibold text-[#58a6ff] hover:underline"
                              >
                                Staging
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-md border border-[#30363d] p-2">
                          <div className="flex items-center">
                            <div className="me-2 h-5 w-5 rounded-full bg-[#8957e5]">
                              <div className="flex h-full w-full items-center justify-center text-xs text-white">
                                <GitFork className="h-3 w-3" />
                              </div>
                            </div>
                            <div>
                              <a
                                href="#"
                                className="text-sm font-semibold text-[#58a6ff] hover:underline"
                              >
                                Mongo
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-4">
                  <div className="flex items-start gap-2">
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      className="mt-1 fill-[#8b949e]"
                    >
                      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                    </svg>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Opened their first issue on GitHub in
                          BuilderIO/figma-html
                        </h4>
                        <div className="flex items-center">
                          <span className="me-2 rounded-full bg-[#30363d] px-2 py-0.5 text-xs text-[#8b949e]">
                            Public
                          </span>
                          <div className="text-xs text-[#8b949e]">Mar 15</div>
                        </div>
                      </div>
                      <div className="mt-2 rounded-md border border-[#30363d] p-4">
                        <div className="flex justify-center">
                          <Image
                            src="/placeholder.svg?height=150&width=150"
                            alt="Issue illustration"
                            width={150}
                            height={150}
                            className="mb-2"
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-[#58a6ff]">
                            First Issue
                          </div>
                          <p className="mt-1 text-xs text-[#8b949e]">
                            When importing JSON Files, Layers not structured in
                            Frames
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button className="rounded-md border border-[#30363d] bg-[#21262d] px-4 py-1.5 text-sm font-semibold text-[#c9d1d9] hover:bg-[#30363d]">
                  Show more activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#30363d] bg-[#0d1117] py-10 text-xs text-[#8b949e]">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center gap-2">
              <svg
                height="24"
                aria-hidden="true"
                viewBox="0 0 16 16"
                version="1.1"
                width="24"
                className="fill-[#8b949e]"
              >
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              <span>© 2023 GitHub, Inc.</span>
            </div>
            <nav>
              <ul className="flex flex-wrap justify-center gap-4">
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Contact GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c9d1d9] hover:underline">
                    About
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
