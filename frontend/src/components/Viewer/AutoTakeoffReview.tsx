export default function AutoTakeoffReview({ results }: { results?: any }) {
  if (!results) return null;
  
  return (
    <div className="rounded-2xl border p-3">
      <div className="font-semibold mb-2">AI Takeoff Review</div>
      {/* render list w/ confidence chips + accept/reject toggles */}
      <div className="text-sm text-gray-600">
        Coming online as results populate…
      </div>
    </div>
  );
}
