"use client";
import Loading from "@/components/invoice/Loading";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/table/data-table/data-table";
import { cn } from "@/lib/utils";
import { getInvoices, sendInvoiceEmail } from "@/components/invoice/actions";
import { ErrorToast, SuccessToast } from "@/components/atom/toast";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Invoice } from "@/components/invoice/types";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import CreateEditInvoiceModalContent from "@/components/invoice/invoice/create-edit-content";
import type { Locale } from "@/components/internationalization/config";

interface IInvoiceClientPage {
  currency: string | undefined;
  userId: string | undefined;
  dictionary: any;
  lang: Locale;
}

export default function InvoiceClientPage({ userId, currency = "USD", dictionary, lang }: IInvoiceClientPage) {
  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const router = useRouter();
  const { modal, openModal } = useModal();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await getInvoices(page);
      if (response.success) {
        setData(response.data || []);
      } else {
        ErrorToast(response.error || "Something went wrong");
      }
    } catch (error) {
      ErrorToast("Failed to fetch invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // When modal closes (after create), refresh list
  useEffect(() => {
    if (!modal.open) {
      // slight defer to allow any pending updates
      const t = setTimeout(() => fetchData(), 50);
      return () => clearTimeout(t);
    }
  }, [modal.open]);

  const handleSendEmail = async (invoiceId: string, subject: string) => {
    try {
      const response = await sendInvoiceEmail(invoiceId, subject);
      if (response.success) SuccessToast("Invoice email sent successfully");
      else ErrorToast(response.error || "Failed to send email");
    } catch (error) {
      ErrorToast("Failed to send email");
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: "invoice_no", header: "Invoice No" },
    { accessorKey: "invoice_date", header: "Date", cell: ({ row }) => format(row.original.invoice_date, "PP") },
    { accessorKey: "due_date", header: "Due", cell: ({ row }) => format(row.original.due_date, "PP") },
    { accessorKey: "to.name", header: "Client Name" },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => {
        const currencyCode = row.original.currency || currency || "USD";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(row.original.total);
      },
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    {
      accessorKey: "id",
      header: "Action",
      cell: ({ row }) => {
        const invoiceId = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <span className="sr-only">Open menu</span>
              <MoreVerticalIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/invoice/view/${invoiceId}`)}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/invoice/edit/${invoiceId}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/invoice/paid/${invoiceId}`)}>Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendEmail(invoiceId, `Invoice from ${row.original.from.name}`)}>Send Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable<Invoice>({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="p-4">
      
      <div className="flex items-center justify-between gap-4 mb-4">
        <h4>Invoice</h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openModal()}
            className={cn(buttonVariants(), "cursor-pointer")}
          >
            Create Invoice
          </button>
        </div>
      </div>

      {isLoading ? <Loading /> : <DataTable table={table} />}

      {/* Non-route modal for creating an invoice */}
      <Modal content={<CreateEditInvoiceModalContent defaults={{ currency }} dictionary={dictionary} lang={lang} />} />
    </div>
  );
}


