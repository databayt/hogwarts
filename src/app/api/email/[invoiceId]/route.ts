// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Deprecated invoice email endpoint — orphaned since the MongoDB → Prisma
 * migration. Email delivery of the payment receipt is scoped for P2.4
 * (parent receipt with school logo + signature, sent via Resend on
 * webhook success).
 *
 * Returns 410 Gone so callers fail loudly instead of silently consuming
 * the placeholder JSON.
 */
import { NextResponse } from "next/server"

export function POST() {
  return NextResponse.json(
    {
      success: false,
      errorCode: "ENDPOINT_DEPRECATED",
      message:
        "This endpoint is deprecated. Invoice email delivery is scheduled for P2.4.",
    },
    { status: 410 }
  )
}
// import { auth } from "@/auth";
// import { sendEmail } from "@/components/invoice/email.config";
// import { currencyOption, TCurrencyKey } from "@/lib/utils";
// import InvoiceModel, { IInvoice } from "@/models/invoice.model";
// import { format } from "date-fns";
// import { NextResponse, NextRequest } from "next/server";
// import { InvoiceTemplate } from "../../../../components/template/SendInvoiceEmail";

// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ invoiceId: string; userId: string }> }
// ) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({
//         message: "Unauthorized access",
//       });
//     }

//     const { invoiceId } = await params;
//     const { subject } = await request.json();

//     await connectDB();

//     const invoiceData: IInvoice | null = await InvoiceModel.findById(invoiceId);

//     if (!invoiceData) {
//       return NextResponse.json({
//         message: "No invoice found",
//       });
//     }

//     const invoiceURL = `${process.env.DOMAIN}/api/invoice/${session.user.id}/${invoiceId}`

//     const emailResponse = await sendEmail(
//       invoiceData.to.email,
//       subject,
//       InvoiceTemplate({
//         firstName : session.user.firstName,
//         invoiceNo : invoiceData.invoice_no,
//         dueDate : format(invoiceData.due_date,"PPP"),
//         total : `${currencyOption[invoiceData.currency as TCurrencyKey ]} ${invoiceData.total}`,
//         invoiceURL :invoiceURL ,
//       })
//     );

//     return NextResponse.json({
//         message : "Email send successfully",
//         data : emailResponse
//     })

//   } catch (error: any) {
//     return NextResponse.json({
//       message: error || error.message || "Something went wrong",
//     });
//   }
// }
