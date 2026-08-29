import { useEffect, useRef, useState } from 'react';
import { usePortal } from '../store';
import { uid, normLabel, statusClass, priorityClass, findColumnByPurpose, parseCSV, slugify } from '../utils';

function nextSr(cols, list) {
  const srCol = cols.find((c) => c.key === 'sr') || cols.find((c) => normLabel(c.label).includes('sr'));
  if (!srCol) return list.length + 1;
  if (list.length === 0) return 1;
  const nums = list.map((c) => parseInt(c[srCol.key], 10)).filter((n) => !isNaN(n));
  return nums.length ? Math.max(...nums) + 1 : list.length + 1;
}

function blankRow(cols, list, user, sheetId) {
  const row = { id: 'new-' + uid() };
  cols.forEach((c) => {
    if (c.key === 'sr') row[c.key] = nextSr(cols, list);
    else if (c.key === 'year') row[c.key] = new Date().getFullYear();
    else if (c.key === 'month') row[c.key] = new Date().getMonth() + 1;
    else if ((sheetId === 'daily-report' || sheetId === 'attendance') && c.key === 'employee' && user && user.role === 'employee') row[c.key] = user.name;
    else if (c.type === 'checkbox') row[c.key] = false;
    else if (c.type === 'select') row[c.key] = (c.options && c.options[0]) || '';
    else if (c.type === 'number') row[c.key] = 0;
    else row[c.key] = '';
  });
  return row;
}

export default function SheetView({ sheetId, readOnly }) {
  const { user, sheets, ensureSheet, saveRow, deleteRow, importCSV } = usePortal();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const fileInputRef = useRef(null);
  const cellInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setEditingCell(null);
    setSearch('');
    setFilterStatus('');
    ensureSheet(sheetId).finally(() => setLoading(false));
  }, [sheetId, ensureSheet]);

  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      if (cellInputRef.current.select) cellInputRef.current.select();
    }
  }, [editingCell]);

  const sheet = sheets[sheetId];
  const cols = sheet ? sheet.columns : [];
  const isEmployee = user && user.role === 'employee';
  const statusCol = findColumnByPurpose(cols, ['status'], ['status']);
  const priorityCol = findColumnByPurpose(cols, ['priority'], ['priority']);
  const srCol = cols.find((c) => c.key === 'sr') || cols.find((c) => normLabel(c.label).includes('sr'));
  const employeeCol = cols.find((c) => c.key === 'employee');

  if (loading || !sheet) {
    return <div className="empty-note">Loading…</div>;
  }

  let list = [...sheet.rows];
  if (srCol) list.sort((a, b) => (parseInt(a[srCol.key]) || 0) - (parseInt(b[srCol.key]) || 0));
  if (isEmployee && employeeCol && (sheetId === 'daily-report' || sheetId === 'attendance')) {
    list = list.filter((r) => normLabel(r[employeeCol.key]) === normLabel(user.name));
  }
  list = list.filter((c) => {
    if (filterStatus && statusCol && c[statusCol.key] !== filterStatus) return false;
    if (search) {
      const hay = cols.map((col) => c[col.key]).join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // saveRow/deleteRow in the store update the screen instantly and only
  // roll back if the background save actually fails — that's what makes
  // this feel as fast as editing a real spreadsheet.
  function persistField(row, key, value) {
    saveRow(sheetId, { ...row, [key]: value }).catch((err) => {
      alert('Could not save that change — it has been reverted: ' + err.message);
    });
  }

  function beginEdit(row, col) {
    if (readOnly) return;
    if (col.type === 'checkbox') {
      persistField(row, col.key, !row[col.key]);
      return;
    }
    setEditingCell({ rowId: row.id, key: col.key });
    setCellValue(row[col.key] ?? '');
  }

  function commitEdit(row, col) {
    if (!editingCell || editingCell.rowId !== row.id || editingCell.key !== col.key) return;
    const raw = cellValue;
    const value = col.type === 'number' ? (parseInt(raw || 0, 10) || 0) : raw;
    setEditingCell(null);
    if (value !== row[col.key]) persistField(row, col.key, value);
  }

  function handleCellKeyDown(e, row, col) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(row, col); }
    else if (e.key === 'Escape') { setEditingCell(null); }
  }

  function addRow() {
    if (readOnly) return;
    const row = blankRow(cols, sheet.rows, user, sheetId);
    saveRow(sheetId, row).catch((err) => alert('Could not add a new row: ' + err.message));
  }

  function handleDelete(row) {
    if (readOnly) return;
    if (!confirm('Delete this row? This cannot be undone.')) return;
    if (editingCell && editingCell.rowId === row.id) setEditingCell(null);
    deleteRow(sheetId, row.id).catch((err) => alert('Could not delete this row — it has been restored: ' + err.message));
  }

  function handleImportClick() { if (!readOnly) fileInputRef.current?.click(); }
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length < 1) { alert('That CSV looks empty.'); return; }
        const headers = rows[0];
        const bodyRows = rows.slice(1);
        const knownMap = {};
        cols.forEach((c) => { knownMap[normLabel(c.label)] = c; });
        const usedKeys = new Set();
        const newCols = headers.map((h) => {
          const known = knownMap[normLabel(h)];
          const key = slugify(h, usedKeys);
          if (known) return { key, label: h.trim() || known.label, type: known.type, options: known.options, width: known.width };
          return { key, label: h.trim() || key, type: 'text' };
        });
        const dataRows = bodyRows.map((r) => {
          const obj = { id: uid() };
          newCols.forEach((c, i) => {
            let v = r[i] !== undefined ? r[i].trim() : '';
            if (c.type === 'checkbox') v = /^(yes|true|1|✅)$/i.test(v);
            else if (c.type === 'number') v = parseInt(v || 0, 10) || 0;
            obj[c.key] = v;
          });
          return obj;
        });
        const proceed = confirm(`Import "${file.name}"?\n\nThis will replace the current sheet with ${newCols.length} columns and ${dataRows.length} rows exactly as found in the CSV. This can't be undone.`);
        if (!proceed) return;
        await importCSV(sheetId, newCols, dataRows);
      } catch (err) {
        alert('Could not import that CSV: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => { alert('Could not read that file.'); e.target.value = ''; };
    reader.readAsText(file);
  }

  function exportCSV() {
    if (sheet.rows.length === 0) { alert('No data to export yet.'); return; }
    const headers = cols.map((c) => c.label);
    const rows = sheet.rows.map((c) => cols.map((col) => {
      const v = c[col.key];
      if (col.type === 'checkbox') return v ? 'Yes' : 'No';
      return v ?? '';
    }));
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = sheetId + '.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function renderCellContent(row, col) {
    const isEditingThis = editingCell && editingCell.rowId === row.id && editingCell.key === col.key;
    if (isEditingThis) {
      if (col.type === 'select') {
        return (
          <select
            ref={cellInputRef}
            value={cellValue}
            onChange={(e) => setCellValue(e.target.value)}
            onBlur={() => commitEdit(row, col)}
            onKeyDown={(e) => handleCellKeyDown(e, row, col)}
          >
            {(col.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      return (
        <input
          ref={cellInputRef}
          type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'}
          value={cellValue}
          onChange={(e) => setCellValue(e.target.value)}
          onBlur={() => commitEdit(row, col)}
          onKeyDown={(e) => handleCellKeyDown(e, row, col)}
        />
      );
    }

    const v = row[col.key];
    if (statusCol && col.key === statusCol.key) return <span className={`pill ${statusClass(v)}`}>{v}</span>;
    if (priorityCol && col.key === priorityCol.key) return <span className={`pill ${priorityClass(v)}`}>{v}</span>;
    if (col.type === 'checkbox') return <span style={{ cursor: 'pointer' }}>{v ? '✅' : '—'}</span>;
    if (col.key === 'progress' && typeof v === 'number') {
      return (
        <>
          <span className="progress-track"><span className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, v || 0))}%` }}></span></span>
          <span className="mono" style={{ fontSize: 10.5 }}>{v || 0}%</span>
        </>
      );
    }
    return v;
  }

  return (
    <div>
      <div className="sheet-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input type="text" placeholder="Search this sheet…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {statusCol && statusCol.options && (
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All {statusCol.label}</option>
            {statusCol.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {readOnly && (
          <span style={{ fontSize: 12, color: 'var(--muted-2)', padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8 }}>
            👁 View only
          </span>
        )}
        {!readOnly && (
          <>
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <button className="btn-outline" onClick={handleImportClick}>Import CSV</button>
          </>
        )}
        <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
        {!readOnly && <button className="btn-gold" onClick={addRow}>+ Add row</button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="row-num-header">#</th>
              {cols.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={cols.length + 1}><div className="empty-note">No rows yet. Click "Add row" or import a CSV to get started.</div></td></tr>
            )}
            {list.map((row, i) => (
              <tr key={row.id}>
                <td className="row-num" onClick={() => handleDelete(row)} title={readOnly ? undefined : 'Click to delete this row'} style={readOnly ? { cursor: 'default' } : undefined}>
                  {i + 1}
                  {!readOnly && <span className="row-delete-x">×</span>}
                </td>
                {cols.map((col) => {
                  const isEditingThis = editingCell && editingCell.rowId === row.id && editingCell.key === col.key;
                  return (
                    <td
                      key={col.key}
                      className={isEditingThis ? 'cell-editing' : (readOnly ? '' : 'cell-editable')}
                      onDoubleClick={() => beginEdit(row, col)}
                      onClick={() => { if (col.type === 'checkbox') beginEdit(row, col); }}
                    >
                      {renderCellContent(row, col)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
