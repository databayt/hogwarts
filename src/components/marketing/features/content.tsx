// import Link from "next/link"
// import { features } from "./constants"

// export default function AllFeatures() {
//   return (
//     <div className="grid grid-cols-1 gap-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//       {features.map((feature) => (
//         <Link
//           key={feature.id}
//           href="#"
//           className="relative overflow-hidden rounded-lg border bg-background p-2 hover:border-primary transition-[border-color] duration-200 text-foreground hover:text-foreground"
//         >
//           <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
//             {/* <div className="w-fit  p-2"> */}
//             <div className="text-foreground">
//               {feature.icon}
//             </div>
//             {/* </div> */}
//             <div className="space-y-2">
//               <h4 className="text-foreground">
//                 {feature.title}
//               </h4>
//               <p className="text-sm text-muted-foreground font-light">
//                 {feature.description}
//               </p>
//             </div>
//           </div>
//         </Link>
//       ))}
//     </div>
//   )
// }
