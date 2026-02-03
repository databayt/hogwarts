"use client"

// import { Commit, Repo, Issue, PullRequest, Madrsa } from "@/components/atom/icon"; // Commented out - icon component doesn't exist
import Link from "next/link"
import {
  CircleAlert,
  FileCode,
  Folder,
  GitBranch,
  GitCommit,
  GitFork,
  GitPullRequest,
  School,
  TriangleAlert,
} from "lucide-react"

// Temporary replacements for icon components
const Commit = FileCode
const Repo = Folder
const Issue = TriangleAlert
const PullRequest = GitPullRequest
const Madrsa = School

const repoData = [
  { name: "تقنية/أتمتة", commits: 44, color: "bg-green-600", width: "80%" },
  { name: "تقنية/دليل", commits: 18, color: "bg-green-300", width: "35%" },
  { name: "تقنية/بولكشين", commits: 17, color: "bg-green-300", width: "30%" },
]

const reposCreated = [
  {
    name: "تقنية/دليل",
    icon: <Madrsa />,
    lang: "تايب سكريبت",
    langColor: "bg-blue-600",
    date: "١٧ ديسمبر",
  },
  {
    name: "تقنية/بولكشين",
    icon: <Madrsa />,
    lang: "سي",
    langColor: "bg-gray-700",
    date: "١٣ ديسمبر",
  },
]

const issues = [
  {
    repo: "تقنية/أتمتة",
    title: "إضافة Vitest لاختبار الوحدات/المكونات",
    status: "open",
    date: "١٤ ديسمبر",
  },
]

const pullRequests = [
  {
    repo: "تقنية/أتمتة",
    title: "إضافة ميزة جديدة للبحث",
    status: "مفتوح",
    date: "١٢ ديسمبر",
  },
  {
    repo: "تقنية/دليل",
    title: "تحديث التوثيق",
    status: "مغلق",
    date: "١٠ ديسمبر",
  },
]

// function DotMenu() {
//   return (
//     <button className="text-gray-400 hover:text-gray-600">
//       <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="3.5" r="1.5" fill="currentColor"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="14.5" r="1.5" fill="currentColor"/></svg>
//     </button>
//   );
// }

export default function GitHubTimeline() {
  return (
    <div className="relative ml-5 bg-transparent" dir="rtl">
      <div className="px-2 pt-2 pb-8">
        <div className="mb-2 flex items-center">
          <span className="mx-1 text-gray-400">2024</span>
          <div className="mx-2 mb-4 flex-1 border-gray-200" />
        </div>
        {/* Timeline vertical line */}
        <div className="absolute top-10 right-[25px] bottom-0 z-0 w-px bg-gray-200" />
        <div className="relative z-10 mt-4 space-y-12">
          {/* Commits event */}
          <div className="group relative flex items-start">
            {/* Icon on timeline */}
            <div className="relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                <Commit className="h-4 w-4" />
              </div>
            </div>
            {/* Content */}
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
                <h6 className="mt-2 text-right text-sm font-medium">
                  أنشأ ٧٩ تعديلاً في ٣ مستودعات
                </h6>
              </div>
              <div className="mt-2 space-y-1">
                {repoData.map((repo) => (
                  <div
                    key={repo.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Link
                      href="#"
                      className="text-muted-foreground font-medium hover:text-blue-600 hover:underline"
                    >
                      {repo.name}
                    </Link>
                    <span className="text-gray-500">{repo.commits} تعديل</span>
                    <div className="flex flex-1 justify-end">
                      <div className="ml-2 hidden h-2 w-32 rounded-full bg-gray-100 md:block">
                        <div
                          className={`${repo.color} h-2 rounded-full`}
                          style={{ width: repo.width }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Created repositories event */}
          <div className="group relative flex items-start">
            <div className="relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                <Repo className="h-4 w-4 text-[#8B949E]" />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
                <h6 className="mt-2 text-right text-sm font-medium">
                  أنشأ مستودعين
                </h6>
              </div>
              <div className="mt-2 space-y-1">
                {reposCreated.map((repo) => (
                  <div
                    key={repo.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Link
                      href="#"
                      className="text-muted-foreground font-medium hover:text-blue-600 hover:underline"
                    >
                      {repo.name}
                    </Link>
                    <span className={`ml-2 flex items-center gap-1`}>
                      <span
                        className={`h-3 w-3 rounded-full ${repo.langColor}`}
                      ></span>
                      <span className="text-gray-500">{repo.lang}</span>
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {repo.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Issues event */}
          <div className="group relative flex items-start">
            <div className="relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                <Issue className="h-4 w-4" />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
                <h6 className="mt-2 text-right text-sm font-medium">
                  فتح مشكلتين في مستودع واحد
                </h6>
              </div>
              <div className="mt-2 space-y-1">
                {issues.map((issue) => (
                  <div
                    key={issue.title}
                    className="flex flex-col gap-2 text-sm md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href="#"
                        className="text-muted-foreground font-medium hover:text-blue-600 hover:underline"
                      >
                        {issue.repo}
                      </Link>
                      <span className="ml-2 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                        ٢ مفتوحة
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {issue.title}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {issue.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Pull Requests event */}
          <div className="group relative flex items-start">
            <div className="relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                <PullRequest />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
                <h6 className="mt-2 text-right text-sm font-medium">
                  طلبات دمج
                </h6>
              </div>
              <div className="mt-2 space-y-1">
                {pullRequests.map((pr, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 text-sm md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href="#"
                        className="text-muted-foreground font-medium hover:text-blue-600 hover:underline"
                      >
                        {pr.repo}
                      </Link>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${pr.status === "مفتوح" ? "border border-green-300 bg-green-100 text-green-700" : "border border-gray-300 bg-gray-100 text-gray-500"}`}
                      >
                        {pr.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {pr.title}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {pr.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
