export function toCSV(rows, headers) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const head = headers.map(h => esc(h.label)).join(',');
  const body = rows.map(r => headers.map(h => esc(typeof h.accessor === 'function' ? h.accessor(r) : r[h.key])).join(',')).join('\n');
  return head + '\n' + body + '\n';
}
