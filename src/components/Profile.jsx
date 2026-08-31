import { useEffect, useState } from 'react';
import { usePortal } from '../store';
import { fileToDataURL } from '../utils';

export default function Profile() {
  const { user, updateProfile } = usePortal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [picPreview, setPicPreview] = useState('');
  const [pendingPic, setPendingPic] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setPicPreview(user.profilePic || '');
    setPendingPic('');
  }, [user]);

  async function handlePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    setPicPreview(dataUrl);
    setPendingPic(dataUrl);
  }

  async function handleSave() {
    if (!name || !email) { alert('Name and email are required.'); return; }
    try {
      await updateProfile({ name, email, password: password || undefined, profilePic: pendingPic || undefined });
      setPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert('Could not save profile: ' + err.message);
    }
  }

  if (!user) return null;
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <div className="panel-block">
        <h3>Your Profile</h3>
        <p>Update your profile picture, email, or password. Leave the password blank to keep it unchanged.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {picPreview
            ? <img src={picPreview} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }} alt="" />
            : <div className="avatar" style={{ width: 64, height: 64, fontSize: 20 }}>{initials}</div>}
          <input type="file" accept="image/*" onChange={handlePicChange} />
        </div>
        <div className="grid-2">
          <div className="field"><label>Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>New Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
        </div>
        {saved && <div style={{ marginBottom: 10, fontSize: 12.5, color: 'var(--green)' }}>Saved.</div>}
        <button className="btn-gold" onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
