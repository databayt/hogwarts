// import { useState } from "react";
// import IssueList from "./issue-list";
// import NewIssueForm from "./new-issue-form";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { PlusIcon } from "lucide-react";

// // Mock data for initial issues
// const initialIssues = [
//   {
//     id: 1,
//     title: "Bug: Navigation breaks on mobile view",
//     description: "When viewing the app on mobile devices, the navigation menu doesn't collapse properly.",
//     status: "open",
//     labels: ["bug", "mobile"],
//     createdAt: "2025-05-10T10:30:00Z",
//     createdBy: "sarah-dev"
//   },
//   {
//     id: 2,
//     title: "Feature request: Dark mode support",
//     description: "It would be great to have a dark mode option for better viewing at night.",
//     status: "open",
//     labels: ["enhancement", "ui"],
//     createdAt: "2025-05-09T14:20:00Z",
//     createdBy: "alex-designer"
//   },
//   {
//     id: 3,
//     title: "Documentation needs updating for API v2",
//     description: "The current docs still reference the v1 API endpoints which are deprecated.",
//     status: "closed",
//     labels: ["documentation"],
//     createdAt: "2025-05-05T09:15:00Z",
//     createdBy: "mark-writer"
//   }
// ];

// const Index = () => {
//   const [issues, setIssues] = useState(initialIssues);
//   const [activeTab, setActiveTab] = useState("issues");

//   const addNewIssue = (issue) => {
//     const newIssue = {
//       id: issues.length + 1,
//       createdAt: new Date().toISOString(),
//       createdBy: "current-user",
//       status: "open",
//       ...issue
//     };

//     setIssues([newIssue, ...issues]);
//     setActiveTab("issues");
//   };

//   const toggleIssueStatus = (id) => {
//     setIssues(issues.map(issue =>
//       issue.id === id
//         ? { ...issue, status: issue.status === "open" ? "closed" : "open" }
//         : issue
//     ));
//   };

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-5xl">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Issues</h1>
//         {activeTab === "issues" && (
//           <Button onClick={() => setActiveTab("new")} className="bg-green-600 hover:bg-green-700">
//             <PlusIcon className="mr-2 h-4 w-4" />
//             New Issue
//           </Button>
//         )}
//       </div>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="mb-6">
//           <TabsTrigger value="issues" className="flex items-center">
//             Issues
//             <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
//               {issues.filter(issue => issue.status === "open").length}
//             </span>
//           </TabsTrigger>
//           {activeTab === "new" && <TabsTrigger value="new">New Issue</TabsTrigger>}
//         </TabsList>

//         <TabsContent value="issues" className="mt-0">
//           <IssueList issues={issues} toggleStatus={toggleIssueStatus} />
//         </TabsContent>

//         <TabsContent value="new" className="mt-0">
//           <NewIssueForm onSubmit={addNewIssue} onCancel={() => setActiveTab("issues")} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default Index;
