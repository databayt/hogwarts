"use client"

import { useState } from "react"

import { BillingSettings2 } from "@/components/billingsdk/billing-settings-2"

export function BillingSettings2Demo() {
  const [fullName, setFullName] = useState("John Doe")
  const [billingEmail, setBillingEmail] = useState("john@school.edu")
  const [taxId, setTaxId] = useState("")
  const [currency, setCurrency] = useState("usd")
  const [autoRenewal, setAutoRenewal] = useState(true)
  const [invoiceEmails, setInvoiceEmails] = useState(true)
  const [promotionalEmails, setPromotionalEmails] = useState(false)

  return (
    <BillingSettings2
      title="Billing Preferences"
      inputFields={[
        {
          id: "fullName",
          name: "fullName",
          value: fullName,
          placeholder: "John Doe",
          onChange: setFullName,
          label: "Full Name",
          type: "text",
          required: true,
        },
        {
          id: "billingEmail",
          name: "billingEmail",
          value: billingEmail,
          placeholder: "user@example.com",
          onChange: setBillingEmail,
          label: "Billing Email",
          helperText: "Invoices will be sent to this email address",
          type: "email",
          required: true,
        },
        {
          id: "taxId",
          name: "taxId",
          value: taxId,
          placeholder: "EU123456789",
          onChange: setTaxId,
          label: "Tax ID (Optional)",
          helperText: "For VAT or other tax purposes",
          type: "text",
        },
      ]}
      features={[
        {
          id: "auto-renewal",
          label: "Auto-Renewal",
          description: "Automatically renew your subscription",
          enabled: autoRenewal,
          onToggle: setAutoRenewal,
        },
        {
          id: "invoice-emails",
          label: "Invoice Emails",
          description: "Receive emails when invoices are generated",
          enabled: invoiceEmails,
          onToggle: setInvoiceEmails,
        },
        {
          id: "promotional-emails",
          label: "Promotional Emails",
          description:
            "Receive occasional updates about new features and offers",
          enabled: promotionalEmails,
          onToggle: setPromotionalEmails,
        },
      ]}
      currencies={["USD", "EUR", "GBP", "SAR", "AED"]}
      defaultCurrency={currency}
      onCurrencyChange={setCurrency}
      onSave={() => console.log("Settings saved")}
      onCancel={() => console.log("Cancelled")}
      saveButtonText="Save Changes"
      cancelButtonText="Cancel"
    />
  )
}
