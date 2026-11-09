// Shared building blocks for the printable admission form and staff details pages

export function SectionTitle({ children }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
      <span className="h-3.5 w-1 rounded-full bg-primary" />
      {children}
    </h3>
  );
}

// Label/value pairs, two per row. The grid lines are 1px gaps over a grey background,
// so no cell's background can paint over a neighbour's border. A field marked `full`,
// or one left without a partner at the end of a row, spans the whole width.
export function FieldGrid({ fields }) {
  let column = 0;
  const cells = fields.map((field, i) => {
    let span = Boolean(field.full);
    if (!span && column === 0) {
      const next = fields[i + 1];
      if (!next || next.full) span = true;
    }
    column = span ? 0 : (column + 1) % 2;
    return { ...field, span };
  });

  return (
    <dl className="grid grid-cols-2 gap-px bg-gray-300 border border-gray-300 rounded-md overflow-hidden">
      {cells.map(({ label, value, span }) => (
        <div key={label} className={`flex gap-px ${span ? 'col-span-2' : ''}`}>
          <dt className="w-36 shrink-0 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">{label}</dt>
          <dd className="flex-1 bg-white px-3 py-2 text-sm font-semibold text-gray-900">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
