import { useEffect, useState } from 'react';
import { usePortal } from '../store';
import { findColumnByPurpose, normLabel, statusClass } from '../utils';

export default function Dashboard() {
  const { user, registry, sheets, ensureSheet } = usePortal();
  const isRestricted = user && (user.role === 'employee' || user.role === 'guest');
  const [loading, setLoading] = useState(!isRestricted);

  useEffect(() => {
    if (isRestricted) return;
    setLoading(true);
    ensureSheet('client-tracking').finally(() => setLoading(false));
  }, [isRestricted, ensureSheet]);

  if (isRestricted) {
    return (
      <div>
        <div className="panel-block">
          <h3>Welcome, {user.name}</h3>
          <p>{user.role === 'guest'
            ? 'Use the sidebar to open any sheet that has been shared with you.'
            : 'Use the sidebar to fill in your Daily Report and any sheets your manager has assigned to you. Your check-in was logged automatically when you signed in today.'}</p>
        </div>
      </div>
    );
  }

  const sheet = sheets['client-tracking'];
  const cols = sheet ? sheet.columns : [];
  const list = sheet ? sheet.rows : [];
  const statusCol = findColumnByPurpose(cols, ['status'], ['status']);
  const priorityCol = findColumnByPurpose(cols, ['priority'], ['priority']);
  const srCol = cols.find((c) => c.key === 'sr') || cols.find((c) => normLabel(c.label).includes('sr'));
  const clientCol = cols.find((c) => c.key === 'clientName') || cols.find((c) => normLabel(c.label).includes('client')) || cols[0];
  const titleCol = cols.find((c) => c.key === 'projectTitle') || cols.find((c) => normLabel(c.label).includes('project')) || cols[1];
  const assignedCol = cols.find((c) => c.key === 'assigned') || cols.find((c) => normLabel(c.label).includes('assign') || normLabel(c.label).includes('editor'));

  const total = list.length;
  const completed = statusCol ? list.filter((c) => c[statusCol.key] === 'Completed').length : '—';
  const inProgress = statusCol ? list.filter((c) => c[statusCol.key] === 'In Progress').length : '—';
  const highPriority = priorityCol ? list.filter((c) => c[priorityCol.key] === 'High').length : '—';

  const recent = [...list].sort((a, b) => (srCol ? (parseInt(b[srCol.key]) || 0) - (parseInt(a[srCol.key]) || 0) : 0)).slice(0, 5);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card gold"><div className="bar"></div><div className="n">{loading ? '…' : total}</div><div className="l">Total projects</div></div>
        <div className="stat-card green"><div className="bar"></div><div className="n">{loading ? '…' : completed}</div><div className="l">Completed</div></div>
        <div className="stat-card blue"><div className="bar"></div><div className="n">{loading ? '…' : inProgress}</div><div className="l">In progress</div></div>
        <div className="stat-card red"><div className="bar"></div><div className="n">{loading ? '…' : highPriority}</div><div className="l">High priority</div></div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', marginBottom: 26 }}>
        <div className="stat-card blue"><div className="bar"></div><div className="n">{registry.length}</div><div className="l">Sheets in portal</div></div>
        <div className="stat-card gold"><div className="bar"></div><div className="n">{loading ? '…' : total}</div><div className="l">Rows across all sheets</div></div>
      </div>
      <div className="panel-block">
        <h3>Welcome to Baaz Portal</h3>
        <p>Sign up / log in with an Owner or Manager role, then use any sheet in the sidebar to manage that part of the business. Add or remove sheets any time from Settings.</p>
      </div>
      <div className="panel-block">
        <h3>Recent projects</h3>
        <p>Latest entries from the Client Tracking Sheet.</p>
        {recent.length === 0 ? (
          <div className="empty-note">Nothing logged yet — head to Client Tracking to add your first project.</div>
        ) : (
          recent.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{clientCol ? c[clientCol.key] : ''} — {titleCol ? c[titleCol.key] : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>Editor: {(assignedCol ? c[assignedCol.key] : '') || 'Unassigned'}</div>
              </div>
              {statusCol && <span className={`pill ${statusClass(c[statusCol.key])}`}>{c[statusCol.key]}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
