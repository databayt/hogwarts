/**
 * Invoice PDF Generation API - Stub Endpoint
 *
 * Currently returns { ok: true } as a placeholder.
 *
 * HISTORICAL NOTE:
 * Previously generated PDF invoices using jsPDF.
 * Migration to Prisma broke the MongoDB connection.
 * Legacy code preserved in comments for reference.
 *
 * INTENDED FUNCTIONALITY:
 * - Generate PDF from invoice data
 * - Include company logo and signature
 * - Return as inline PDF (viewable in browser)
 *
 * PDF STRUCTURE (from legacy):
 * - Header: Logo + "INVOICE" title
 * - Company details (from user)
 * - Bill To (client details)
 * - Items table with quantity/price/total
 * - Subtotal, discount, tax calculation
 * - Digital signature
 * - Notes section
 *
 * TODO: Implement with Prisma + jsPDF or
 * use a PDF service like Puppeteer/React-PDF
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/connectDB";
// import { jsPDF } from "jspdf";
// import SettingModel, { ISettings } from "@/models/Settings.model";
// import InvoiceModel, { IInvoice } from "@/models/invoice.model";
// import { format } from "date-fns";
// import currencyFormat from "@/lib/CurrencyFormate";
// import { currencyOption, TCurrencyKey } from "@/lib/utils";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ invoiceId: string; userId: string }> }
// ) {
//   try {
//     const { userId, invoiceId } = await params;

//     // console.log(invoiceId, userId);

//     //connect db
//     await connectDB() 
//     const settings:ISettings | null = await SettingModel.findOne({ userId : userId })
//     const invoice:IInvoice | null = await InvoiceModel.findById(invoiceId)

//     if(!invoice){
//         return NextResponse.json({
//           message : "No invoice found"
//         },{
//           status : 500
//         })
//     }

//     if(!settings){
//       return NextResponse.json({
//           message : "Please add logo and signature in setting section"
//         },{
//           status : 500
//         })
//     }



//     const doc = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4",
//     });

//     const FULL_WIDTH = 211
//     const COLOR_CODE = "#8c00ff"
//     const  currencyStr = invoice.currency as TCurrencyKey
//     const currency = currencyOption[currencyStr]

//     //top border
//     doc.setFillColor(COLOR_CODE)
//     doc.rect(0,0,FULL_WIDTH,2,"F")

//     //invoice logo
//     doc.addImage(settings.invoiceLogo as string,15,13,60,12)

//     //invoice text
//     doc.setFontSize(25)
//     doc.text("INVOICE",FULL_WIDTH - 15,22,{ align : 'right'})

//     //company details ( user generate)
//     doc.setFontSize(12)
//     doc.setFont('times','bold')
//     doc.text(invoice.from.name,15,35)

//     //display address company
//     doc.setFontSize(9)
//     doc.setFont("times","normal")
//     doc.text(invoice.from.address1,15,40)
//     doc.text(invoice.from.address2 as string,15,45)
//     doc.text(invoice.from.address3 as string,15,50)

//     //invoice no, invoice date and invoice due date
//     doc.text(`Invoice No. : ${invoice.invoice_no}`,FULL_WIDTH - 15,35, { align : "right"})
//     doc.text(`Invoice Date : ${format(invoice.invoice_date,"PP")}`,FULL_WIDTH - 15,40, { align : "right"})
//     doc.text(`Due Date. : ${format(invoice.due_date,"PP")}`,FULL_WIDTH - 15,45, { align : "right"})

//     doc.text("Bill To.",15,60)

//     //client details 
//     doc.setFontSize(12)
//     doc.setFont('times','bold')
//     doc.text(invoice.to.name,15,70)

//     //display address client
//     doc.setFontSize(9)
//     doc.setFont("times","normal")
//     doc.text(invoice.to.address1,15,75)
//     doc.text(invoice.to.address2 as string,15,80)
//     doc.text(invoice.to.address3 as string,15,85)

//     const ITESM_XAXIS = 18
//     const QUANTITY_XAXIS = 110
//     const PRICE_XAXIS = 140 
//     const TOTAL_AXIIS = 165

//     //items
//     doc.setFillColor(COLOR_CODE)
//     doc.rect(15,95,FULL_WIDTH - 30,6,"F")
//     doc.setTextColor("#fff")
//     doc.setFontSize(10.5)
//     doc.text("Items",ITESM_XAXIS,99)
//     doc.text("Quantity",QUANTITY_XAXIS,99)
//     doc.text("Price",PRICE_XAXIS,99)
//     doc.text("Total",TOTAL_AXIIS,99)

//     let Yaxis = 99
//     //ITEMS DETAILS
//     doc.setTextColor("#000")
//     doc.setFontSize(10)


//     invoice.items.forEach((item,index)=>{
//       Yaxis = Yaxis + 6
      
//       doc.text(`${item.item_name}`,ITESM_XAXIS,Yaxis)
//       doc.text(`${item.quantity}`,QUANTITY_XAXIS,Yaxis)
//       doc.text(`${item.price}`,PRICE_XAXIS,Yaxis)
//       doc.text(`${item.total}`,TOTAL_AXIIS,Yaxis)
//     })

//     doc.text('Sub total : ',160,Yaxis+15)
//     doc.text(`${invoice.sub_total}`,FULL_WIDTH-15,Yaxis+15,{align : "right"})

//     doc.text('Discount : ',160,Yaxis+20)
//     doc.text(`-${invoice.discount}`,FULL_WIDTH-15,Yaxis+20,{align : "right"})

//     const subtotal_remove_discount = invoice.sub_total - (invoice.discount || 0)
//     doc.text(`${subtotal_remove_discount}`,FULL_WIDTH-15,Yaxis+25,{align : "right"})

//     //tax percentage
//     doc.text(`Tax ${invoice.tax_percentage}% :`,160,Yaxis+30)
//     let taxAmount = 0
//     if(invoice.tax_percentage){
//       taxAmount = (subtotal_remove_discount * Number(invoice.tax_percentage )) / 100
//     }
//     doc.text(`${taxAmount}`,FULL_WIDTH-15,Yaxis+30,{align : "right"})


//     //total amount
//     doc.setFont('times',"bold")
//     const totalAmount = Number(subtotal_remove_discount) - Number(taxAmount) //this line will be change
//     doc.text(`Total :`,160,Yaxis+35)
//     doc.text(`${totalAmount}`,FULL_WIDTH-15,Yaxis+35,{align : "right"})


//     //signature
//     doc.setFont('times',"normal")
//     doc.addImage(settings.signature?.image as string,FULL_WIDTH-60,Yaxis+40,50,20)
//     doc.text(`${settings.signature?.name as string}`,FULL_WIDTH-15,Yaxis+60,{align : "right"})


//     //notes
//     doc.setFont('times',"bold")
//     doc.text("Notes : ",15,Yaxis+70)
//     doc.setFont('times',"normal")
//     doc.text(`${invoice.notes}`,15,Yaxis+75)


//     const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

//     return new NextResponse(pdfBuffer,{
//         headers : {
//             "content-type" : "application/pdf",
//             "content-disposition" : "inline"
//         }
//     })
//   } catch (error: any) {
//     console.log(error);
//     return NextResponse.json({
//       message: error || error.message || "Something went wrong",
//     });
//   }
// }
