// import { useState } from "react";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Separator } from "@/components/ui/separator";
// import { SearchIcon } from "lucide-react";

// const IssueList = ({ issues, toggleStatus }) => {
//   const [searchText, setSearchText] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   const filteredIssues = issues.filter(issue => {
//     const matchesSearch = issue.title.toLowerCase().includes(searchText.toLowerCase());
//     const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   });

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return new Intl.DateTimeFormat('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     }).format(date);
//   };

//   return (
//     <div className="w-full">
//       <div className="flex flex-col md:flex-row gap-4 mb-6">
//         <div className="relative flex-1">
//           <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <Input
//             placeholder="Search issues..."
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             className="ps-10 bg-white"
//           />
//         </div>
//         <Select value={filterStatus} onValueChange={setFilterStatus}>
//           <SelectTrigger className="w-full md:w-[180px]">
//             <SelectValue placeholder="Filter by status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Issues</SelectItem>
//             <SelectItem value="open">Open</SelectItem>
//             <SelectItem value="closed">Closed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {filteredIssues.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-md">
//           <h3 className="text-xl font-medium text-gray-700 mb-2">No issues found</h3>
//           <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
//         </div>
//       ) : (
//         <div className="rounded-md border border-gray-200 overflow-hidden">
//           {filteredIssues.map((issue, index) => (
//             <div key={issue.id}>
//               {index > 0 && <Separator />}
//               <div className="p-4 bg-white hover:bg-gray-50">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start">
//                     <div className={`mt-1 me-3 w-5 h-5 rounded-full flex items-center justify-center ${
//                       issue.status === "open" ? "text-green-600 border-2 border-green-600" : "bg-purple-600 text-white"
//                     }`}>
//                       {issue.status === "open" ? (
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                           <circle cx="12" cy="12" r="10" />
//                         </svg>
//                       ) : (
//                         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                           <path d="M18 6L6 18" />
//                           <path d="M6 6L18 18" />
//                         </svg>
//                       )}
//                     </div>
//                     <div>
//                       <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
//                         {issue.title}
//                       </h3>
//                       <p className="text-sm text-gray-500 mt-1">
//                         #{issue.id} opened on {formatDate(issue.createdAt)} by {issue.createdBy}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {issue.labels.map(label => (
//                       <Badge key={label} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
//                         {label}
//                       </Badge>
//                     ))}
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="ms-2"
//                       onClick={() => toggleStatus(issue.id)}
//                     >
//                       {issue.status === "open" ? "Close" : "Reopen"}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default IssueList;
