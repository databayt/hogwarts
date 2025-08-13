import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/connectDB";
// import { auth } from "@/lib/auth";
// import InvoiceModel, { IInvoice } from "@/models/invoice.model";
// import moment from 'moment'
// import { currencyOption, TCurrencyKey } from "@/lib/utils";

// export async function GET() {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({
//         message: "Unauthorized access",
//       });
//     }

//     await connectDB();

//     const thirdayAgeo = new Date();
//     thirdayAgeo.setDate(thirdayAgeo.getDate() - 30);

//     const query = {
//         invoice_date: {
//           $gte: thirdayAgeo,
//         },
//         userId : session.user.id
//       }

//     const [data,totalInvoice,paidInvoice,UnpaidInvoice,recentInvoice] = await Promise.all([
//       InvoiceModel.find(query),
//       InvoiceModel.countDocuments(query),
//       InvoiceModel.countDocuments({...query, status : "PAID"}),
//       InvoiceModel.countDocuments({...query, status : "UNPAID"}),
//       InvoiceModel.find(query).limit(5),
//     ]);
//     const totalRevenue = data.reduce((preve, curr) => preve + curr.total, 0);

//     const chartData = data.map((item : IInvoice)=>{
//         return{
//             date : moment(item.invoice_date).format("YYYY-MM-DD"),
//             totalRevenue : item.total,
//             paidRevenue : item.status === "PAID" ? item.total : 0
//         }
//     })
//     // console.log("dashboard api")
//     // console.log("data",data)
//     return NextResponse.json({
//         message : "Success",
//         totalRevenue : `${currencyOption[session.user.currency as TCurrencyKey]}${totalRevenue}`,
//         totalInvoice,
//         paidInvoice,
//         UnpaidInvoice,
//         recentInvoice,
//         chartData,
//     })
 
//   } catch (error: any) {
//     console.log(error)
//     return NextResponse.json({
//       message: error || error.message || "Something went wrong",
//     },{
//         status : 500
//     });
//   }
// }
