/**
 * Citations Panel - Display sources for LLM responses
 */

interface Citation {
  id: string;
  title?: string;
  href?: string;
}

interface CitationsPanelProps {
  items: Citation[];
}

export default function CitationsPanel({ items }: CitationsPanelProps) {
  if (!items?.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="font-semibold mb-2 text-gray-900">Sources</div>
      <ul className="list-disc pl-6 space-y-1">
        {items.map((x) => (
          <li key={x.id} className="text-gray-700">
            {x.href ? (
              <a
                className="underline text-blue-600 hover:text-blue-800"
                href={x.href}
                target="_blank"
                rel="noreferrer"
              >
                {x.title || x.id}
              </a>
            ) : (
              <span>{x.title || x.id}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
