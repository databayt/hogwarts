"use server"

import {
  createInvoice as _createInvoice,
  updateInvoice as _updateInvoice,
  getInvoiceById as _getInvoiceById,
  getInvoices as _getInvoices,
  sendInvoiceEmail as _sendInvoiceEmail,
} from "@/components/invoice/actions"

export async function createInvoice(
  ...args: Parameters<typeof _createInvoice>
) {
  return _createInvoice(...args)
}

export async function updateInvoice(
  ...args: Parameters<typeof _updateInvoice>
) {
  return _updateInvoice(...args)
}

export async function getInvoiceById(
  ...args: Parameters<typeof _getInvoiceById>
) {
  return _getInvoiceById(...args)
}

export async function getInvoices(
  ...args: Parameters<typeof _getInvoices>
) {
  return _getInvoices(...args)
}

export async function sendInvoiceEmail(
  ...args: Parameters<typeof _sendInvoiceEmail>
) {
  return _sendInvoiceEmail(...args)
}


