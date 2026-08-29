import { usePortal } from '../store';
import { STATUS_OPTIONS } from '../utils';

export default function SheetTabs() {
  const { user, registry, accessibleSheetIds, activeView, setActiveView, createSheet } = usePortal();
  const allowed = accessibleSheetIds(user);
  const isEmployee = user && user.role === 'employee';
  const isManager = user && (user.role === 'owner' || user.role === 'manager');
  const tabs = registry.filter((e) => allowed.includes(e.id));

  async function handleAddTab() {
    if (!isManager) return;
    const name = prompt('Name this new sheet:', 'Sheet ' + (tabs.length + 1));
    if (!name || !name.trim()) return;
    const columns = [
      { key: 'title', label: 'Title', type: 'text', width: 200 },
      { key: 'notes', label: 'Notes', type: 'text', width: 220 },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS }
    ];
    try {
      const id = await createSheet(name.trim(), [], columns);
      setActiveView(id);
    } catch (err) {
      alert('Could not create sheet: ' + err.message);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid var(--line)', marginBottom: 14, overflowX: 'auto' }}>
      {tabs.map((t) => {
        const active = t.id === activeView;
        return (
          <div
            key={t.id}
            onClick={() => setActiveView(t.id)}
            style={{
              padding: '9px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              color: active ? 'var(--gold)' : 'var(--muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {t.id === 'daily-report' && isEmployee ? 'My Daily Report' : t.name}
          </div>
        );
      })}
      {isManager && (
        <div
          onClick={handleAddTab}
          title="Add a new sheet"
          style={{ padding: '9px 12px', fontSize: 15, fontWeight: 700, color: 'var(--muted-2)', cursor: 'pointer' }}
        >
          +
        </div>
      )}
    </div>
  );
}
