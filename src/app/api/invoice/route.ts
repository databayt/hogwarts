/**
 * Invoice API - Stub Endpoint
 *
 * Currently returns { ok: true } as a placeholder.
 *
 * HISTORICAL NOTE:
 * Previously connected to MongoDB for invoice CRUD.
 * Migration to Prisma/PostgreSQL made this obsolete.
 * Legacy code preserved in comments for reference.
 *
 * INTENDED FUNCTIONALITY:
 * - GET: List all invoices with pagination
 * - POST: Create new invoice
 * - PUT: Update existing invoice
 *
 * WHY KEEP THIS STUB:
 * - Prevents 404 if client code still calls it
 * - Documents intended endpoints
 * - Easy to reactivate with Prisma queries
 *
 * TODO: Implement with Prisma Invoice model or remove if unused
 * @see /components/school-dashboard/finance/invoice for current implementation
 */

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST() {
  return NextResponse.json({ ok: true })
}

export async function PUT() {
  return NextResponse.json({ ok: true })
}
// import { NextRequest, NextResponse } from "next/server";
// import InvoiceModel from "@/models/invoice.model";
// import { connectDB } from "@/lib/connectDB";
// import { auth } from "@/lib/auth";

// //create api
// export async function POST(request : NextRequest){
//     try {
//         const session = await auth()

//         if(!session){
//             return NextResponse.json({
//                 message : "Unauthorized access"
//             },{
//                 status : 401
//             })
//         }

//         const {
//             invoice_no,
//             invoice_date,
//             due_date,
//             currency,
//             from,
//             to,
//             items,
//             sub_total,
//             discount,
//             tax_percentage,
//             total,
//             notes
//         }  = await request.json()

//         const payload  = {
//             invoice_no,
//             invoice_date,
//             due_date,
//             currency : currency ?? "USD" ,
//             from,
//             to,
//             items,
//             sub_total,
//             discount,
//             tax_percentage,
//             total,
//             notes,
//             status : "UNPAID",
//             userId :  session.user.id,
//         }

//         await connectDB()

//         const data = await InvoiceModel.create(payload)

//         return NextResponse.json({
//             message : "Invoice created successfully",
//             data : data
//         })

//     } catch (error : any) {
//         return NextResponse.json({
//             message : error || error?.message || "Something went wrong"
//         },{
//             status : 500
//         })
//     }
// }

// //get all invoice
// export async function GET(request : NextRequest){
//     try {
//         const session = await auth()

//         if(!session){
//             return NextResponse.json({
//                 message : "Unauthorized access"
//             },{
//                 status : 401
//             })
//         }

//         await connectDB()

//         const { searchParams } = new URL(request.url)
//         const page = parseInt(searchParams.get('page') || '1')
//         const invoiceId = searchParams.get("invoiceId")

//         //limit count
//         const limit = 5

//         const skip = (page - 1) * limit

//         const query = {
//             ...(invoiceId && { _id : invoiceId }),
//             userId : session.user.id
//         }

//         const [allInvoice,totalCount] = await Promise.all([
//             InvoiceModel.find(query).skip(skip).limit(limit).sort({ createdAt : -1}),
//             InvoiceModel.countDocuments(query)
//         ])

//         // const allInvoice = await InvoiceModel.find({ userId : session.user.id }).skip(skip).limit(limit)

//         const totalPage = Math.ceil(totalCount/limit)

//         return NextResponse.json({
//             message : "Success",
//             data : allInvoice,
//             totalCount,
//             totalPage,
//             page,
//         })
//     } catch (error : any) {
//         return NextResponse.json({
//             message : error || error.message || "Something went wrong"
//         })
//     }
// }

// //update invoice
// export async function PUT(request : NextRequest){
//     try {
//         const session = await auth()

//         if(!session){
//             return NextResponse.json({
//                 message : "Unauthorized access"
//             },{
//                 status : 401
//             })
//         }

//         const {
//             invoice_no,
//             invoice_date,
//             due_date,
//             currency,
//             from,
//             to,
//             items,
//             sub_total,
//             discount,
//             tax_percentage,
//             total,
//             notes,
//             status,
//             invoiceId,
//         }  = await request.json()

//         const payload = {
//             invoice_no,
//             invoice_date,
//             due_date,
//             currency,
//             from,
//             to,
//             items,
//             sub_total,
//             discount,
//             tax_percentage,
//             total,
//             notes,
//             status,
//         }

//         await connectDB()

//         const updateInvoice = await InvoiceModel.findByIdAndUpdate(invoiceId,payload)

//         return NextResponse.json({
//             message : "Invoice updated successfully"
//         })

//     } catch (error : any) {
//         return NextResponse.json({
//             message : error || error.message || "Something went wrong"
//         },{
//             status : 500
//         })
//     }
// }
