export default function QTOTable({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        No QTO data available
      </div>
    );
  }
  
  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 font-semibold border-b">
        Quantity Takeoff Results
      </div>
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left">Item</th>
            <th className="px-4 py-2 text-left">Quantity</th>
            <th className="px-4 py-2 text-left">Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="px-4 py-2">Wall Area</td>
            <td className="px-4 py-2">{data.wall_area_m2 || 0}</td>
            <td className="px-4 py-2">m²</td>
          </tr>
          <tr className="border-b">
            <td className="px-4 py-2">Door Count</td>
            <td className="px-4 py-2">{data.door_count || 0}</td>
            <td className="px-4 py-2">units</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
