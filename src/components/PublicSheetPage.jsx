import { useEffect, useRef, useState } from 'react';
import { firebasedb } from '../firebasedb';
import { uid, statusClass, priorityClass, findColumnByPurpose, normLabel } from '../utils';

function blankRow(cols) {
  const row = { id: 'new-' + uid() };
  cols.forEach((c) => {
    if (c.type === 'checkbox') row[c.key] = false;
    else if (c.type === 'select') row[c.key] = (c.options && c.options[0]) || '';
    else if (c.type === 'number') row[c.key] = 0;
    else row[c.key] = '';
  });
  return row;
}

export default function PublicSheetPage() {
  const sheetId = new URLSearchParams(window.location.search).get('sheet');
  const [state, setState] = useState({ loading: true, error: null, name: '', access: null, columns: [], rows: [] });
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const cellInputRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!sheetId) { setState((s) => ({ ...s, loading: false, error: 'No sheet specified in the link.' })); return; }
    firebasedb.getPublicSheet(sheetId).then((r) => {
      setState({ loading: false, error: null, name: r.name, access: r.access, columns: r.columns, rows: r.rows });
      unsubRef.current = firebasedb.subscribePublicSheet(sheetId, (rows) => {
        setState((s) => ({ ...s, rows }));
      });
    }).catch((err) => {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      if (cellInputRef.current.select) cellInputRef.current.select();
    }
  }, [editingCell]);

  const canEdit = state.access === 'edit';
  const cols = state.columns;
  const statusCol = findColumnByPurpose(cols, ['status'], ['status']);
  const priorityCol = findColumnByPurpose(cols, ['priority'], ['priority']);

  function beginEdit(row, col) {
    if (!canEdit) return;
    if (col.type === 'checkbox') {
      persistField(row, col.key, !row[col.key]);
      return;
    }
    setEditingCell({ rowId: row.id, key: col.key });
    setCellValue(row[col.key] ?? '');
  }

  function persistField(row, key, value) {
    firebasedb.publicSaveRow({ sheetId, row: { ...row, [key]: value } })
      .catch((err) => alert('Could not save: ' + err.message));
  }

  function commitEdit(row, col) {
    if (!editingCell || editingCell.rowId !== row.id || editingCell.key !== col.key) return;
    const value = col.type === 'number' ? (parseInt(cellValue || 0, 10) || 0) : cellValue;
    setEditingCell(null);
    if (value !== row[col.key]) persistField(row, col.key, value);
  }

  function handleKeyDown(e, row, col) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(row, col); }
    else if (e.key === 'Escape') setEditingCell(null);
  }

  function addRow() {
    if (!canEdit) return;
    firebasedb.publicSaveRow({ sheetId, row: blankRow(cols) }).catch((err) => alert('Could not add row: ' + err.message));
  }

  function handleDelete(row) {
    if (!canEdit) return;
    if (!confirm('Delete this row? This cannot be undone.')) return;
    firebasedb.publicDeleteRow({ sheetId, rowId: row.id }).catch((err) => alert('Could not delete: ' + err.message));
  }

  function renderCell(row, col) {
    const isEditing = editingCell && editingCell.rowId === row.id && editingCell.key === col.key;
    if (isEditing) {
      if (col.type === 'select') {
        return (
          <select ref={cellInputRef} value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => commitEdit(row, col)} onKeyDown={(e) => handleKeyDown(e, row, col)}>
            {(col.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      return (
        <input ref={cellInputRef} type={col.type === 'date' ? 'date' : col.type === 'number' ? 'number' : 'text'} value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={() => commitEdit(row, col)} onKeyDown={(e) => handleKeyDown(e, row, col)} />
      );
    }
    const v = row[col.key];
    if (statusCol && col.key === statusCol.key) return <span className={`pill ${statusClass(v)}`}>{v}</span>;
    if (priorityCol && col.key === priorityCol.key) return <span className={`pill ${priorityClass(v)}`}>{v}</span>;
    if (col.type === 'checkbox') return <span>{v ? '✅' : '—'}</span>;
    return v;
  }

  if (state.loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading…</div>;
  }
  if (state.error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        <div className="mark" style={{ width: 40, height: 40 }}>
          <svg viewBox="0 0 48 48" fill="none"><path d="M24 6 L40 20 L30 20 L38 34 L24 26 L10 34 L18 20 L8 20 Z" fill="none" stroke="#c99a3b" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
        <p style={{ color: 'var(--red)', fontSize: 14 }}>{state.error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div className="mark" style={{ width: 28, height: 28 }}>
          <svg viewBox="0 0 48 48" fill="none"><path d="M24 6 L40 20 L30 20 L38 34 L24 26 L10 34 L18 20 L8 20 Z" fill="none" stroke="#c99a3b" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>BAAZ <span style={{ color: 'var(--gold)' }}>PORTAL</span></span>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '10px 0 4px' }}>{state.name}</h1>
      <p style={{ color: 'var(--muted-2)', fontSize: 12.5, marginBottom: 18 }}>
        {canEdit ? 'Shared publicly — anyone with this link can view and edit.' : 'Shared publicly — view only.'}
      </p>

      {canEdit && (
        <div className="sheet-toolbar">
          <button className="btn-gold" onClick={addRow}>+ Add row</button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="row-num-header">#</th>
              {cols.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {state.rows.length === 0 && (
              <tr><td colSpan={cols.length + 1}><div className="empty-note">No rows yet.</div></td></tr>
            )}
            {state.rows.map((row, i) => (
              <tr key={row.id}>
                <td className="row-num" onClick={() => handleDelete(row)} style={canEdit ? undefined : { cursor: 'default' }}>
                  {i + 1}
                  {canEdit && <span className="row-delete-x">×</span>}
                </td>
                {cols.map((col) => {
                  const isEditing = editingCell && editingCell.rowId === row.id && editingCell.key === col.key;
                  return (
                    <td key={col.key} className={isEditing ? 'cell-editing' : (canEdit ? 'cell-editable' : '')} onDoubleClick={() => beginEdit(row, col)} onClick={() => { if (col.type === 'checkbox') beginEdit(row, col); }}>
                      {renderCell(row, col)}
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
