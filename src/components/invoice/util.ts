/**
 * Utility functions for Invoice components
 *
 * Helper functions for invoice calculations, formatting, and management.
 */

/**
 * Calculate invoice subtotal
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal: number, discountRate: number): number {
  return subtotal * (discountRate / 100);
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100);
}

/**
 * Calculate invoice total
 */
export function calculateTotal(
  items: InvoiceItem[],
  taxRate: number = 0,
  discountRate: number = 0
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  total: number;
} {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, discountRate);
  const taxableAmount = subtotal - discount;
  const tax = calculateTax(taxableAmount, taxRate);
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    taxableAmount,
    tax,
    total,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format invoice number
 */
export function formatInvoiceNumber(prefix: string, number: number, length = 6): string {
  return `${prefix}-${number.toString().padStart(length, "0")}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(lastNumber: number, prefix = "INV"): string {
  return formatInvoiceNumber(prefix, lastNumber + 1);
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(dueDate: Date | string, status: string): boolean {
  if (status === "paid" || status === "void") return false;

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return new Date() > due;
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate days until due
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format due date status
 */
export function formatDueStatus(dueDate: Date | string, status: string): string {
  if (status === "paid") return "Paid";
  if (status === "void") return "Void";

  const daysUntil = getDaysUntilDue(dueDate);

  if (daysUntil < 0) {
    return `Overdue by ${Math.abs(daysUntil)} days`;
  }
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}

/**
 * Get invoice status color
 */
export function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "gray",
    pending: "blue",
    sent: "cyan",
    overdue: "red",
    paid: "green",
    void: "gray",
  };
  return colors[status] || "gray";
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(data: Partial<InvoiceData>): string[] {
  const errors: string[] = [];

  if (!data.clientName || data.clientName.trim() === "") {
    errors.push("Client name is required");
  }

  if (!data.clientEmail || !isValidEmail(data.clientEmail)) {
    errors.push("Valid client email is required");
  }

  if (!data.items || data.items.length === 0) {
    errors.push("At least one item is required");
  }

  data.items?.forEach((item, index) => {
    if (!item.description || item.description.trim() === "") {
      errors.push(`Item ${index + 1}: Description is required`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (item.price < 0) {
      errors.push(`Item ${index + 1}: Price cannot be negative`);
    }
  });

  if (data.dueDate && new Date(data.dueDate) < new Date()) {
    errors.push("Due date cannot be in the past");
  }

  return errors;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Export invoice data to CSV
 */
export function exportInvoiceToCSV(invoice: InvoiceData): string {
  const headers = ["Description", "Quantity", "Price", "Amount"];
  const rows = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.quantity * item.price),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    "",
    `Subtotal,,, ${formatCurrency(invoice.subtotal || 0)}`,
    `Discount,,, ${formatCurrency(invoice.discount || 0)}`,
    `Tax,,, ${formatCurrency(invoice.tax || 0)}`,
    `Total,,, ${formatCurrency(invoice.total || 0)}`,
  ].join("\n");

  return csvContent;
}

/**
 * Calculate payment schedule for recurring invoices
 */
export function calculatePaymentSchedule(
  startDate: Date,
  frequency: "weekly" | "monthly" | "quarterly" | "yearly",
  occurrences: number
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < occurrences; i++) {
    dates.push(new Date(currentDate));

    switch (frequency) {
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "quarterly":
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case "yearly":
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  return dates;
}

// Types
interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  dueDate?: Date | string;
}
