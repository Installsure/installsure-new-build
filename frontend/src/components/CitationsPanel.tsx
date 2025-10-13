export default function CitationsPanel({
  items
}: {
  items: { title: string; href?: string; id: string }[];
}) {
  if (!items?.length) return null;
  
  return (
    <div className="mt-4 rounded-2xl border p-3 text-sm">
      <div className="font-semibold mb-2">Sources</div>
      <ul className="list-disc pl-6">
        {items.map((x) => (
          <li key={x.id}>
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
