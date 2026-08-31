import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { firebasedb } from './firebasedb';

const PortalContext = createContext(null);
export function usePortal() {
  return useContext(PortalContext);
}

export function PortalProvider({ portalMode, children }) {
  const [user, setUser] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankDetails, setBankDetailsState] = useState({});
  const [sheets, setSheets] = useState({});
  const [activeView, setActiveView] = useState('dashboard');
  const [booted, setBooted] = useState(false);
  const [authScreen, setAuthScreen] = useState(portalMode === 'gate' ? 'gate' : portalMode);
  const unsubSheetRef = useRef(null);

  const clearSession = useCallback(() => {
    if (unsubSheetRef.current) { unsubSheetRef.current(); unsubSheetRef.current = null; }
    setUser(null); setSheets({}); setRegistry([]); setEmployees([]);
    setActiveView('dashboard');
    setAuthScreen(portalMode === 'gate' ? 'gate' : portalMode);
  }, [portalMode]);

  // Firebase Auth persists sessions itself (survives refresh) — this
  // just reflects that state into our own `user` (with role/profile).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); setBooted(true); return; }
      try {
        const r = await firebasedb.whoAmI();
        setUser(r.user);
      } catch (e) {
        setUser(null);
      }
      setBooted(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user) {
      firebasedb.getRegistry()
        .then((r) => setRegistry(r.registry))
        .catch((err) => console.error('Could not load sheet registry:', err));
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    const r = await firebasedb.login({ email, password });
    setUser(r.user);
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const r = await firebasedb.signup({ name, email, password, role });
    setUser(r.user);
  }, []);

  const employeeLogin = useCallback(async (email, password) => {
    const r = await firebasedb.employeeLogin({ email, password });
    setUser(r.user);
  }, []);

  const guestSignup = useCallback(async (name, email, password) => {
    const r = await firebasedb.guestSignup({ name, email, password });
    setUser(r.user);
  }, []);

  const guestLogin = useCallback(async (email, password) => {
    const r = await firebasedb.guestLogin({ email, password });
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    await firebasedb.logout();
    clearSession();
  }, [clearSession]);

  const ownerOrManagerExists = useCallback(async () => {
    return firebasedb.ownerOrManagerExists();
  }, []);

  /* Live subscription: switching to a sheet replaces any previous
     listener. From then on, edits from any device (or your own
     background save) flow straight into `sheets[sheetId].rows`
     automatically — no manual refetch, no manual optimistic patching. */
  const ensureSheet = useCallback(async (sheetId) => {
    if (unsubSheetRef.current) { unsubSheetRef.current(); unsubSheetRef.current = null; }
    const r = await firebasedb.getSheet({ sheetId });
    setSheets((prev) => ({ ...prev, [sheetId]: { columns: r.columns, rows: r.rows, periods: r.periods } }));
    unsubSheetRef.current = firebasedb.subscribeSheet(sheetId, (rows) => {
      setSheets((prev) => ({ ...prev, [sheetId]: { ...prev[sheetId], rows } }));
    });
  }, []);

  const loadSheet = ensureSheet;

  const addPeriod = useCallback(async (sheetId, period) => {
    const r = await firebasedb.addPeriod({ sheetId, period });
    setSheets((prev) => ({ ...prev, [sheetId]: { ...prev[sheetId], periods: r.periods.includes(period) ? r.periods : [...r.periods, period] } }));
  }, []);

  const renamePeriod = useCallback(async (sheetId, oldName, newName) => {
    const r = await firebasedb.renamePeriod({ sheetId, oldName, newName });
    setSheets((prev) => {
      const sheet = prev[sheetId];
      if (!sheet) return prev;
      const rows = sheet.rows.map((row) => (row.period === oldName ? { ...row, period: newName } : row));
      return { ...prev, [sheetId]: { ...sheet, periods: r.periods, rows } };
    });
  }, []);

  const saveRow = useCallback(async (sheetId, row) => {
    const r = await firebasedb.saveRow({ sheetId, row });
    return r.row;
  }, []);

  const deleteRow = useCallback(async (sheetId, rowId) => {
    await firebasedb.deleteRow({ sheetId, rowId });
  }, []);

  const importCSV = useCallback(async (sheetId, columns, rows) => {
    await firebasedb.importCSV({ sheetId, columns, rows });
    setSheets((prev) => ({ ...prev, [sheetId]: { ...prev[sheetId], columns, rows } }));
  }, []);

  const loadEmployees = useCallback(async () => {
    const r = await firebasedb.listEmployees();
    setEmployees(r.employees);
    return r.employees;
  }, []);

  const loadRegistry = useCallback(async () => {
    const r = await firebasedb.getRegistry();
    setRegistry(r.registry);
    return r.registry;
  }, []);

  const loadBankDetails = useCallback(async () => {
    const r = await firebasedb.getBankDetails();
    setBankDetailsState(r.details);
    return r.details;
  }, []);

  const createEmployeeAccount = useCallback(async (name, email, password, profilePic) => {
    await firebasedb.createEmployee({ name, email, password, profilePic });
    await loadEmployees();
  }, [loadEmployees]);

  const resetEmployeePassword = useCallback(async (employeeId, employeeEmail) => {
    await firebasedb.resetEmployeePassword({ email: employeeEmail });
  }, []);

  const deleteEmployee = useCallback(async (employeeId) => {
    await firebasedb.deleteEmployee({ employeeId });
    await loadEmployees();
    await loadRegistry();
  }, [loadEmployees, loadRegistry]);

  const createSheet = useCallback(async (name, assignedEmployees, columns) => {
    const r = await firebasedb.createSheet({ name, assignedEmployees, columns });
    await loadRegistry();
    return r.id;
  }, [loadRegistry]);

  const deleteSheet = useCallback(async (sheetId) => {
    await firebasedb.deleteSheet({ sheetId });
    setSheets((prev) => { const next = { ...prev }; delete next[sheetId]; return next; });
    await loadRegistry();
  }, [loadRegistry]);

  const assignSheet = useCallback(async (sheetId, employeeId, assign) => {
    await firebasedb.assignSheet({ sheetId, employeeId, assign });
    setRegistry((prev) => prev.map((e) => {
      if (e.id !== sheetId) return e;
      const set = new Set(e.assignedEmployees || []);
      if (assign) set.add(employeeId); else set.delete(employeeId);
      return { ...e, assignedEmployees: Array.from(set) };
    }));
  }, []);

  const shareSheet = useCallback(async (sheetId, email, permission) => {
    await firebasedb.shareSheet({ sheetId, email, permission });
    const key = email.toLowerCase().trim();
    setRegistry((prev) => prev.map((e) => e.id === sheetId ? { ...e, sharedWith: { ...(e.sharedWith || {}), [key]: permission } } : e));
  }, []);

  const unshareSheet = useCallback(async (sheetId, email) => {
    await firebasedb.unshareSheet({ sheetId, email });
    const key = email.toLowerCase().trim();
    setRegistry((prev) => prev.map((e) => {
      if (e.id !== sheetId) return e;
      const next = { ...(e.sharedWith || {}) };
      delete next[key];
      return { ...e, sharedWith: next };
    }));
  }, []);

  const setPublicAccess = useCallback(async (sheetId, access) => {
    await firebasedb.setPublicAccess({ sheetId, access });
    setRegistry((prev) => prev.map((e) => e.id === sheetId ? { ...e, publicAccess: access } : e));
  }, []);

  const saveBankDetails = useCallback(async (details) => {
    await firebasedb.saveBankDetails({ details });
    setBankDetailsState(details);
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const r = await firebasedb.updateProfile(fields);
    setUser(r.user);
    return r.user;
  }, []);

  const accessibleSheetIds = useCallback((u) => {
    if (!u) return [];
    if (u.role === 'guest') {
      return registry.filter((e) => Object.keys(e.sharedWith || {}).includes((u.email || '').toLowerCase())).map((e) => e.id);
    }
    if (u.role !== 'employee') return registry.map((e) => e.id);
    return registry.filter((e) => e.id === 'daily-report' || e.id === 'attendance' || (e.assignedEmployees || []).includes(u.id)).map((e) => e.id);
  }, [registry]);

  /* 'edit' | 'view' | null — what a guest can do on a given sheet.
     Managers/owners/employees are never restricted this way. */
  const sharePermissionFor = useCallback((u, sheetId) => {
    if (!u || u.role !== 'guest') return null;
    const entry = registry.find((e) => e.id === sheetId);
    if (!entry) return null;
    return (entry.sharedWith || {})[(u.email || '').toLowerCase()] || null;
  }, [registry]);

  const value = {
    portalMode, authScreen, setAuthScreen,
    user, registry, employees, bankDetails, sheets, activeView, setActiveView,
    booted,
    login, signup, employeeLogin, guestSignup, guestLogin, logout, ownerOrManagerExists,
    loadSheet, ensureSheet, addPeriod, renamePeriod, saveRow, deleteRow, importCSV,
    loadEmployees, loadRegistry, loadBankDetails,
    createEmployeeAccount, resetEmployeePassword, deleteEmployee,
    createSheet, deleteSheet, assignSheet, shareSheet, unshareSheet, setPublicAccess, saveBankDetails,
    updateProfile, accessibleSheetIds, sharePermissionFor
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}
