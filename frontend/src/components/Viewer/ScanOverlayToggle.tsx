export default function ScanOverlayToggle({
  enabled,
  onToggle
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="rounded"
      />
      <span>Scan Overlay</span>
    </label>
  );
}
