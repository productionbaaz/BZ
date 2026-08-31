export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function normLabel(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'On Hold'];

export const SHEET_ICONS = {
  clients: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.2-2 2.5-2s2.5.7 2.5 2c0 1.5-1.5 2-2.5 2.3-1.3.4-2.5.9-2.5 2.4 0 1.3 1.2 2 2.5 2s2.5-.6 2.5-2"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.2c2.7.4 5 2.2 5 5.3"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  bank: '<path d="M3 21h18M4 21V10M20 21V10M2 10l10-6 10 6M8 21v-7M12 21v-7M16 21v-7"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z"/>'
};

export function statusClass(status) {
  const map = { Completed: 'status-completed', 'In Progress': 'status-inprogress', Pending: 'status-pending', 'On Hold': 'status-onhold', Active: 'status-completed', Paid: 'status-completed', Unpaid: 'status-onhold' };
  return map[status] || '';
}
export function priorityClass(p) {
  const map = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };
  return map[p] || '';
}

export function findColumnByPurpose(cols, purposeKeys, labelWords) {
  let hit = cols.find((c) => purposeKeys.includes(c.key));
  if (hit) return hit;
  return cols.find((c) => labelWords.some((w) => normLabel(c.label).includes(w)));
}

export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function slugify(label, existingKeys) {
  let base = String(label || 'col').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'col';
  let key = base, i = 2;
  while (existingKeys.has(key)) { key = base + '_' + i; i++; }
  existingKeys.add(key);
  return key;
}
