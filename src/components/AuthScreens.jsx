import { useState, useEffect } from 'react';
import { usePortal } from '../store';

function Mark() {
  return (
    <div className="mark">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 6 L40 20 L30 20 L38 34 L24 26 L10 34 L18 20 L8 20 Z" fill="none" stroke="#c99a3b" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Gate() {
  const { setAuthScreen } = usePortal();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#0d1117,#161d26 60%,#11161c)' }}>
      <div style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center' }}>
        <div style={{ margin: '0 auto 18px', width: 42, height: 42 }}><Mark /></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: '0 0 6px', color: 'var(--text)' }}>BAAZ PORTAL</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 28px' }}>Choose how you're signing in.</p>
        <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setAuthScreen('manager')}>Manager / CEO</button>
        <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setAuthScreen('employee')}>Employee</button>
      </div>
    </div>
  );
}

export function ManagerAuth() {
  const { login, signup, ownerOrManagerExists, portalMode, setAuthScreen } = usePortal();
  const [tab, setTab] = useState('login');
  const [signupClosed, setSignupClosed] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [role, setRole] = useState('owner');

  useEffect(() => {
    ownerOrManagerExists().then(setSignupClosed).catch((err) => setMsg({ text: err.message, type: 'err' }));
  }, [ownerOrManagerExists]);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg(null);
    if (!loginEmail || !loginPassword) { setMsg({ text: 'Please enter both email and password.', type: 'err' }); return; }
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setMsg({ text: err.message, type: 'err' });
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMsg(null);
    if (!signupName || !signupEmail || !signupPassword) { setMsg({ text: 'Please fill in name, email and password.', type: 'err' }); return; }
    try {
      await signup(signupName, signupEmail, signupPassword, role);
    } catch (err) {
      setMsg({ text: err.message, type: 'err' });
    }
  }

  return (
    <div id="authScreen">
      <div className="auth-side">
        <div>
          <div className="brand-row">
            <Mark />
            <div className="brand-name">BAAZ <span>PORTAL</span></div>
          </div>
          <h1 style={{ marginTop: 64 }}>Run the studio<br />from <em>one dashboard.</em></h1>
          <p className="lead">Clients, projects, editors and deadlines — the whole Baaz operation, tracked in one place instead of scattered across sheets and chats.</p>
          <div className="flight-stats">
            <div><b>26</b><span>Tracked fields</span></div>
            <div><b>2</b><span>Admin roles</span></div>
            <div><b>100%</b><span>Offline-ready</span></div>
          </div>
        </div>
        <div className="foot">Baaz Client Tracking · Administration Module v1</div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-card">
          {portalMode === 'gate' && (
            <button className="btn-ghost" style={{ marginBottom: 18, fontSize: 12.5, padding: '7px 12px' }} onClick={() => setAuthScreen('gate')}>← Back</button>
          )}
          <div className="tabs">
            <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Log in</button>
            {!signupClosed && <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Sign up</button>}
          </div>

          {msg && <div className={`auth-msg show ${msg.type}`}>{msg.text}</div>}

          {tab === 'login' && (
            <div className="form-view active">
              <h2>Welcome back</h2>
              <p className="sub">Log in as Owner or Manager to open the portal.</p>
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@baaz.com" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button className="btn-primary" type="submit">Log in</button>
              </form>
              <p className="fine">
                {signupClosed
                  ? 'Sign-up is closed — an Owner/Manager account already exists for this portal. New employees are added by the Owner/Manager from Settings, not here.'
                  : "No account yet? Use the Sign up tab above. The first account you create becomes the Owner of this portal. Employee accounts are created by the Owner/Manager from Settings, not here."}
              </p>
            </div>
          )}

          {tab === 'signup' && !signupClosed && (
            <div className="form-view active">
              <h2>Create your account</h2>
              <p className="sub">Set your role — Owner or Manager — during signup.</p>
              <form onSubmit={handleSignup}>
                <div className="field">
                  <label>Full name</label>
                  <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Hamza Khan" required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@baaz.com" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Minimum 6 characters" required minLength={6} />
                </div>
                <div className="field">
                  <label>Role</label>
                  <div className="role-pick">
                    <label><input type="radio" name="role" checked={role === 'owner'} onChange={() => setRole('owner')} /><span>Owner</span><small>Full control</small></label>
                    <label><input type="radio" name="role" checked={role === 'manager'} onChange={() => setRole('manager')} /><span>Manager</span><small>Runs daily ops</small></label>
                  </div>
                </div>
                <button className="btn-primary" type="submit">Create account</button>
              </form>
              <p className="fine">This portal stores accounts on your Google Sheet backend, not in the browser. Passwords are hashed and never shown back to you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmployeeAuth() {
  const { employeeLogin, portalMode, setAuthScreen } = usePortal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) { setMsg({ text: 'Please enter both email and password.', type: 'err' }); return; }
    try {
      await employeeLogin(email, password);
    } catch (err) {
      setMsg({ text: err.message, type: 'err' });
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#0d1117,#161d26 60%,#11161c)' }}>
      <div style={{ maxWidth: 400, width: '100%', padding: 24 }}>
        <div className="auth-card">
          {portalMode === 'gate' && (
            <button className="btn-ghost" style={{ marginBottom: 18, fontSize: 12.5, padding: '7px 12px' }} onClick={() => setAuthScreen('gate')}>← Back</button>
          )}
          <h2>Employee Login</h2>
          <p className="sub">Use the email and password your manager set up for you.</p>
          {msg && <div className={`auth-msg show ${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@baaz.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn-primary" type="submit">Log in</button>
          </form>
          <p className="fine">Don't have an account? Ask your manager to set one up for you in the portal's Employee Registration section.</p>
          <p className="fine">Been sent a shared sheet instead? <a href="#" onClick={(e) => { e.preventDefault(); setAuthScreen('guest'); }} style={{ color: 'var(--gold)' }}>Log in or sign up as a guest</a>.</p>
        </div>
      </div>
    </div>
  );
}

export function GuestAuth() {
  const { guestLogin, guestSignup, setAuthScreen } = usePortal();
  const [tab, setTab] = useState('login');
  const [msg, setMsg] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setMsg(null);
    if (!loginEmail || !loginPassword) { setMsg({ text: 'Please enter both email and password.', type: 'err' }); return; }
    try {
      await guestLogin(loginEmail, loginPassword);
    } catch (err) {
      setMsg({ text: err.message, type: 'err' });
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMsg(null);
    if (!name || !signupEmail || !signupPassword) { setMsg({ text: 'Please fill in name, email and password.', type: 'err' }); return; }
    try {
      await guestSignup(name, signupEmail, signupPassword);
    } catch (err) {
      setMsg({ text: err.message, type: 'err' });
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#0d1117,#161d26 60%,#11161c)' }}>
      <div style={{ maxWidth: 400, width: '100%', padding: 24 }}>
        <div className="auth-card">
          <button className="btn-ghost" style={{ marginBottom: 18, fontSize: 12.5, padding: '7px 12px' }} onClick={() => setAuthScreen('employee')}>← Back</button>
          <div className="tabs">
            <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Log in</button>
            <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Sign up</button>
          </div>
          {msg && <div className={`auth-msg show ${msg.type}`}>{msg.text}</div>}
          {tab === 'login' ? (
            <div className="form-view active">
              <h2>Guest Login</h2>
              <p className="sub">If a sheet has been shared with your email, log in here to see it.</p>
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button className="btn-primary" type="submit">Log in</button>
              </form>
            </div>
          ) : (
            <div className="form-view active">
              <h2>Create a guest account</h2>
              <p className="sub">This alone gives you no access to anything — you'll only see sheets a manager has specifically shared with this exact email.</p>
              <form onSubmit={handleSignup}>
                <div className="field">
                  <label>Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Minimum 6 characters" required minLength={6} />
                </div>
                <button className="btn-primary" type="submit">Create account</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
