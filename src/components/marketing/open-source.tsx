// import React from 'react'
// import Contributors from './contributors'
// import Link from 'next/link'
// import { siteConfig } from '@/config/site'
// import SectionHeading from '@/components/atom/section-heading'

// const OpenSource = () => {
//   return (
//     <div className="">
//       <SectionHeading
//         title="Proudly Open Source"
//         description={
//           <>
//             Databayt is open source and powered by open source software. <br />{" "}
//             The code is available on{" "}
//             <Link
//               href={siteConfig.links.github}
//               target="_blank"
//               rel="noreferrer"
//               className="underline underline-offset-4 text-foreground/70 hover:text-foreground"
//             >
//               GitHub
//             </Link>
//             .{" "}
//           </>
//         }
//         className="py-14"
//       >
//         <div className="flex flex-col items-center">
//           <div className="flex h-10 items-center rounded-md border border-muted bg-muted px-4 font-medium">
//             Contributors
//           </div>
//           <div className="h-4 w-4 border-x-8 border-t-8 border-b-0 border-solid border-muted border-x-transparent"></div>
//         </div>
//         <Contributors />
//       </SectionHeading>
//     </div>
//   )
// }

// export default OpenSource