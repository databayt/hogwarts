import { auth } from "@/auth";
import RouteModal from "@/components/atom/modal/route-modal";
import CreateEditInvoiceModalContent from "@/components/invoice/invoice/create-edit-content";

export default async function InvoiceCreate() {
  const session = await auth();
  const fullName = session?.user.name ?? "";
  const [derivedFirstName, derivedLastName] = fullName.split(" ", 2);
  return (
    <RouteModal
      returnTo="/invoice"
      content={
        <CreateEditInvoiceModalContent
          defaults={{
            firstName: derivedFirstName || null,
            lastName: derivedLastName || null,
            email: session?.user.email ?? null,
            currency: null,
          }}
        />
      }
    />
  );
}
