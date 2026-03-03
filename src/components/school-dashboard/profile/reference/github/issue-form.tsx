// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { X } from "lucide-react";

// const predefinedLabels = [
//   { name: "bug", color: "bg-red-100 text-red-800 border-red-200" },
//   { name: "enhancement", color: "bg-blue-100 text-blue-800 border-blue-200" },
//   { name: "documentation", color: "bg-gray-100 text-gray-800 border-gray-200" },
//   { name: "help wanted", color: "bg-green-100 text-green-800 border-green-200" },
//   { name: "ui", color: "bg-purple-100 text-purple-800 border-purple-200" },
//   { name: "mobile", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
//   { name: "security", color: "bg-orange-100 text-orange-800 border-orange-200" }
// ];

// const NewIssueForm = ({ onSubmit, onCancel }) => {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [selectedLabels, setSelectedLabels] = useState([]);

//   const handleLabelToggle = (labelName) => {
//     if (selectedLabels.includes(labelName)) {
//       setSelectedLabels(selectedLabels.filter(l => l !== labelName));
//     } else {
//       setSelectedLabels([...selectedLabels, labelName]);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!title.trim()) return;

//     onSubmit({
//       title,
//       description,
//       labels: selectedLabels
//     });

//     // Reset form
//     setTitle("");
//     setDescription("");
//     setSelectedLabels([]);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md border border-gray-200">
//       <div className="space-y-2">
//         <Label htmlFor="title" className="text-base font-medium">Issue title</Label>
//         <Input
//           id="title"
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           required
//           className="text-base"
//         />
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor="description" className="text-base font-medium">Description</Label>
//         <Textarea
//           id="description"
//           placeholder="Add a description..."
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           rows={6}
//           className="resize-y min-h-[150px] text-base"
//         />
//         <p className="text-sm text-gray-500">
//           Tip: You can use markdown formatting to add headings, lists, code blocks, and more.
//         </p>
//       </div>

//       <div className="space-y-2">
//         <Label className="text-base font-medium">Labels</Label>
//         <div className="flex flex-wrap gap-2 mt-2">
//           {predefinedLabels.map(label => (
//             <Badge
//               key={label.name}
//               variant="outline"
//               className={`${label.color} cursor-pointer ${
//                 selectedLabels.includes(label.name) ? 'ring-2 ring-offset-1 ring-blue-500' : ''
//               } hover:bg-opacity-80`}
//               onClick={() => handleLabelToggle(label.name)}
//             >
//               {label.name}
//               {selectedLabels.includes(label.name) && (
//                 <X className="ms-1 h-3 w-3" />
//               )}
//             </Badge>
//           ))}
//         </div>
//       </div>

//       <div className="flex justify-end gap-3 pt-4">
//         <Button type="button" variant="outline" onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={!title.trim()}>
//           Submit new issue
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default NewIssueForm;
