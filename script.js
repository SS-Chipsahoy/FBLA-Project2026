/* =========================================================
   School Lost & Found - Clean script.js (LocalStorage only)
   Roles mapping:
     - "employee"  => Student
     - "employer"  => Teacher/Office
     - "admin"     => Admin
   Storage keys:
     users, currentUser, pendingItems, approvedItems, claims
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $id = (id) => document.getElementById(id);
  const firstExisting = (ids) => ids.map($id).find(Boolean) || null;
  const show = (el) => { if (el) el.style.display = "block"; };
  const hide = (el) => { if (el) el.style.display = "none"; };
  const safeOn = (el, evt, fn) => { if (el) el.addEventListener(evt, fn); };
  const norm = (s) => String(s ?? "").trim();
  const normUser = (s) => norm(s).toLowerCase();
  const nowISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  /* ---------- Storage ---------- */
  const KEY = {
    users: "users",
    currentUser: "currentUser",
    pendingItems: "pendingItems",
    approvedItems: "approvedItems",
    claims: "claims",
  };

  const load = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const getUsers = () => load(KEY.users, []);
  const setUsers = (v) => save(KEY.users, v);

  const getCurrentUser = () => load(KEY.currentUser, null);
  const setCurrentUser = (v) => save(KEY.currentUser, v);

  const getPendingItems = () => load(KEY.pendingItems, []);
  const setPendingItems = (v) => save(KEY.pendingItems, v);

  const getApprovedItems = () => load(KEY.approvedItems, []);
  const setApprovedItems = (v) => save(KEY.approvedItems, v);

  const getClaims = () => load(KEY.claims, []);
  const setClaims = (v) => save(KEY.claims, v);

  /* ---------- IDs (supports your old/new layouts) ---------- */
  const el = {
    // Sections
    home: firstExisting(["home-section", "home", "homepage"]),
    login: firstExisting(["login-form", "login-section", "login"]),
    signup: firstExisting(["signup-form", "signup-section", "signup"]),

    // Dashboards
    studentDash: firstExisting(["employee-dashboard", "student-dashboard"]),
    officeDash: firstExisting(["employer-dashboard", "teacher-dashboard", "office-dashboard"]),
    adminDash: firstExisting(["admin-dashboard"]),

    // Buttons
    btnLogin: firstExisting(["login-btn"]),
    btnSignup: firstExisting(["signup-btn"]),
    btnBackHome: firstExisting(["back-home-btn", "back-to-home"]),
    btnBackHomeLogin: firstExisting(["back-home-login", "login-back-btn", "back-to-home-from-login"]),
    btnBackHomeSignup: firstExisting(["back-home-signup", "signup-back-btn", "back-to-home"]),
    btnOpenReport: firstExisting(["post-job-btn", "open-report-modal", "report-found-btn", "open-post-job-modal"]),
    btnCloseReport: firstExisting(["close-post-job-modal", "close-report-modal"]),
    btnRefreshAdmin: firstExisting(["refresh-all-btn", "refresh-admin-btn", "admin-refresh-btn"]),

    // Forms
    loginForm: firstExisting(["login", "login-form"]),
    signupForm: firstExisting(["signup", "signup-form"]),
    reportForm: firstExisting(["post-item", "report-form", "post-job-form", "found-form"]),
    claimForm: firstExisting(["claim-form", "apply-form"]),

    // Login inputs
    loginUser: firstExisting(["login-username", "login-user", "username-login", "username"]),
    loginPass: firstExisting(["login-password", "login-pass", "password-login", "password"]),

    // Signup inputs
    signupUser: firstExisting(["signup-username", "signup-user", "username-signup"]),
    signupPass: firstExisting(["signup-password", "signup-pass", "password-signup"]),
    signupRole: firstExisting(["signup-role", "role", "role-select"]),

    // Lists
    studentList: firstExisting(["items-list", "found-items", "approved-jobs-list", "student-items-list", "job-listings"]),
    officeList: firstExisting(["office-items-list", "employer-jobs-list", "teacher-items-list", "employer-jobs-container"]),
    officeClaims: firstExisting(["employer-applications-container"]),
    adminPendingList: firstExisting(["admin-pending-list", "pending-jobs-list", "admin-items-pending", "pending-postings"]),
    adminApprovedList: firstExisting(["admin-approved-list", "admin-items-approved"]),
    adminClaimsList: firstExisting(["admin-claims-list", "claims-list-admin"]),

    // Search/filter
    searchInput: firstExisting(["search-input", "search-bar", "student-search"]),
    categoryFilter: firstExisting(["category-filter", "filter-category"]),

    // Modals (optional)
    claimModal: firstExisting(["apply-modal", "claim-modal"]),
    reportModal: firstExisting(["post-job-modal", "report-modal"]),

    // Notification (optional)
    notify: firstExisting(["notification", "toast", "message"]),
  };

  /* ---------- Notifications ---------- */
  function notify(msg, type="info") {
    if (!el.notify) { console.log(`[${type}]`, msg); return; }
    el.notify.textContent = msg;
    el.notify.style.display = "block";
    clearTimeout(notify._t);
    notify._t = setTimeout(() => { el.notify.style.display = "none"; }, 2500);
  }

  /* ---------- View switching ---------- */
  function hideAll() {
    [el.home, el.login, el.signup, el.studentDash, el.officeDash, el.adminDash].forEach(hide);
  }
  function showHome() { hideAll(); show(el.home); }
  function showLogin() { hideAll(); show(el.login); }
  function showSignup() { hideAll(); show(el.signup); }

  function showDashboard(role) {
    hideAll();
    if (role === "employee") show(el.studentDash);
    else if (role === "employer") show(el.officeDash);
    else if (role === "admin") show(el.adminDash);
    else showHome();
  }

  /* ---------- Policy: Teacher/Office posting restrictions ---------- */
  function isRestrictedCategory(cat) {
    const c = norm(cat).toLowerCase();
    if (!c) return false;
    if (c.includes("money") || c.includes("cash")) return true;
    if (c.includes("phone")) return true;
    if (c.includes("handheld")) return true;
    if (c.includes("personal") && c.includes("electronic")) return true;
    return false;
  }

  /* ---------- Models ---------- */
  const uuid = () => "id-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function renderItemCard(item, { claim=false, approve=false, status=false }={}) {
    const img = item.photoDataUrl
      ? `<img src="${item.photoDataUrl}" alt="Photo of ${escapeHtml(item.title)}" style="max-width:180px;max-height:140px;border-radius:8px;">`
      : `<div style="font-size:12px;opacity:.7;">No photo</div>`;

    let actions = "";
    if (claim) actions += `<button type="button" class="btn-claim" data-item-id="${escapeHtml(item.id)}">Claim / Inquiry</button>`;
    if (approve) actions += `
      <button type="button" class="btn-approve" data-item-id="${escapeHtml(item.id)}">Approve</button>
      <button type="button" class="btn-reject" data-item-id="${escapeHtml(item.id)}">Reject</button>
    `;
    if (status) actions += `
      <label style="margin-left:10px;">Status:
        <select class="status-select" data-item-id="${escapeHtml(item.id)}">
          ${["Available","Claimed","Returned","Donated/Disposed"].map(s => `<option value="${s}" ${s===item.status ? "selected":""}>${s}</option>`).join("")}
        </select>
      </label>
    `;

    return `
      <div class="item-card" style="border:1px solid #ddd;border-radius:12px;padding:12px;margin:10px 0;display:flex;gap:14px;">
        <div>${img}</div>
        <div style="flex:1;">
          <h3 style="margin:0 0 6px;">${escapeHtml(item.title || "Unnamed Item")}</h3>
          <div style="font-size:14px;opacity:.9;margin-bottom:6px;">
            <strong>Category:</strong> ${escapeHtml(item.category || "—")} &nbsp; | &nbsp;
            <strong>Found:</strong> ${escapeHtml(item.dateFound || "—")} &nbsp; | &nbsp;
            <strong>Location:</strong> ${escapeHtml(item.locationFound || "—")}
          </div>
          <div style="font-size:14px;margin-bottom:10px;">${escapeHtml(item.description || "")}</div>
          <div style="font-size:13px;opacity:.9;margin-bottom:10px;"><strong>Status:</strong> ${escapeHtml(item.status || "Available")}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${actions}</div>
        </div>
      </div>
    `;
  }

  function renderStudentItems() {
    if (!el.studentList) return;
    const items = getApprovedItems();

    const q = norm(el.searchInput?.value).toLowerCase();
    const cat = norm(el.categoryFilter?.value).toLowerCase();

    const filtered = items.filter(it => {
      const hay = `${it.title??""} ${it.description??""} ${it.locationFound??""}`.toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchCat = !cat || cat === "all" || norm(it.category).toLowerCase() === cat;
      return matchQ && matchCat;
    });

    el.studentList.innerHTML = filtered.length
      ? filtered.map(it => renderItemCard(it, { claim:true })).join("")
      : `<div style="opacity:.8;">No matching items.</div>`;
  }

  function renderOfficeItems() {
    if (!el.officeList) return;
    const u = getCurrentUser();
    if (!u) return;
    const isAdmin = u.role === "admin";
    const items = getPendingItems()
      .concat(getApprovedItems())
      .filter(it => isAdmin || normUser(it.reportedBy) === normUser(u.username));
    el.officeList.innerHTML = items.length
      ? items.map(it => renderItemCard(it)).join("")
      : `<div style="opacity:.8;">No items reported yet.</div>`;

    renderOfficeClaims(u);
  }

  function renderOfficeClaims(u) {
    if (!el.officeClaims) return;
    const approved = getApprovedItems();
    const claims = getClaims();
    const mine = claims.filter(c => {
      const item = approved.find(it => it.id === c.itemId);
      return item && normUser(item.reportedBy) === normUser(u.username);
    });

    el.officeClaims.style.display = mine.length ? "block" : "none";
    el.officeClaims.innerHTML = mine.length
      ? mine.map(c => `
        <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:10px 0;text-align:left;">
          <div><strong>Item:</strong> ${escapeHtml(c.itemTitle)} <span style="opacity:.6;">(${escapeHtml(c.itemId)})</span></div>
          <div><strong>From:</strong> ${escapeHtml(c.name)} ${c.email ? "- "+escapeHtml(c.email) : ""}</div>
          <div><strong>Details:</strong> ${escapeHtml(c.details)}</div>
          <div style="opacity:.7;font-size:12px;">Submitted: ${escapeHtml(c.submittedAt)}</div>
        </div>
      `).join("")
      : `<div style="opacity:.8;">No claims yet.</div>`;
  }

  function renderAdmin() {
    const pending = getPendingItems();
    const approved = getApprovedItems();
    const claims = getClaims();

    if (el.adminPendingList) {
      el.adminPendingList.innerHTML = pending.length
        ? pending.map(it => renderItemCard(it, { approve:true })).join("")
        : `<div style="opacity:.8;">No pending submissions.</div>`;
    }

    if (el.adminApprovedList) {
      el.adminApprovedList.innerHTML = approved.length
        ? approved.map(it => renderItemCard(it, { status:true })).join("")
        : `<div style="opacity:.8;">No approved items yet.</div>`;
    }

    if (el.adminClaimsList) {
      el.adminClaimsList.innerHTML = claims.length
        ? claims.map(c => `
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px;margin:10px 0;">
            <div><strong>Item:</strong> ${escapeHtml(c.itemTitle)} <span style="opacity:.7;">(${escapeHtml(c.itemId)})</span></div>
            <div><strong>From:</strong> ${escapeHtml(c.name)} ${c.email ? "— "+escapeHtml(c.email) : ""}</div>
            <div><strong>Details:</strong> ${escapeHtml(c.details)}</div>
            <div style="opacity:.75;font-size:12px;">Submitted: ${escapeHtml(c.submittedAt)}</div>
          </div>
        `).join("")
        : `<div style="opacity:.8;">No claims yet.</div>`;
    }
  }

  function refreshAll() {
    renderStudentItems();
    renderOfficeItems();
    renderAdmin();
  }

  /* ---------- Modals ---------- */
  const openModal = (m) => { if (m) m.style.display = "flex"; };
  const closeModal = (m) => { if (m) m.style.display = "none"; };

  /* ---------- Auth ---------- */
  function ensureAdmin() {
    const users = getUsers();
    if (!users.some(u => normUser(u.username) === "admin")) {
      users.push({ username:"FBL@dmin", password:"kookies", role:"admin" });
      setUsers(users);
    }
  }

  function signupHandler(e) {
    e.preventDefault();
    const username = norm(el.signupUser?.value);
    const password = norm(el.signupPass?.value);
    let role = norm(el.signupRole?.value).toLowerCase();

    if (role === "student") role = "employee";
    if (role === "teacher" || role === "office" || role === "teacher/office") role = "employer";
    if (role === "admin") { notify("Admin cannot be created from sign-up.", "warn"); return; }
    if (!username || !password) { notify("Enter a username and password.", "warn"); return; }

    const users = getUsers();
    if (users.some(u => normUser(u.username) === normUser(username))) {
      notify("That username already exists.", "warn");
      return;
    }

    users.push({ username, password, role: role || "employee" });
    setUsers(users);
    notify("Account created! Log in now.", "success");
    el.signupForm?.reset();
    showLogin();
  }

  function loginHandler(e) {
    e.preventDefault();
    const username = norm(el.loginUser?.value);
    const password = norm(el.loginPass?.value);
    if (!username || !password) { notify("Enter username + password.", "warn"); return; }

    const users = getUsers();
    const user = users.find(u => normUser(u.username) === normUser(username) && String(u.password) === password);
    if (!user) { notify("Invalid login.", "warn"); return; }

    setCurrentUser({ username: user.username, role: user.role });
    notify("Logged in.", "success");
    el.loginForm?.reset();
    showDashboard(user.role);
    refreshAll();
  }

  function logout() {
    localStorage.removeItem(KEY.currentUser);
    closeModal(el.claimModal);
    closeModal(el.reportModal);
    notify("Logged out.", "info");
    showHome();
  }

  /* ---------- Claims (Student only) ---------- */
  let claimItemId = null;

  function openClaim(itemId) {
    claimItemId = itemId;
    openModal(el.claimModal);
  }

  function claimSubmitHandler(e) {
    e.preventDefault();
    const u = getCurrentUser();
    if (!u || u.role !== "employee") { notify("Students only.", "warn"); return; }

    const item = getApprovedItems().find(it => it.id === claimItemId);
    if (!item) { notify("Item not found.", "warn"); closeModal(el.claimModal); return; }

    const nameEl = firstExisting(["claim-name","apply-name","student-name","claimer-name"]);
    const emailEl = firstExisting(["claim-email","apply-email","student-email","claimer-contact"]);
    const detailsEl = firstExisting(["claim-details","apply-message","claim-message","student-details"]);

    const name = norm(nameEl?.value) || u.username;
    const email = norm(emailEl?.value);
    const details = norm(detailsEl?.value);

    if (!details) { notify("Please add details.", "warn"); return; }

    const claims = getClaims();
    claims.push({
      id: uuid(),
      itemId: item.id,
      itemTitle: item.title,
      name, email, details,
      submittedBy: u.username,
      submittedAt: new Date().toLocaleString(),
    });
    setClaims(claims);

    notify("Claim submitted!", "success");
    el.claimForm?.reset();
    closeModal(el.claimModal);
    renderAdmin();
  }

  /* ---------- Report Found Item (Teacher/Office only) ---------- */
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("read error"));
      r.readAsDataURL(file);
    });
  }

  async function reportSubmitHandler(e) {
    e.preventDefault();
    const u = getCurrentUser();
    if (!u || u.role !== "employer") { notify("Teachers/Office only.", "warn"); return; }

    const titleEl = firstExisting(["item-title","job-title","found-title","item-name"]);
    const descEl = firstExisting(["item-description","job-description","found-description"]);
    const catEl = firstExisting(["item-category","job-category","found-category","category"]);
    const locEl = firstExisting(["item-location","found-location","location-found"]);
    const dateEl = firstExisting(["item-date","found-date","date-found"]);
    const photoEl = firstExisting(["item-photo","found-photo","job-photo","photo-upload"]);
    const schoolIssuedEl = firstExisting(["school-issued","is-school-issued","school-issued-computer"]);

    const title = norm(titleEl?.value);
    const description = norm(descEl?.value);
    const category = norm(catEl?.value);
    const locationFound = norm(locEl?.value);
    const dateFound = norm(dateEl?.value) || nowISODate();
    const isSchoolIssuedComputer = schoolIssuedEl?.checked === true;

    if (!title || !description || !category || !locationFound) {
      notify("Fill out all required fields.", "warn");
      return;
    }

    if (isRestrictedCategory(category) && !isSchoolIssuedComputer) {
      notify("Cannot post money/phones/personal handheld electronics. Exception: school-issued computer.", "warn");
      return;
    }

    const file = photoEl?.files?.[0] || null;
    if (!file) { notify("Photo required.", "warn"); return; }

    let photoDataUrl = "";
    try { photoDataUrl = await readFileAsDataUrl(file); }
    catch { notify("Could not read photo.", "warn"); return; }

    const pending = getPendingItems();
    pending.unshift({
      id: uuid(),
      title, description, category, locationFound, dateFound,
      photoDataUrl,
      status: "Available",
      reportedBy: u.username,
      createdAt: new Date().toLocaleString(),
    });
    setPendingItems(pending);

    notify("Submitted for admin review.", "success");
    el.reportForm?.reset();
    closeModal(el.reportModal);
    renderOfficeItems();
    renderAdmin();
  }

  /* ---------- Admin actions ---------- */
  function approveItem(itemId) {
    const u = getCurrentUser();
    if (!u || u.role !== "admin") return;

    const pending = getPendingItems();
    const idx = pending.findIndex(it => it.id === itemId);
    if (idx < 0) return;

    const item = pending.splice(idx,1)[0];
    setPendingItems(pending);

    item.approvedBy = u.username;
    item.approvedAt = new Date().toLocaleString();

    const approved = getApprovedItems();
    approved.unshift(item);
    setApprovedItems(approved);

    notify("Approved.", "success");
    refreshAll();
  }

  function rejectItem(itemId) {
    const u = getCurrentUser();
    if (!u || u.role !== "admin") return;

    const pending = getPendingItems().filter(it => it.id !== itemId);
    setPendingItems(pending);

    notify("Rejected.", "info");
    refreshAll();
  }

  function updateStatus(itemId, status) {
    const u = getCurrentUser();
    if (!u || u.role !== "admin") return;

    const approved = getApprovedItems();
    const it = approved.find(x => x.id === itemId);
    if (!it) return;

    it.status = status;
    setApprovedItems(approved);
    notify("Status updated.", "success");
    refreshAll();
  }

  /* ---------- Delegation ---------- */
  function delegate(container, evt, selector, fn) {
    if (!container) return;
    container.addEventListener(evt, (e) => {
      const t = e.target.closest(selector);
      if (!t) return;
      fn(t, e);
    });
  }

  /* ---------- Bind UI ---------- */
  function bindUI() {
    // nav
    safeOn(el.btnLogin, "click", showLogin);
    safeOn(el.btnSignup, "click", showSignup);
    safeOn(el.btnBackHome, "click", showHome);
    safeOn(el.btnBackHomeLogin, "click", showHome);
    safeOn(el.btnBackHomeSignup, "click", showHome);

    // forms
    safeOn(el.signupForm, "submit", signupHandler);
    safeOn(el.loginForm, "submit", loginHandler);
    safeOn(el.claimForm, "submit", claimSubmitHandler);
    safeOn(el.reportForm, "submit", reportSubmitHandler);
    safeOn(el.btnCloseReport, "click", () => closeModal(el.reportModal));

    // open report
    safeOn(el.btnOpenReport, "click", () => {
      const u = getCurrentUser();
      if (!u || u.role !== "employer") { notify("Teachers/Office only.", "warn"); return; }
      openModal(el.reportModal);
    });

    // logout (class-based)
    document.querySelectorAll(".logout-btn").forEach(btn => {
      btn.setAttribute("type","button");
      btn.addEventListener("click", logout);
    });

    // search/filter
    safeOn(el.searchInput, "input", renderStudentItems);
    safeOn(el.categoryFilter, "change", renderStudentItems);

    // student claim button
    delegate(el.studentList, "click", ".btn-claim", (btn) => openClaim(btn.dataset.itemId));

    // admin pending approve/reject
    delegate(el.adminPendingList, "click", ".btn-approve", (btn) => approveItem(btn.dataset.itemId));
    delegate(el.adminPendingList, "click", ".btn-reject", (btn) => rejectItem(btn.dataset.itemId));

    // admin status
    delegate(el.adminApprovedList, "change", ".status-select", (sel) => updateStatus(sel.dataset.itemId, sel.value));

    // admin refresh
    safeOn(el.btnRefreshAdmin, "click", refreshAll);
  }

  function initialRoute() {
    const u = getCurrentUser();
    if (u?.role) { showDashboard(u.role); refreshAll(); }
    else showHome();
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureAdmin();
    bindUI();
    initialRoute();
  });

  // Optional: run in console to clear items/claims quickly
  window.__LF_CLEAR_ITEMS__ = () => {
    localStorage.removeItem(KEY.pendingItems);
    localStorage.removeItem(KEY.approvedItems);
    localStorage.removeItem(KEY.claims);
    location.reload();
  };
})();
