import { usePortal } from '../store';
import { SHEET_ICONS } from '../utils';

export default function Sidebar({ sidebarOpen, onCloseMobile }) {
  const { user, registry, accessibleSheetIds, activeView, setActiveView, logout } = usePortal();
  const isEmployee = user && user.role === 'employee';
  const isGuest = user && user.role === 'guest';
  const isManager = user && (user.role === 'owner' || user.role === 'manager');
  const allowedIds = accessibleSheetIds(user);
  const visible = registry.filter((e) => allowedIds.includes(e.id));

  function go(view) {
    setActiveView(view);
    onCloseMobile();
  }

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="brand-row">
        <div className="mark">
          <svg viewBox="0 0 48 48" fill="none"><path d="M24 6 L40 20 L30 20 L38 34 L24 26 L10 34 L18 20 L8 20 Z" fill="none" stroke="#c99a3b" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
        <div className="brand-name">BAAZ <span>PORTAL</span></div>
      </div>

      <div className="nav-section-label">Overview</div>
      <div className={`nav-item${activeView === 'dashboard' ? ' active' : ''}`} onClick={() => go('dashboard')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
        Dashboard
      </div>

      <div className="nav-section-label">{isManager ? 'Sheets' : 'My Sheets'}</div>
      {visible.map((entry) => (
        <div key={entry.id} className={`nav-item${activeView === entry.id ? ' active' : ''}`} onClick={() => go(entry.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: SHEET_ICONS[entry.icon] || SHEET_ICONS.box }} />
          {entry.id === 'daily-report' ? 'My Daily Report' : entry.name}
        </div>
      ))}

      {isManager && (
        <>
          <div className="nav-section-label">Admin</div>
          <div className={`nav-item${activeView === 'settings' ? ' active' : ''}`} onClick={() => go('settings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: SHEET_ICONS.settings }} />
            Settings
          </div>
        </>
      )}
      {(isEmployee || isGuest) && (
        <div className={`nav-item${activeView === 'profile' ? ' active' : ''}`} onClick={() => go('profile')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
          Profile
        </div>
      )}

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">{user ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '–'}</div>
          <div className="who">
            <div className="name">{user ? user.name : '—'}</div>
            <div className="role">{user ? user.role : '—'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>Log out</button>
      </div>
    </aside>
  );
}
