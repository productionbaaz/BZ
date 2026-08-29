import { useState } from 'react';
import { usePortal } from '../store';

export default function ShareModal({ sheetId, onClose }) {
  const { registry, shareSheet, unshareSheet, setPublicAccess } = usePortal();
  const entry = registry.find((e) => e.id === sheetId) || {};
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm] = useState('view');
  const [busy, setBusy] = useState(false);

  async function handleAddShare() {
    if (!shareEmail.trim()) { alert('Enter an email to share with.'); return; }
    setBusy(true);
    try {
      await shareSheet(sheetId, shareEmail.trim(), sharePerm);
      setShareEmail('');
      setSharePerm('view');
    } catch (err) {
      alert('Could not share this sheet: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveShare(email) {
    try { await unshareSheet(sheetId, email); } catch (err) { alert('Could not remove that share: ' + err.message); }
  }

  async function handleSetPublicAccess(access) {
    if (access === 'edit' && !confirm('This makes the sheet editable by ANYONE who has the link, with no login at all. Continue?')) return;
    try { await setPublicAccess(sheetId, access || null); } catch (err) { alert('Could not update public access: ' + err.message); }
  }

  function copyPublicLink() {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}view.html?sheet=${sheetId}`;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copied:\n' + url),
      () => prompt('Copy this link:', url)
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,11,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px', overflow: 'auto' }}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, width: '100%', maxWidth: 480, padding: '24px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0 }}>Share "{entry.name}"</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <p style={{ fontSize: 12.5, fontWeight: 600, margin: '18px 0 4px' }}>Public link (no login needed)</p>
        <p style={{ fontSize: 11.5, color: 'var(--muted-2)', margin: '0 0 8px' }}>Anyone with this link can open it directly. Off by default.</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={entry.publicAccess || ''} onChange={(e) => handleSetPublicAccess(e.target.value)} style={{ padding: '8px 10px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 13 }}>
            <option value="">Off</option>
            <option value="view">Anyone can view</option>
            <option value="edit">Anyone can edit</option>
          </select>
          {entry.publicAccess && <button className="btn-outline" onClick={copyPublicLink}>Copy link</button>}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', margin: '18px 0' }} />

        <p style={{ fontSize: 12.5, fontWeight: 600, margin: '0 0 4px' }}>Share by email</p>
        <p style={{ fontSize: 11.5, color: 'var(--muted-2)', margin: '0 0 10px' }}>They'll need a free guest sign-up on the Employee Login page with this exact email.</p>
        {Object.entries(entry.sharedWith || {}).map(([em, perm]) => (
          <div key={em} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
            <span>{em} — <span style={{ color: 'var(--gold)' }}>{perm}</span></span>
            <button className="icon-btn danger" style={{ width: 24, height: 24 }} onClick={() => handleRemoveShare(em)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="email" placeholder="someone@example.com" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} style={{ flex: 1, padding: '9px 11px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 13 }} />
          <select value={sharePerm} onChange={(e) => setSharePerm(e.target.value)} style={{ padding: '9px 8px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 13 }}>
            <option value="view">Can view</option>
            <option value="edit">Can edit</option>
          </select>
          <button className="btn-gold" disabled={busy} onClick={handleAddShare}>Share</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
