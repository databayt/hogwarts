import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true });
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
