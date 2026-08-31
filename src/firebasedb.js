import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updateEmail, updatePassword, updateProfile as updateAuthProfile
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where,
  onSnapshot, serverTimestamp, deleteField, writeBatch
} from 'firebase/firestore';
import { auth, db, secondaryAuth } from './firebase';
import { uid, normLabel, STATUS_OPTIONS } from './utils';

/* ============================================================
   Default sheet structures (columns only — no seed rows). Seeded
   once, the first time an Owner account is created.
   ============================================================ */
const STATUS_LIST = ['Pending', 'In Progress', 'Completed', 'On Hold'];
const PRIORITY_LIST = ['Low', 'Medium', 'High'];
const CLIENT_STATUS_LIST = ['One Time', 'Long Term'];
const COMM_MODE_LIST = ['Upwork', 'Trello', 'Slack', 'Discord', 'Email', 'WhatsApp', 'Fiverr', 'Zoom', 'Other'];
const CONTRACT_TYPE_LIST = ['Per Video', 'Per Project', 'Hourly', 'Monthly Retainer', 'Milestone-Based', 'Other'];
const PAYMENT_STATUS_LIST = ['Unpaid', 'Partial', 'Paid'];
const PAYMENT_MODE_LIST = ['Bank Transfer', 'PayPal', 'Payoneer', 'Upwork Payment', 'Wise', 'Cash', 'Other'];
const FEEDBACK_STATUS_LIST = ['Pending', 'Reviewed', 'Actioned'];
const TERM_LIST = ['Long Term', 'Short Term', 'One Time'];
const BUDGET_PROGRESS_LIST = ['Waiting', 'In Progress', 'Completed'];
const ATTENDANCE_ACTION_LIST = ['Check In', 'Check Out'];
const CLIENT_TYPE_LIST = ['Weekly Client', 'Occasional Client'];
const WORK_STATUS_LIST = ['Active', 'Inactive'];
const DESIGNATION_LIST = ['Manager', 'Senior Video Editor', 'Video Editor', 'Sales Officer', 'Office Boy', 'Internship'];
const DEPARTMENT_LIST = ['Management', 'Editing'];
const EMPLOYEE_STATUS_LIST = ['Active', 'Resigned', 'Terminated', 'Not Active'];
const ASSET_CATEGORY_LIST = ['Furniture', 'Electrical', 'Interior', 'Equipment', 'Networking', 'Utility', 'Other'];
const ASSET_STATUS_LIST = ['Active', 'Inactive', 'Under Repair'];
const EDITING_STATUS_LIST = ['Pending', 'In Progress', 'Completed'];

const SHEET_DEFS = {
  'client-tracking': { name: 'Client Tracking', icon: 'clients', columns: [
    { key: 'sr', label: 'SR.', type: 'text', width: 44 },
    { key: 'year', label: 'Year', type: 'text', width: 56 },
    { key: 'month', label: 'Month', type: 'text', width: 44 },
    { key: 'clientName', label: 'Client', type: 'text', width: 130 },
    { key: 'company', label: 'Company / Brand', type: 'text', width: 120 },
    { key: 'projectTitle', label: 'Project Title', type: 'text', width: 170 },
    { key: 'startDate', label: 'Start', type: 'date' },
    { key: 'deadline', label: 'Deadline', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_LIST },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITY_LIST },
    { key: 'clientStatus', label: 'Client Status', type: 'select', options: CLIENT_STATUS_LIST },
    { key: 'commMode', label: 'Comm. Mode', type: 'select', options: COMM_MODE_LIST },
    { key: 'budgetVideo', label: 'Budget/Video', type: 'text' },
    { key: 'budgetMonth', label: 'Budget/Month', type: 'text' },
    { key: 'contractType', label: 'Contract Type', type: 'select', options: CONTRACT_TYPE_LIST },
    { key: 'milestone', label: 'Milestone', type: 'text' },
    { key: 'milestoneDone', label: 'Milestone Done', type: 'text' },
    { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: PAYMENT_STATUS_LIST },
    { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: PAYMENT_MODE_LIST },
    { key: 'feedback', label: 'Feedback', type: 'text' },
    { key: 'feedbackStatus', label: 'Feedback Status', type: 'select', options: FEEDBACK_STATUS_LIST },
    { key: 'assigned', label: 'Assigned Editor', type: 'text' },
    { key: 'progress', label: 'Progress', type: 'number' },
    { key: 'revisions', label: 'Revisions', type: 'number' },
    { key: 'contractEnd', label: 'Contract End', type: 'date' },
    { key: 'complete', label: 'Complete', type: 'checkbox' }
  ]},
  'salaries-expenses': { name: 'Salaries & Expenses', icon: 'money', columns: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'category', label: 'Category', type: 'select', options: ['Utilities', 'Software/Tools', 'Office Supplies', 'Equipment', 'Salaries', 'Other'] },
    { key: 'item', label: 'Item Description', type: 'text', width: 180 },
    { key: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Cash', 'Bank Transfer', 'Online Payment'] },
    { key: 'amount', label: 'Amount', type: 'text', width: 100 },
    { key: 'status', label: 'Paid/Unpaid', type: 'select', options: PAYMENT_STATUS_LIST },
    { key: 'remarks', label: 'Remarks', type: 'text', width: 160 }
  ]},
  'monthly-budget': { name: 'Monthly Budget Summary', icon: 'chart', columns: [
    { key: 'sr', label: 'Sr.No', type: 'text', width: 50 },
    { key: 'clientName', label: 'Client Name', type: 'text', width: 160 },
    { key: 'term', label: 'Term', type: 'select', options: TERM_LIST },
    { key: 'requirement', label: 'Requirement of Videos', type: 'text', width: 200 },
    { key: 'progress', label: 'Remain Work Progress', type: 'select', options: BUDGET_PROGRESS_LIST },
    { key: 'budget', label: 'Total Budget / Client', type: 'text', width: 120 }
  ]},
  'attendance': { name: 'Attendance (Check In/Out)', icon: 'clock', columns: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'employee', label: 'Employee Name', type: 'text', width: 160 },
    { key: 'action', label: 'Action', type: 'select', options: ATTENDANCE_ACTION_LIST },
    { key: 'time', label: 'Time', type: 'text', width: 100 }
  ]},
  'ongoing-clients': { name: 'On Going Client List', icon: 'clients', columns: [
    { key: 'sr', label: 'SR No', type: 'text', width: 44 },
    { key: 'editor', label: 'Editor', type: 'text', width: 130 },
    { key: 'client', label: 'Client', type: 'text', width: 160 },
    { key: 'deadline', label: 'Deadline', type: 'text', width: 140 },
    { key: 'perWeek', label: 'Per Week', type: 'text', width: 160 },
    { key: 'reservedDays', label: 'Reserved Days', type: 'text', width: 120 },
    { key: 'clientStatus', label: 'Client Status', type: 'select', options: CLIENT_TYPE_LIST },
    { key: 'workStatus', label: 'Work Status', type: 'select', options: WORK_STATUS_LIST }
  ]},
  'employee-details': { name: 'Employee Details', icon: 'users', columns: [
    { key: 'sr', label: 'Sr. No', type: 'text', width: 44 },
    { key: 'employeeName', label: 'Employee Name', type: 'text', width: 160 },
    { key: 'fatherName', label: "Father's Name", type: 'text', width: 140 },
    { key: 'cnic', label: 'CNIC', type: 'text', width: 130 },
    { key: 'contact', label: 'Contact No.', type: 'text', width: 120 },
    { key: 'email', label: 'Email', type: 'text', width: 180 },
    { key: 'designation', label: 'Designation', type: 'select', options: DESIGNATION_LIST },
    { key: 'department', label: 'Department', type: 'select', options: DEPARTMENT_LIST },
    { key: 'basicSalary', label: 'Basic Salary', type: 'text', width: 100 },
    { key: 'allowance', label: 'Allowance', type: 'text', width: 90 },
    { key: 'totalSalary', label: 'Total Salary', type: 'text', width: 100 },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'address', label: 'Address', type: 'text', width: 220 },
    { key: 'status', label: 'Current Status', type: 'select', options: EMPLOYEE_STATUS_LIST },
    { key: 'bank', label: 'Bank', type: 'text', width: 160 },
    { key: 'accountTitle', label: 'Account Title', type: 'text', width: 140 },
    { key: 'accountNumber', label: 'Account Number', type: 'text', width: 160 },
    { key: 'resignationDate', label: 'Resignation Date', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'text', width: 140 }
  ]},
  'salary-increment': { name: 'Salary Increment', icon: 'money', columns: [
    { key: 'sr', label: 'SR. No', type: 'text', width: 44 },
    { key: 'employeeName', label: 'Employee Name', type: 'text', width: 160 },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'basicSalary', label: 'Basic Salary', type: 'text', width: 100 },
    { key: 'incrementDate', label: 'Date of Increment', type: 'date' },
    { key: 'increment', label: 'Increment', type: 'text', width: 90 },
    { key: 'salaryAfter', label: 'Salary After Increment', type: 'text', width: 130 },
    { key: 'reason', label: 'Reason of Increment', type: 'text', width: 220 }
  ]},
  'office-assets': { name: 'Office Assets', icon: 'box', columns: [
    { key: 'sr', label: 'SR No', type: 'text', width: 44 },
    { key: 'assetName', label: 'Asset Name', type: 'text', width: 180 },
    { key: 'category', label: 'Category', type: 'select', options: ASSET_CATEGORY_LIST },
    { key: 'quantity', label: 'Quantity', type: 'text', width: 90 },
    { key: 'location', label: 'Location', type: 'text', width: 140 },
    { key: 'assignedTo', label: 'Assigned To', type: 'text', width: 120 },
    { key: 'status', label: 'Status', type: 'select', options: ASSET_STATUS_LIST }
  ]},
  'company-loan': { name: 'Company Loan Tracker', icon: 'bank', columns: [
    { key: 'month', label: 'Month', type: 'text', width: 70 },
    { key: 'description', label: 'Description', type: 'text', width: 260 },
    { key: 'submitDate', label: 'Submit Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'text', width: 100 },
    { key: 'status', label: 'Paid/Unpaid', type: 'select', options: PAYMENT_STATUS_LIST },
    { key: 'accountDetails', label: 'Account Details', type: 'text', width: 260 }
  ]},
  'client-work-log': { name: 'Client Work Log', icon: 'briefcase', columns: [
    { key: 'sr', label: 'Sr.No', type: 'text', width: 44 },
    { key: 'clientName', label: 'Client Name', type: 'text', width: 150 },
    { key: 'projectName', label: 'Project Name', type: 'text', width: 260 },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'submitDate', label: 'Submit Date', type: 'date' },
    { key: 'budget', label: 'Budget', type: 'text', width: 90 },
    { key: 'paymentStatus', label: 'Paid/Unpaid', type: 'select', options: PAYMENT_STATUS_LIST },
    { key: 'editingStatus', label: 'Editing Status', type: 'select', options: EDITING_STATUS_LIST }
  ]},
  'daily-report': { name: 'Employees Daily Report', icon: 'clock', columns: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'employee', label: 'Employee', type: 'text', width: 140 },
    { key: 'checkIn', label: 'Check-in Time', type: 'text', width: 90 },
    { key: 'checkOut', label: 'Check-out Time', type: 'text', width: 90 },
    { key: 'clientName', label: 'Client Name', type: 'text', width: 140 },
    { key: 'projectName', label: 'Project Name', type: 'text', width: 180 },
    { key: 'currentDay', label: 'Current Project Day', type: 'text', width: 100 },
    { key: 'totalDuration', label: 'Total Project Duration', type: 'text', width: 120 },
    { key: 'workCompleted', label: 'Work Completed Today', type: 'text', width: 160 },
    { key: 'remainingDuration', label: 'Remaining Duration', type: 'text', width: 120 },
    { key: 'workPerformed', label: 'Work Performed', type: 'text', width: 200 },
    { key: 'tasksCompleted', label: 'Tasks Completed', type: 'text', width: 140 },
    { key: 'pendingTasks', label: 'Pending Tasks', type: 'text', width: 140 },
    { key: 'timeSpent', label: 'Time Spent on Project', type: 'text', width: 120 },
    { key: 'issues', label: 'Issues / Delays', type: 'text', width: 160 }
  ]}
};

const IDENTITY_SHEETS = ['daily-report', 'attendance']; // rows here are private to the employee who owns them

function publicUser(uidVal, data) {
  return { id: uidVal, name: data.name, email: data.email, role: data.role, profilePic: data.profilePic || '' };
}

async function getUserDoc(uidVal) {
  const snap = await getDoc(doc(db, 'users', uidVal));
  return snap.exists() ? snap.data() : null;
}

/* Creates any missing default sheets AND patches in fields that got
   added to the schema after this project's sheets were first created
   (sharedWith, publicAccess). This runs every time a manager logs in —
   cheap and fully idempotent — so an older project self-heals instead
   of silently failing permission checks that assume those fields
   exist. This was a real bug: an employee's entire sheet list would
   fail to load because older sheet documents were missing these two
   fields, which the security rules read on every sheet in the list. */
async function ensureSeeded() {
  await Promise.all(Object.keys(SHEET_DEFS).map(async (id) => {
    const def = SHEET_DEFS[id];
    const sheetSnap = await getDoc(doc(db, 'sheets', id));
    if (!sheetSnap.exists()) {
      await setDoc(doc(db, 'sheets', id), {
        name: def.name, icon: def.icon, assignedEmployees: [],
        sharedWith: {}, publicAccess: null, columns: def.columns
      });
    } else {
      const data = sheetSnap.data();
      const patch = {};
      if (data.sharedWith === undefined) patch.sharedWith = {};
      if (data.publicAccess === undefined) patch.publicAccess = null;
      if (data.assignedEmployees === undefined) patch.assignedEmployees = [];
      if (Object.keys(patch).length) await setDoc(doc(db, 'sheets', id), patch, { merge: true });
    }
  }));
  await setDoc(doc(db, 'meta', 'sheetsSeeded'), { done: true });
}

async function logAttendance(employeeUid, employeeName, action) {
  const sheetSnap = await getDoc(doc(db, 'sheets', 'attendance'));
  const cols = sheetSnap.exists() ? sheetSnap.data().columns : [];
  const now = new Date();
  const row = { _ownerUid: employeeUid };
  cols.forEach((c) => {
    if (c.key === 'date') row[c.key] = now.toISOString().slice(0, 10);
    else if (c.key === 'employee') row[c.key] = employeeName;
    else if (c.key === 'action') row[c.key] = action;
    else if (c.key === 'time') row[c.key] = now.toTimeString().slice(0, 5);
    else row[c.key] = '';
  });
  const id = uid();
  await setDoc(doc(db, 'sheets', 'attendance', 'rows', id), row);
}

export const firebasedb = {
  /* ---------------- auth ---------------- */
  async ownerOrManagerExists() {
    const snap = await getDoc(doc(db, 'meta', 'setup'));
    return snap.exists() && snap.data().ownerCreated === true;
  },

  async signup({ name, email, password, role }) {
    if (await this.ownerOrManagerExists()) throw new Error('Sign-up is closed — an Owner/Manager account already exists.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateAuthProfile(cred.user, { displayName: name });
    const data = { name, email: email.toLowerCase(), role: role === 'manager' ? 'manager' : 'owner', profilePic: '', createdAt: serverTimestamp() };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    await setDoc(doc(db, 'meta', 'setup'), { ownerCreated: true });
    await ensureSeeded();
    return { user: publicUser(cred.user.uid, data) };
  },

  async login({ email, password }) {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error('No matching account found.');
    }
    const data = await getUserDoc(cred.user.uid);
    if (!data || (data.role !== 'owner' && data.role !== 'manager')) {
      await signOut(auth);
      throw new Error('No matching account found.');
    }
    // self-heals any sheets missing newer fields (sharedWith, publicAccess) —
    // cheap and safe to run on every manager login
    try { await ensureSeeded(); } catch (err) { console.error('Sheet self-heal failed:', err); }
    return { user: publicUser(cred.user.uid, data) };
  },

  async employeeLogin({ email, password }) {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error('No matching employee account found.');
    }
    const data = await getUserDoc(cred.user.uid);
    if (!data || data.role !== 'employee') {
      await signOut(auth);
      throw new Error('No matching employee account found.');
    }
    // attendance logging is best-effort — it must never be able to
    // block a real login from completing
    try { await logAttendance(cred.user.uid, data.name, 'Check In'); }
    catch (err) { console.error('Attendance check-in failed (login still succeeded):', err); }
    return { user: publicUser(cred.user.uid, data) };
  },

  /* Guest accounts are always open to self-signup — they grant zero
     access on their own. A guest only ever sees whatever a manager
     has explicitly shared with their exact email via the Share button
     on a sheet. */
  async guestSignup({ name, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const data = { name, email: email.toLowerCase(), role: 'guest', profilePic: '', createdAt: serverTimestamp() };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    return { user: publicUser(cred.user.uid, data) };
  },

  async guestLogin({ email, password }) {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error('No matching account found.');
    }
    const data = await getUserDoc(cred.user.uid);
    if (!data || data.role !== 'guest') {
      await signOut(auth);
      throw new Error('No matching account found.');
    }
    return { user: publicUser(cred.user.uid, data) };
  },

  async logout() {
    const u = auth.currentUser;
    if (u) {
      // attendance logging is best-effort — it must never be able to
      // block the actual sign-out from completing (this was a real bug:
      // a failed check-out write used to silently prevent signOut())
      try {
        const data = await getUserDoc(u.uid);
        if (data && data.role === 'employee') await logAttendance(u.uid, data.name, 'Check Out');
      } catch (err) {
        console.error('Attendance check-out failed (logging out anyway):', err);
      }
    }
    await signOut(auth);
  },

  async whoAmI() {
    const u = auth.currentUser;
    if (!u) throw new Error('Not logged in.');
    const data = await getUserDoc(u.uid);
    if (!data) throw new Error('Not logged in.');
    return { user: publicUser(u.uid, data) };
  },

  async updateProfile(fields) {
    const u = auth.currentUser;
    if (!u) throw new Error('Not logged in.');
    const updates = {};
    if (fields.name) updates.name = fields.name;
    if (fields.email) updates.email = fields.email.toLowerCase();
    if (fields.profilePic) updates.profilePic = fields.profilePic;
    await updateDoc(doc(db, 'users', u.uid), updates);
    if (fields.email && fields.email !== u.email) { try { await updateEmail(u, fields.email); } catch (e) { /* may require recent login; ignore here */ } }
    if (fields.password) { try { await updatePassword(u, fields.password); } catch (e) { throw new Error('Could not update password — please log out and back in, then try again.'); } }
    const data = await getUserDoc(u.uid);
    return { user: publicUser(u.uid, data) };
  },

  /* ---------------- employee management (manager only) ---------------- */
  async createEmployee({ name, email, password, profilePic }) {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const data = { name, email: email.toLowerCase(), role: 'employee', profilePic: profilePic || '', createdAt: serverTimestamp() };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    await signOut(secondaryAuth);
    return { user: publicUser(cred.user.uid, data) };
  },

  async listEmployees() {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee')));
    return { employees: snap.docs.map((d) => publicUser(d.id, d.data())) };
  },

  async resetEmployeePassword({ email }) {
    // The client SDK cannot set another user's password directly — only
    // send them a reset link, which they use to set a new one themselves.
    await sendPasswordResetEmail(auth, email);
  },

  async deleteEmployee({ employeeId }) {
    await deleteDoc(doc(db, 'users', employeeId));
    const sheetsSnap = await getDocs(collection(db, 'sheets'));
    await Promise.all(sheetsSnap.docs.map(async (d) => {
      const assigned = d.data().assignedEmployees || [];
      if (assigned.includes(employeeId)) {
        await updateDoc(doc(db, 'sheets', d.id), { assignedEmployees: assigned.filter((id) => id !== employeeId) });
      }
    }));
    // Note: this removes their access and profile immediately. Their
    // underlying Firebase Auth sign-in credential isn't deleted (that
    // needs admin privileges this pure-client setup doesn't have) — but
    // since their user profile is gone, logging in finds no account and
    // they're signed back out automatically.
  },

  /* ---------------- sheet registry ---------------- */
  async getRegistry() {
    const snap = await getDocs(collection(db, 'sheets'));
    return { registry: snap.docs.map((d) => ({ id: d.id, name: d.data().name, icon: d.data().icon, assignedEmployees: d.data().assignedEmployees || [], sharedWith: d.data().sharedWith || {}, publicAccess: d.data().publicAccess || null })) };
  },

  async createSheet({ name, assignedEmployees, columns }) {
    const id = 'sheet-' + normLabel(name).slice(0, 20) + '-' + uid().slice(0, 4);
    await setDoc(doc(db, 'sheets', id), { name, icon: 'box', assignedEmployees: assignedEmployees || [], sharedWith: {}, publicAccess: null, columns });
    return { id };
  },

  async deleteSheet({ sheetId }) {
    const rowsSnap = await getDocs(collection(db, 'sheets', sheetId, 'rows'));
    await Promise.all(rowsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'sheets', sheetId));
  },

  async assignSheet({ sheetId, employeeId, assign }) {
    const snap = await getDoc(doc(db, 'sheets', sheetId));
    const current = new Set((snap.data() || {}).assignedEmployees || []);
    if (assign) current.add(employeeId); else current.delete(employeeId);
    await updateDoc(doc(db, 'sheets', sheetId), { assignedEmployees: Array.from(current) });
  },

  /* ---------------- sharing (view/edit access by exact email) ---------------- */
  async shareSheet({ sheetId, email, permission }) {
    const key = email.toLowerCase().trim();
    await updateDoc(doc(db, 'sheets', sheetId), { [`sharedWith.${key}`]: permission });
  },

  async unshareSheet({ sheetId, email }) {
    const key = email.toLowerCase().trim();
    await updateDoc(doc(db, 'sheets', sheetId), { [`sharedWith.${key}`]: deleteField() });
  },

  /* ---------------- public "anyone with the link" access ---------------- */
  async setPublicAccess({ sheetId, access }) {
    // access is null (off), 'view', or 'edit'
    await updateDoc(doc(db, 'sheets', sheetId), { publicAccess: access });
  },

  /* Used by the standalone public page — deliberately doesn't touch
     auth.currentUser at all, since a public-link visitor is never
     signed in. Firestore itself enforces (via rules) that this only
     succeeds when the sheet's publicAccess is actually set. */
  async getPublicSheet(sheetId) {
    const snap = await getDoc(doc(db, 'sheets', sheetId));
    if (!snap.exists()) throw new Error('This sheet does not exist.');
    const data = snap.data();
    if (!data.publicAccess) throw new Error('This sheet is not publicly shared.');
    const rowsSnap = await getDocs(collection(db, 'sheets', sheetId, 'rows'));
    return {
      name: data.name,
      access: data.publicAccess,
      columns: data.columns,
      rows: rowsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    };
  },

  subscribePublicSheet(sheetId, onChange) {
    return onSnapshot(collection(db, 'sheets', sheetId, 'rows'), (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  },

  async publicSaveRow({ sheetId, row }) {
    const finalRow = { ...row };
    const isNew = !finalRow.id || String(finalRow.id).startsWith('new-');
    const id = isNew ? uid() : finalRow.id;
    delete finalRow.id;
    await setDoc(doc(db, 'sheets', sheetId, 'rows', id), finalRow, { merge: true });
    return { row: { id, ...finalRow } };
  },

  async publicDeleteRow({ sheetId, rowId }) {
    await deleteDoc(doc(db, 'sheets', sheetId, 'rows', rowId));
  },

  /* ---------------- sheet data ---------------- */
  async getSheet({ sheetId }) {
    const sheetSnap = await getDoc(doc(db, 'sheets', sheetId));
    const data = sheetSnap.exists() ? sheetSnap.data() : {};
    const columns = data.columns || [];
    const periods = (data.periods && data.periods.length) ? data.periods : ['General'];
    const u = auth.currentUser;
    const userData = u ? await getUserDoc(u.uid) : null;
    let rowsQuery = collection(db, 'sheets', sheetId, 'rows');
    if (userData && userData.role === 'employee' && IDENTITY_SHEETS.includes(sheetId)) {
      rowsQuery = query(rowsQuery, where('_ownerUid', '==', u.uid));
    }
    const rowsSnap = await getDocs(rowsQuery);
    const rows = rowsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { columns, rows, periods };
  },

  /* Adds a new named period (e.g. "September 2026") to a sheet — like
     adding a new tab within one spreadsheet. Anyone who can edit the
     sheet can add one, same as Google Sheets. */
  async addPeriod({ sheetId, period }) {
    const snap = await getDoc(doc(db, 'sheets', sheetId));
    const current = (snap.data() || {}).periods || ['General'];
    if (!current.includes(period)) {
      await updateDoc(doc(db, 'sheets', sheetId), { periods: [...current, period] });
    }
    return { periods: current.includes(period) ? current : [...current, period] };
  },

  /* Renames a period tab — updates the sheet's period list AND every
     row currently tagged with the old name, in one batch. */
  async renamePeriod({ sheetId, oldName, newName }) {
    const snap = await getDoc(doc(db, 'sheets', sheetId));
    const current = (snap.data() || {}).periods || ['General'];
    if (newName === oldName) return { periods: current };
    if (current.includes(newName)) throw new Error(`A tab named "${newName}" already exists.`);
    const nextPeriods = current.map((p) => (p === oldName ? newName : p));

    const batch = writeBatch(db);
    batch.update(doc(db, 'sheets', sheetId), { periods: nextPeriods });

    // rows saved before periods existed have no `period` field at all —
    // they implicitly belong to the first/oldest tab, so only migrate
    // rows whose `period` explicitly matches the old name
    const rowsSnap = await getDocs(collection(db, 'sheets', sheetId, 'rows'));
    rowsSnap.docs.forEach((d) => {
      if (d.data().period === oldName) batch.update(d.ref, { period: newName });
    });
    await batch.commit();
    return { periods: nextPeriods };
  },

  /* Live-subscribes to a sheet's rows so multiple devices see each
     other's edits in real time. Returns an unsubscribe function. */
  subscribeSheet(sheetId, onChange) {
    const u = auth.currentUser;
    (async () => {
      const userData = u ? await getUserDoc(u.uid) : null;
      let rowsQuery = collection(db, 'sheets', sheetId, 'rows');
      if (userData && userData.role === 'employee' && IDENTITY_SHEETS.includes(sheetId)) {
        rowsQuery = query(rowsQuery, where('_ownerUid', '==', u.uid));
      }
      const unsub = onSnapshot(rowsQuery, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onChange(rows);
      });
      firebasedb._unsub = unsub;
    })();
    return () => { if (firebasedb._unsub) firebasedb._unsub(); };
  },

  async saveRow({ sheetId, row }) {
    const u = auth.currentUser;
    const userData = u ? await getUserDoc(u.uid) : null;
    const finalRow = { ...row };
    if (userData && userData.role === 'employee' && IDENTITY_SHEETS.includes(sheetId)) {
      finalRow._ownerUid = u.uid;
      finalRow.employee = userData.name;
    }
    const isNew = !finalRow.id || String(finalRow.id).startsWith('new-');
    const id = isNew ? uid() : finalRow.id;
    delete finalRow.id;
    await setDoc(doc(db, 'sheets', sheetId, 'rows', id), finalRow, { merge: true });
    return { row: { id, ...finalRow } };
  },

  async deleteRow({ sheetId, rowId }) {
    await deleteDoc(doc(db, 'sheets', sheetId, 'rows', rowId));
  },

  async importCSV({ sheetId, columns, rows }) {
    const existing = await getDocs(collection(db, 'sheets', sheetId, 'rows'));
    await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));
    await updateDoc(doc(db, 'sheets', sheetId), { columns });
    await Promise.all(rows.map((r) => {
      const { id, ...rest } = r;
      return setDoc(doc(db, 'sheets', sheetId, 'rows', id || uid()), rest);
    }));
  },

  /* ---------------- bank details ---------------- */
  async getBankDetails() {
    const snap = await getDoc(doc(db, 'bankDetails', 'main'));
    return { details: snap.exists() ? snap.data() : {} };
  },
  async saveBankDetails({ details }) {
    await setDoc(doc(db, 'bankDetails', 'main'), details);
  }
};
