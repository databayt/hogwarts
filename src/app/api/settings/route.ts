/**
 * Settings API - Stub Endpoint
 *
 * Currently returns { ok: true } as a placeholder.
 *
 * HISTORICAL NOTE:
 * Previously connected to MongoDB for user settings.
 * Migration to Prisma made this obsolete.
 * Legacy code preserved in comments for reference.
 *
 * INTENDED FUNCTIONALITY:
 * - GET: Retrieve user settings
 * - POST: Create/update settings
 *
 * SETTINGS STORED:
 * - invoiceLogo: Custom logo for invoices
 * - signature: Digital signature image
 *
 * TODO: Implement with Prisma or remove if unused
 * @see School model for current school-level settings
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/connectDB";
// import SettingModel from "@/models/Settings.model";
// import { auth } from "@/lib/auth";

// //create and update
// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json(
//         {
//           message: "Unauthorized access",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const { logo, signature } = await request.json();

//     await connectDB();

//     const setting = await SettingModel.findOne({ userId: session.user.id });

//     const payload = {
//       userId: session.user.id,
//       ...(logo && { invoiceLogo: logo }),
//       ...(signature && { signature: signature }),
//     };

//     //update the document
//     if (setting) {
//       const updateSetting = await SettingModel.findByIdAndUpdate(
//         setting._id,
//         payload
//       );

//       return NextResponse.json({
//         message: "Setting updated successfully",
//       });
//     }

//     //create the document
//     const createSetting = await SettingModel.create(payload);

//     return NextResponse.json({
//       message: "Setting updated successfully",
//     });
//   } catch (error: any) {
//     return NextResponse.json(
//       {
//         message: error || error?.message || "Something went wrong",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// //get
// export async function GET(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json(
//         {
//           message: "Unauthorized access",
//         },
//         {
//           status: 401,
//         }
//       );
//     }

//     const getData = await SettingModel.findOne({ userId : session.user.id })

//     return NextResponse.json({
//         message : "Success",
//         data : getData
//     })
//   } catch (error : any) {
//     return NextResponse.json({
//         message : error || error?.message || "Something went wrong"
//     })
//   }
// }
