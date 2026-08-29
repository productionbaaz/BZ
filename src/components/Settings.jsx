import { useEffect, useState } from 'react';
import { usePortal } from '../store';
import { fileToDataURL, SHEET_ICONS, STATUS_OPTIONS } from '../utils';

const BANK_FIELDS = [
  { key: 'accountTitle', label: 'Account Title' }, { key: 'bankName', label: 'Bank Name' },
  { key: 'accountNumber', label: 'Account Number' }, { key: 'iban', label: 'IBAN' },
  { key: 'branchCode', label: 'Branch Code' }, { key: 'swiftCode', label: 'Swift Code' },
  { key: 'branchAddress', label: 'Branch Address' }, { key: 'businessAddress', label: 'Business Address' },
  { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'city', label: 'City' }
];

export default function Settings() {
  const {
    employees, registry, bankDetails, loadEmployees, loadRegistry, loadBankDetails,
    createEmployeeAccount, resetEmployeePassword, deleteEmployee,
    createSheet, deleteSheet, assignSheet, shareSheet, unshareSheet, setPublicAccess, saveBankDetails, setActiveView
  } = usePortal();

  const [loading, setLoading] = useState(true);
  const [empMsg, setEmpMsg] = useState(null);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [picFile, setPicFile] = useState(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetAssign, setNewSheetAssign] = useState([]);
  const [openAssignPanel, setOpenAssignPanel] = useState(null);
  const [openSharePanel, setOpenSharePanel] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm] = useState('view');
  const [bankForm, setBankForm] = useState({});
  const [bankMsg, setBankMsg] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEmployees(), loadRegistry(), loadBankDetails()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setBankForm(bankDetails || {}); }, [bankDetails]);

  async function handleCreateEmployee() {
    if (!name || !email || !password) { setEmpMsg({ text: 'Please fill in name, email and password.', ok: false }); return; }
    let profilePic = '';
    if (picFile) { try { profilePic = await fileToDataURL(picFile); } catch (e) { /* proceed without */ } }
    try {
      await createEmployeeAccount(name, email, password, profilePic);
      setEmpMsg({ text: `Employee account created for ${name}.`, ok: true });
      setName(''); setEmail(''); setPassword(''); setPicFile(null);
    } catch (err) {
      setEmpMsg({ text: err.message, ok: false });
    }
  }

  async function handleResetPassword(emp) {
    if (!confirm(`Send a password reset link to ${emp.name} (${emp.email})? They'll get an email to set a new password themselves — this app can no longer set it directly for them.`)) return;
    try {
      await resetEmployeePassword(emp.id, emp.email);
      alert(`Reset email sent to ${emp.email}.`);
    } catch (err) {
      alert('Could not send reset email: ' + err.message);
    }
  }

  async function handleDeleteEmployee(emp) {
    if (!confirm(`Delete ${emp.name}'s account? They will no longer be able to log in.`)) return;
    try { await deleteEmployee(emp.id); } catch (err) { alert('Could not delete employee: ' + err.message); }
  }

  async function handleCreateSheet() {
    if (!newSheetName.trim()) { alert('Please name the sheet.'); return; }
    const columns = [
      { key: 'title', label: 'Title', type: 'text', width: 200 },
      { key: 'notes', label: 'Notes', type: 'text', width: 220 },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS }
    ];
    try {
      const id = await createSheet(newSheetName.trim(), newSheetAssign, columns);
      setNewSheetName(''); setNewSheetAssign([]); setShowCreateSheet(false);
      const goNow = confirm(`"${newSheetName}" created with starter columns (Title, Notes, Date, Status). Open it now? You can also Import CSV there to define your own columns instead.`);
      if (goNow) setActiveView(id);
    } catch (err) {
      alert('Could not create sheet: ' + err.message);
    }
  }

  async function handleDeleteSheet(entry) {
    if (!confirm(`Delete the "${entry.name}" sheet and all its rows? This cannot be undone.`)) return;
    try { await deleteSheet(entry.id); } catch (err) { alert('Could not delete sheet: ' + err.message); }
  }

  async function handleToggleAssign(sheetId, employeeId, checked) {
    try { await assignSheet(sheetId, employeeId, checked); } catch (err) { alert('Could not update assignment: ' + err.message); }
  }

  async function handleAddShare(sheetId) {
    if (!shareEmail.trim()) { alert('Enter an email to share with.'); return; }
    try {
      await shareSheet(sheetId, shareEmail.trim(), sharePerm);
      setShareEmail('');
      setSharePerm('view');
    } catch (err) {
      alert('Could not share this sheet: ' + err.message);
    }
  }

  async function handleRemoveShare(sheetId, email) {
    try { await unshareSheet(sheetId, email); } catch (err) { alert('Could not remove that share: ' + err.message); }
  }

  async function handleSetPublicAccess(sheetId, access) {
    if (access === 'edit' && !confirm('This makes the sheet editable by ANYONE who has the link, with no login at all. Anyone who gets the URL — including if it\'s ever shared further — can change data. Continue?')) return;
    try { await setPublicAccess(sheetId, access); } catch (err) { alert('Could not update public access: ' + err.message); }
  }

  function copyPublicLink(sheetId) {
    // import.meta.env.BASE_URL always matches vite.config.js's `base`
    // setting, so this never goes stale even if the repo gets renamed
    const url = `${window.location.origin}${import.meta.env.BASE_URL}view.html?sheet=${sheetId}`;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copied:\n' + url),
      () => prompt('Copy this link:', url)
    );
  }

  async function handleSaveBankDetails() {
    try {
      await saveBankDetails(bankForm);
      setBankMsg(true);
      setTimeout(() => setBankMsg(false), 3000);
    } catch (err) {
      alert('Could not save bank details: ' + err.message);
    }
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <div>
      <div className="panel-block">
        <h3>Employee Registration</h3>
        <p>Create a login for a new employee. They'll use these credentials on the separate Employee Login screen.</p>
        <div className="grid-2">
          <div className="field"><label>Employee Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@baaz.com" /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" minLength={6} /></div>
          <div className="field"><label>Profile Picture (optional)</label><input type="file" accept="image/*" onChange={(e) => setPicFile(e.target.files[0] || null)} /></div>
        </div>
        {empMsg && <div style={{ marginBottom: 10, fontSize: 12.5, color: empMsg.ok ? 'var(--green)' : 'var(--red)' }}>{empMsg.text}</div>}
        <button className="btn-gold" onClick={handleCreateEmployee}>Create Employee Account</button>
      </div>

      <div className="panel-block">
        <h3>Employees</h3>
        <p>Every employee account, for management purposes. Passwords are hashed on the backend and can only be reset, never viewed.</p>
        {employees.length === 0 ? (
          <div className="empty-note">No employee accounts yet — create one above.</div>
        ) : employees.map((e) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 8, background: 'var(--panel-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {e.profilePic
                ? <img src={e.profilePic} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                : <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{e.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-2)' }}>{e.email}</div>
              </div>
            </div>
            <div className="row-actions">
              <button className="icon-btn" title="Reset password" onClick={() => handleResetPassword(e)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 3v6h-6" /></svg>
              </button>
              <button className="icon-btn danger" title="Delete employee" onClick={() => handleDeleteEmployee(e)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-block">
        <h3>Manage Sheets</h3>
        <p>Create a new sheet (it appears in the sidebar immediately), assign it to specific employees, or delete one you no longer need.</p>
        {registry.map((entry) => {
          const assignedNames = (entry.assignedEmployees || []).map((id) => (employees.find((e) => e.id === id) || {}).name).filter(Boolean);
          return (
            <div key={entry.id} style={{ padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 8, background: 'var(--panel-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: SHEET_ICONS[entry.icon] || SHEET_ICONS.box }} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{entry.name}</span>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="Assign to employees" onClick={() => setOpenAssignPanel(openAssignPanel === entry.id ? null : entry.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /><circle cx="17.5" cy="9" r="2.5" /></svg>
                  </button>
                  <button className="icon-btn" title="Share with anyone by email" onClick={() => setOpenSharePanel(openSharePanel === entry.id ? null : entry.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                  </button>
                  {entry.id !== 'daily-report' && (
                    <button className="icon-btn danger" title="Delete sheet" onClick={() => handleDeleteSheet(entry)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)', marginTop: 6 }}>
                {entry.id === 'daily-report'
                  ? 'Visible to every employee by default (each sees only their own rows).'
                  : (assignedNames.length ? 'Assigned to: ' + assignedNames.join(', ') : 'Manager-only — not assigned to any employee.')}
                {Object.keys(entry.sharedWith || {}).length > 0 && (
                  <span> · Shared with: {Object.entries(entry.sharedWith).map(([em, perm]) => `${em} (${perm})`).join(', ')}</span>
                )}
              </div>
              {openAssignPanel === entry.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {employees.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>No employee accounts yet.</span>}
                    {employees.map((emp) => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={(entry.assignedEmployees || []).includes(emp.id)} onChange={(e) => handleToggleAssign(entry.id, emp.id, e.target.checked)} />
                        {emp.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {openSharePanel === entry.id && entry.id !== 'daily-report' && entry.id !== 'attendance' && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, margin: '0 0 4px' }}>Public link (no login needed)</p>
                  <p style={{ fontSize: 11.5, color: 'var(--muted-2)', margin: '0 0 8px' }}>Anyone with this link can open it directly — no account, no sign-in. Off by default.</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                    <select value={entry.publicAccess || ''} onChange={(ev) => handleSetPublicAccess(entry.id, ev.target.value || null)} style={{ padding: '7px 8px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 12.5 }}>
                      <option value="">Off</option>
                      <option value="view">Anyone can view</option>
                      <option value="edit">Anyone can edit</option>
                    </select>
                    {entry.publicAccess && (
                      <button className="btn-outline" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => copyPublicLink(entry.id)}>Copy link</button>
                    )}
                  </div>

                  <p style={{ fontSize: 12.5, fontWeight: 600, margin: '0 0 4px' }}>Share by email</p>
                  <p style={{ fontSize: 11.5, color: 'var(--muted-2)', margin: '0 0 8px' }}>Give a specific person access. They'll need a free guest sign-up on the Employee Login page with this exact email.</p>
                  {Object.entries(entry.sharedWith || {}).map(([em, perm]) => (
                    <div key={em} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0' }}>
                      <span>{em} — <span style={{ color: 'var(--gold)' }}>{perm}</span></span>
                      <button className="icon-btn danger" style={{ width: 22, height: 22 }} title="Remove access" onClick={() => handleRemoveShare(entry.id, em)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <input type="email" placeholder="someone@example.com" value={shareEmail} onChange={(ev) => setShareEmail(ev.target.value)} style={{ flex: 1, padding: '7px 10px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 12.5 }} />
                    <select value={sharePerm} onChange={(ev) => setSharePerm(ev.target.value)} style={{ padding: '7px 8px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)', fontSize: 12.5 }}>
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <button className="btn-gold" style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => handleAddShare(entry.id)}>Share</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {showCreateSheet && (
          <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 16, marginBottom: 14, background: 'var(--panel-2)' }}>
            <div className="field"><label>Sheet Name</label><input type="text" value={newSheetName} onChange={(e) => setNewSheetName(e.target.value)} placeholder="e.g. Vendor Payments" /></div>
            <div className="field">
              <label>Assign to Employee (optional — leave unchecked for manager-only)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {employees.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>No employee accounts yet — create one above first if you want to assign this sheet.</span>}
                {employees.map((emp) => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newSheetAssign.includes(emp.id)} onChange={(e) => {
                      setNewSheetAssign((prev) => e.target.checked ? [...prev, emp.id] : prev.filter((id) => id !== emp.id));
                    }} />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button className="btn-ghost" onClick={() => setShowCreateSheet(false)}>Cancel</button>
              <button className="btn-gold" style={{ border: 'none' }} onClick={handleCreateSheet}>Create Sheet</button>
            </div>
          </div>
        )}
        {!showCreateSheet && <button className="btn-gold" onClick={() => setShowCreateSheet(true)}>+ Create New Sheet</button>}
      </div>

      <div className="panel-block">
        <h3>Bank Details</h3>
        <p>Fill this in once — it's saved centrally and stays up to date everywhere in the portal that needs it. Update it any time and the change applies immediately.</p>
        <div className="grid-2">
          {BANK_FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <input type="text" value={bankForm[f.key] || ''} onChange={(e) => setBankForm((prev) => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.label} />
            </div>
          ))}
        </div>
        {bankMsg && <div style={{ marginTop: 4, marginBottom: 10, fontSize: 12.5, color: 'var(--green)' }}>Saved. These details are now available everywhere in the portal.</div>}
        <button className="btn-gold" onClick={handleSaveBankDetails}>Save Bank Details</button>
      </div>
    </div>
  );
}
