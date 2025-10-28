import { InvoiceStatus } from "@prisma/client";

export interface Address {
  id: string;
  name: string;
  email?: string | null;
  address1: string;
  address2?: string | null;
  address3?: string | null;
}

export interface Item {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: Date;
  due_date: Date;
  currency: string;
  from: Address;
  to: Address;
  items: Item[];
  sub_total: number;
  discount?: number | null;
  tax_percentage?: number | null;
  total: number;
  notes?: string | null;
  status: InvoiceStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
