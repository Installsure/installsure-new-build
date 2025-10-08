import type { Estimation } from "../types";

export default function EstimationView({ data }: { data: Estimation | null }) {
  if (!data) return null;
  return (
    <section className="p-4">
      <h2 className="text-base font-semibold mb-2">Estimation</h2>
      <div className="border rounded-xl p-4 grid gap-2">
        <div className="text-sm">File: {data.file}</div>
        <div className="text-sm">Pages: {data.pages}</div>
        <div className="text-sm">Subtotal: ${data.costs.subtotal.toFixed(2)}</div>
        <div className="text-sm">Taxes: ${data.costs.taxes.toFixed(2)}</div>
        <div className="text-sm font-semibold">Total: ${data.costs.total.toFixed(2)}</div>
      </div>
      <h3 className="mt-4 font-medium">Line Items</h3>
      <ul className="list-disc pl-6">
        {data.line_items.map((li, idx) => (
          <li key={idx} className="text-sm">
            {li.name}: {li.qty} {li.unit} × ${li.unit_cost} = ${li.amount}
          </li>
        ))}
      </ul>
    </section>
  );
}