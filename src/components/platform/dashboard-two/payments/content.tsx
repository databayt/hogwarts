import { columns } from "./columns";
import { DataTable } from "./data-table";
import { PAYMENT_DATA } from "./constants";

export default async function PaymentContent() {
  const data = PAYMENT_DATA;
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Payments</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}


