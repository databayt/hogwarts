"use client"

import { GitBranch, GitCommit, AlertCircle, GitFork, FileCode, Folder, AlertTriangle, GitPullRequest, School } from "lucide-react";
// import { Commit, Repo, Issue, PullRequest, Madrsa } from "@/components/atom/icon"; // Commented out - icon component doesn't exist
import Link from "next/link";

// Temporary replacements for icon components
const Commit = FileCode;
const Repo = Folder;
const Issue = AlertTriangle;
const PullRequest = GitPullRequest;
const Madrsa = School;

const repoData = [
  { name: "تقنية/أتمتة", commits: 44, color: "bg-green-600", width: "80%" },
  { name: "تقنية/دليل", commits: 18, color: "bg-green-300", width: "35%" },
  { name: "تقنية/بولكشين", commits: 17, color: "bg-green-300", width: "30%" },
];

const reposCreated = [
  { name: "تقنية/دليل", icon: <Madrsa />, lang: "تايب سكريبت", langColor: "bg-blue-600", date: "١٧ ديسمبر" },
  { name: "تقنية/بولكشين", icon: <Madrsa />, lang: "سي", langColor: "bg-gray-700", date: "١٣ ديسمبر" },
];

const issues = [
  { repo: "تقنية/أتمتة", title: "إضافة Vitest لاختبار الوحدات/المكونات", status: "open", date: "١٤ ديسمبر" },
];

const pullRequests = [
  { repo: "تقنية/أتمتة", title: "إضافة ميزة جديدة للبحث", status: "مفتوح", date: "١٢ ديسمبر" },
  { repo: "تقنية/دليل", title: "تحديث التوثيق", status: "مغلق", date: "١٠ ديسمبر" },
];

// function DotMenu() {
//   return (
//     <button className="text-gray-400 hover:text-gray-600">
//       <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="3.5" r="1.5" fill="currentColor"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="14.5" r="1.5" fill="currentColor"/></svg>
//     </button>
//   );
// }

export default function GitHubTimeline() {
  return (
    <div className="relative bg-transparent ml-5" dir="rtl">
      <div className="px-2 pt-2 pb-8">
        <div className="flex items-center mb-2">
         
          <span className="text-gray-400 mx-1">2024</span>
          <div className="flex-1 mb-4 border-gray-200 mx-2" />
        </div>
        {/* Timeline vertical line */}
        <div className="absolute right-[25px] top-10 bottom-0 w-px bg-gray-200 z-0" />
        <div className="space-y-12 mt-4 relative z-10">
          {/* Commits event */}
          <div className="flex items-start relative group">
            {/* Icon on timeline */}
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Commit className="w-4 h-4" />
              </div>
            </div>
            {/* Content */}
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
                <h6 className="text-sm font-medium text-right mt-2 ">أنشأ ٧٩ تعديلاً في ٣ مستودعات</h6>
               
              </div>
              <div className="mt-2 space-y-1">
                {repoData.map((repo) => (
                  <div key={repo.name} className="flex items-center gap-2 text-sm">
                    <Link href="#" className="text-muted-foreground hover:text-blue-600 hover:underline font-medium">{repo.name}</Link>
                    <span className="text-gray-500">{repo.commits} تعديل</span>
                    <div className="flex-1 flex justify-end">
                      <div className="w-32 bg-gray-100 rounded-full h-2 ml-2 hidden md:block">
                        <div className={`${repo.color} h-2 rounded-full`} style={{ width: repo.width }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Created repositories event */}
          <div className="flex items-start relative group">
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Repo className="w-4 h-4 text-[#8B949E]" />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-right mt-2 "  >أنشأ مستودعين</h6>
                
              </div>
              <div className="mt-2 space-y-1">
                {reposCreated.map((repo) => (
                  <div key={repo.name} className="flex items-center gap-2 text-sm">
                    <Link href="#" className="text-muted-foreground hover:text-blue-600 hover:underline font-medium">{repo.name}</Link>
                    <span className={`flex items-center gap-1 ml-2`}>
                      <span className={`w-3 h-3 rounded-full ${repo.langColor}`}></span>
                      <span className="text-gray-500">{repo.lang}</span>
                    </span>
                    <span className="text-gray-400 ml-auto text-xs">{repo.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Issues event */}
          <div className="flex items-start relative group">
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Issue className="w-4 h-4" />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-right mt-2 " >فتح مشكلتين في مستودع واحد</h6>
                
              </div>
              <div className="mt-2 space-y-1">
                {issues.map((issue) => (
                  <div key={issue.title} className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
                    <div className="flex items-center gap-2">
                    <Link href="#" className="text-muted-foreground hover:text-blue-600 hover:underline font-medium">{issue.repo}</Link>
                    <span className="bg-green-100 text-green-700 border border-green-300 rounded-full px-2 py-0.5 text-xs font-bold ml-2">٢ مفتوحة</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{issue.title}</span>
                    <span className="text-gray-400 ml-auto text-xs">{issue.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Pull Requests event */}
          <div className="flex items-start relative group">
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <PullRequest />
              </div>
            </div>
            <div className="mr-4 flex-1">
              <div className="flex items-center justify-between">
              <h6 className="text-sm font-medium text-right mt-2 " >طلبات دمج</h6>
                
              </div>
              <div className="mt-2 space-y-1">
                {pullRequests.map((pr, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 text-sm ">
                    <div className="flex items-center gap-2">
                    <Link href="#" className="text-muted-foreground hover:text-blue-600 hover:underline font-medium">{pr.repo}</Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ml-2 ${pr.status === 'مفتوح' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-500 border border-gray-300'}`}>{pr.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{pr.title}</span>
                    <span className="text-gray-400 ml-auto text-xs">{pr.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

