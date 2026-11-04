const firebaseConfig = {
  apiKey: "AIzaSyCRXCp75adfyFUbyZHlgRGQtu2vqb-TPMM",
  authDomain: "hostel-cloud-pk.firebaseapp.com",
  projectId: "hostel-cloud-pk",
  storageBucket: "hostel-cloud-pk.firebasestorage.app",
  messagingSenderId: "394742737685",
  appId: "1:394742737685:web:a8faef1ab5bf69d84e971c"
};

const MASTER_FOUNDER_EMAIL = "jameelfaisal177@gmail.com";
const MASTER_FOUNDER_PASS = "Qwerty@12345";

const emptyDB = {
  settings: {
    hostelName: "Hostel ERP Console",
    jazzcash: "JazzCash / Easypaisa: Not Set",
    bankAccount: "Bank Account: Not Set",
    adminWhatsApp: "",
    adminEmail: MASTER_FOUNDER_EMAIL,
    adminPass: MASTER_FOUNDER_PASS,
    wardenEmail: MASTER_FOUNDER_EMAIL,
    wardenPass: MASTER_FOUNDER_PASS,
    isSuspended: false
  },
  rooms: [],
  students: [],
  applications: [],
  complaints: [],
  leaves: [],
  visitors: [],
  expenses: [],
  inventory: [],
  staff: [],
  messMenu: [],
  logs: [
    { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: "System", action: "System ready." }
  ]
};

// ============================================================================
// 1. MULTI-TENANT SAAS ENGINE & CLOUD SYNC
// ============================================================================
const urlParams = new URLSearchParams(window.location.search);
const TENANT_ID = (urlParams.get("hostel") || "main_hostel").toLowerCase().replace(/[^a-z0-9_-]/g, "");
const DB_KEY = "HOSTEL_SAAS_DB_" + TENANT_ID;
let cloudDocRef = null;

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("tel:") && !href.includes("?hostel=")) {
      link.setAttribute("href", `${href}?hostel=${TENANT_ID}`);
    }
  });
});

function isMasterPage() {
  return location.pathname.toLowerCase().includes("master") || !!document.getElementById("masterLoginGate");
}

function startFirestoreListener() {
  try {
    const firestore = firebase.firestore();
    if (isMasterPage()) {
      if (typeof loadAllCloudTenants === "function" && sessionStorage.getItem("MASTER_HQ_AUTH") === "true") {
        loadAllCloudTenants();
      }
      return;
    }

    cloudDocRef = firestore.collection("hostel_system").doc(TENANT_ID);
    cloudDocRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const cloudData = docSnap.data();
        cloudData.settings = cloudData.settings || {};

        if (cloudData.settings.isSuspended === true && !isMasterPage()) {
          document.body.innerHTML = `
            <div style="background:#020617;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:24px;">
              <div style="width:70px;height:70px;border-radius:20px;background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.4);display:flex;align-items:center;justify-content:center;font-size:32px;color:#f43f5e;margin-bottom:16px;">🔒</div>
              <h1 style="color:#f43f5e;font-size:26px;font-weight:800;margin:0;">Software License Suspended</h1>
              <p style="color:#94a3b8;max-width:420px;margin-top:10px;font-size:14px;line-height:1.6;">
                Access to <strong>${cloudData.settings.hostelName || TENANT_ID}</strong> has been temporarily locked due to an expired subscription.
              </p>
            </div>`;
          return;
        }

        try { localStorage.setItem(DB_KEY, JSON.stringify(cloudData)); } catch (e) {}
        refreshCurrentPortalUI();
      }
    }, (err) => {
      console.error("Firestore Sync Error:", err);
    });
  } catch (err) {
    console.error("Firestore Listener Error:", err);
  }
}

function initSecureFirebase() {
  if (typeof firebase === "undefined") return;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const connectWithAuth = () => {
    let started = false;
    if (typeof firebase.auth === "function") {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          if (!started) { started = true; startFirestoreListener(); }
        } else {
          firebase.auth().signInAnonymously().catch(() => {
            if (!started) { started = true; startFirestoreListener(); }
          });
        }
      });
    } else {
      startFirestoreListener();
    }
  };

  if (typeof firebase.auth === "function") {
    connectWithAuth();
  } else {
    const authScript = document.createElement("script");
    authScript.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";
    authScript.onload = connectWithAuth;
    authScript.onerror = () => startFirestoreListener();
    document.head.appendChild(authScript);
  }
}

initSecureFirebase();

// ============================================================================
// 2. LOGIN GATES, 2-PAYMENT OPTIONS & OLD/NEW SECURITY SELECTOR
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  upgradePortalLoginGates();
  upgradeAdminPaymentSettings();
  upgradeSecurityStatusSelectors();
  injectRulesCheckboxInAdmissionForm();
});

function upgradeAdminPaymentSettings() {
  const jcInput = document.getElementById("setJazzCash");
  if (jcInput && !document.getElementById("setBankAccount")) {
    const jcLabel = jcInput.previousElementSibling;
    if (jcLabel) jcLabel.innerText = "Payment Option 1: JazzCash / Easypaisa *";
    jcInput.placeholder = "e.g., JazzCash: 0300-1234567 (M. Ali)";

    const bankDiv = document.createElement("div");
    bankDiv.innerHTML = `
      <label class="block font-bold text-zinc-700 mb-1">Payment Option 2: Bank Account / IBAN (Optional)</label>
      <input id="setBankAccount" type="text" placeholder="e.g., Meezan Bank: 0102-010548921 (Hostel Account)" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-900 font-semibold" />
    `;
    jcInput.parentElement.insertAdjacentElement("afterend", bankDiv);

    const admPassInput = document.getElementById("setAdminPass");
    if (admPassInput && !document.getElementById("setAdminEmail")) {
      const admEmailDiv = document.createElement("div");
      admEmailDiv.innerHTML = `
        <label class="block font-bold text-zinc-700 mb-1">Authorized Admin Login Email *</label>
        <input id="setAdminEmail" type="email" required placeholder="admin@gmail.com" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-900 font-semibold" />
      `;
      admPassInput.parentElement.insertAdjacentElement("beforebegin", admEmailDiv);

      const warEmailDiv = document.createElement("div");
      warEmailDiv.innerHTML = `
        <label class="block font-bold text-zinc-700 mb-1">Authorized Warden Login Email *</label>
        <input id="setWardenEmail" type="email" required placeholder="warden@gmail.com" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-900 font-semibold" />
      `;
      admPassInput.parentElement.insertAdjacentElement("afterend", warEmailDiv);
    }

    window.populateSettingsForm = function() {
      const db = getDB();
      const s = db.settings || {};
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      if (document.getElementById("setHostelName")) document.getElementById("setHostelName").value = s.hostelName || "";
      if (document.getElementById("setJazzCash")) document.getElementById("setJazzCash").value = s.jazzcash || "";
      if (document.getElementById("setBankAccount")) document.getElementById("setBankAccount").value = s.bankAccount || "";
      if (document.getElementById("setWhatsApp")) document.getElementById("setWhatsApp").value = s.adminWhatsApp || "";
      if (document.getElementById("setMonth")) document.getElementById("setMonth").value = s.currentMonth || "";
      if (document.getElementById("setAdminEmail")) document.getElementById("setAdminEmail").value = s.adminEmail || MASTER_FOUNDER_EMAIL;
      if (document.getElementById("setAdminPass")) document.getElementById("setAdminPass").value = s.adminPass || "";
      if (document.getElementById("setWardenEmail")) document.getElementById("setWardenEmail").value = s.wardenEmail || MASTER_FOUNDER_EMAIL;
      if (document.getElementById("setWardenPass")) document.getElementById("setWardenPass").value = s.wardenPass || "";
    };

    window.saveAdminSettings = function(e) {
      e.preventDefault();
      const db = getDB();
      db.settings = db.settings || {};
      db.settings.hostelName = document.getElementById("setHostelName").value.trim();
      db.settings.jazzcash = document.getElementById("setJazzCash").value.trim();
      db.settings.bankAccount = (document.getElementById("setBankAccount")?.value || "").trim();
      db.settings.adminWhatsApp = document.getElementById("setWhatsApp").value.trim();
      db.settings.currentMonth = document.getElementById("setMonth").value.trim();
      if (document.getElementById("setAdminEmail")) db.settings.adminEmail = document.getElementById("setAdminEmail").value.trim().toLowerCase();
      db.settings.adminPass = document.getElementById("setAdminPass").value.trim();
      if (document.getElementById("setWardenEmail")) db.settings.wardenEmail = document.getElementById("setWardenEmail").value.trim().toLowerCase();
      db.settings.wardenPass = document.getElementById("setWardenPass").value.trim();

      saveDB(db, "Updated hostel settings, payment channels & security credentials", "Admin");
      if (typeof renderAdminAll === "function") renderAdminAll();
      alert("✅ Hostel Settings, Payment Options & Login Credentials Saved!");
    };

    window.populateSettingsForm();
  }
}

function upgradeSecurityStatusSelectors() {
  const allotSecInput = document.getElementById("allotSecInput");
  if (allotSecInput && !document.getElementById("allotSecStatus")) {
    const secStatDiv = document.createElement("div");
    secStatDiv.className = "col-span-2";
    secStatDiv.innerHTML = `
      <label class="block font-bold text-zinc-700 mb-1">Security Deposit Billing Status *</label>
      <select id="allotSecStatus" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-bold">
        <option value="charge_now">➕ Unpaid (New Admission — Add to 1st Month Voucher)</option>
        <option value="already_paid">✓ Already Paid Earlier (Existing Student — Do NOT Add to Voucher)</option>
      </select>
    `;
    allotSecInput.parentElement.parentElement.insertAdjacentElement("afterend", secStatDiv);
  }

  const stuSecInput = document.getElementById("stuSecurity");
  if (stuSecInput && !document.getElementById("stuSecStatus")) {
    const stuStatDiv = document.createElement("div");
    stuStatDiv.innerHTML = `
      <label class="block font-bold text-zinc-700 mb-1">Security Status *</label>
      <select id="stuSecStatus" class="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-2 text-zinc-900 font-bold">
        <option value="charge_now">➕ Add to Voucher (New)</option>
        <option value="already_paid">✓ Already Paid (Old Student)</option>
      </select>
    `;
    stuSecInput.parentElement.insertAdjacentElement("afterend", stuStatDiv);
  }

  if (typeof window.openApproveModal === "function") {
    const _origOpenApprove = window.openApproveModal;
    window.openApproveModal = function(appId) {
      _origOpenApprove(appId);
      const db = getDB();
      const app = (db.applications || []).find(a => String(a.id) === String(appId));
      const sel = document.getElementById("allotSecStatus");
      if (app && sel) {
        sel.value = (app.resType === "Existing") ? "already_paid" : "charge_now";
      }
    };
  }

  if (typeof window.confirmApproveAndAllot === "function") {
    const _origConfirmAllot = window.confirmApproveAndAllot;
    window.confirmApproveAndAllot = function(e) {
      const isAlreadyPaid = document.getElementById("allotSecStatus")?.value === "already_paid";
      _origConfirmAllot(e);
      const db = getDB();
      if (db.students && db.students[0]) {
        db.students[0].securityPaid = isAlreadyPaid;
        saveDB(db);
        if (typeof renderAdminAll === "function") renderAdminAll();
      }
    };
  }

  if (typeof window.addStudentManual === "function") {
    const _origAddManual = window.addStudentManual;
    window.addStudentManual = function(e) {
      const isAlreadyPaid = document.getElementById("stuSecStatus")?.value === "already_paid";
      _origAddManual(e);
      const db = getDB();
      if (db.students && db.students[0]) {
        db.students[0].securityPaid = isAlreadyPaid;
        saveDB(db);
        if (typeof renderAdminAll === "function") renderAdminAll();
      }
    };
  }
}

function upgradePortalLoginGates() {
  const adminForm = document.querySelector("#adminLoginGate form");
  if (adminForm && !document.getElementById("adminEmailInput")) {
    const emailDiv = document.createElement("div");
    emailDiv.innerHTML = `
      <label class="block text-xs font-semibold text-zinc-700 mb-1.5">Authorized Admin Email *</label>
      <input id="adminEmailInput" type="email" required placeholder="Enter Registered Admin Email" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white outline-none mb-3" />
    `;
    adminForm.insertBefore(emailDiv, adminForm.firstChild);
  }

  const wardenForm = document.querySelector("#wardenLoginGate form");
  if (wardenForm && !document.getElementById("wardenEmailInput")) {
    const emailDiv = document.createElement("div");
    emailDiv.innerHTML = `
      <label class="block text-xs font-bold text-zinc-700 mb-1.5">Authorized Warden Email *</label>
      <input id="wardenEmailInput" type="email" required placeholder="Enter Registered Warden Email" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 font-semibold focus:border-zinc-900 focus:bg-white outline-none mb-3" />
    `;
    wardenForm.insertBefore(emailDiv, wardenForm.firstChild);
  }

  const stuForm = document.querySelector("#studentLoginGate form");
  if (stuForm && !document.getElementById("stuPassInput")) {
    const passDiv = document.createElement("div");
    passDiv.innerHTML = `
      <label class="block font-bold text-zinc-700 mb-1.5">Student Password / PIN *</label>
      <input id="stuPassInput" type="password" required placeholder="Enter password issued by Hostel Admin" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-3 text-sm text-zinc-900 font-semibold focus:border-zinc-900 focus:bg-white outline-none" />
    `;
    const submitBtn = stuForm.querySelector("button[type='submit']");
    if (submitBtn) stuForm.insertBefore(passDiv, submitBtn);
  }
}

// ============================================================================
// 3. STRICT PRE-AUTHORIZED LOGIN VERIFIERS
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  window.verifyAdminLogin = async function(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById("adminEmailInput");
    const passInput = document.getElementById("adminPassInput");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";
    if (!email || !pass) return alert("⚠️ Please enter both Admin Email and Password!");

    let db = getDB();
    if (cloudDocRef) {
      try {
        const snap = await cloudDocRef.get();
        if (snap.exists) { db = snap.data(); localStorage.setItem(DB_KEY, JSON.stringify(db)); }
      } catch (err) {}
    }

    const set = db.settings || {};
    const savedEmail = (set.adminEmail || MASTER_FOUNDER_EMAIL).trim().toLowerCase();
    const savedPass = (set.adminPass || MASTER_FOUNDER_PASS).trim();

    const isFounder = (email === MASTER_FOUNDER_EMAIL.toLowerCase() && pass === MASTER_FOUNDER_PASS);
    const isTenantAdmin = (email === savedEmail && pass === savedPass);

    if (isFounder || isTenantAdmin) {
      try { sessionStorage.setItem("ADMIN_AUTH_" + TENANT_ID, "true"); } catch (err) {}
      const gate = document.getElementById("adminLoginGate");
      if (gate) { gate.classList.remove("flex"); gate.classList.add("hidden"); gate.style.setProperty("display", "none", "important"); }
      if (typeof renderAdminAll === "function") renderAdminAll();
    } else {
      alert("❌ Access Denied!\nInvalid Admin Email or Password.");
    }
  };

  window.handleWardenLogin = async function(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById("wardenEmailInput");
    const passInput = document.getElementById("wardenPassInput");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";
    if (!email || !pass) return alert("⚠️ Please enter both Warden Email and Password!");

    let db = getDB();
    if (cloudDocRef) {
      try {
        const snap = await cloudDocRef.get();
        if (snap.exists) { db = snap.data(); localStorage.setItem(DB_KEY, JSON.stringify(db)); }
      } catch (err) {}
    }

    const set = db.settings || {};
    const savedEmail = (set.wardenEmail || set.adminEmail || MASTER_FOUNDER_EMAIL).trim().toLowerCase();
    const savedPass = (set.wardenPass || MASTER_FOUNDER_PASS).trim();

    const isFounder = (email === MASTER_FOUNDER_EMAIL.toLowerCase() && pass === MASTER_FOUNDER_PASS);
    const isTenantWarden = (email === savedEmail && pass === savedPass);

    if (isFounder || isTenantWarden) {
      try { sessionStorage.setItem("WARDEN_AUTH_" + TENANT_ID, "true"); } catch (err) {}
      const gate = document.getElementById("wardenLoginGate");
      if (gate) { gate.classList.remove("flex"); gate.classList.add("hidden"); gate.style.setProperty("display", "none", "important"); }
      if (typeof renderWardenConsole === "function") renderWardenConsole();
    } else {
      alert("❌ Access Denied!\nInvalid Warden Email or Password.");
    }
  };
});

// ============================================================================
// 4. CORE DATABASE HELPERS & ACCURATE LIVE METRICS (INCLUDING SECURITY DUE)
// ============================================================================
function refreshCurrentPortalUI() {
  if (typeof renderAdminAll === "function") renderAdminAll();
  if (typeof loadPublicSite === "function") loadPublicSite();
  if (typeof renderPublicPage === "function") renderPublicPage();
  if (typeof renderWardenConsole === "function") renderWardenConsole();
  if (typeof renderStudentDashboard === "function" && window.loggedStudent) renderStudentDashboard();
}

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const fresh = JSON.parse(JSON.stringify(emptyDB));
      localStorage.setItem(DB_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const parsed = JSON.parse(raw);
    parsed.settings = parsed.settings || {};
    if (!parsed.settings.adminEmail) parsed.settings.adminEmail = MASTER_FOUNDER_EMAIL;
    if (!parsed.settings.adminPass) parsed.settings.adminPass = MASTER_FOUNDER_PASS;
    if (!parsed.settings.wardenEmail) parsed.settings.wardenEmail = parsed.settings.adminEmail || MASTER_FOUNDER_EMAIL;
    if (!parsed.settings.wardenPass) parsed.settings.wardenPass = MASTER_FOUNDER_PASS;
    return parsed;
  } catch (e) {
    return JSON.parse(JSON.stringify(emptyDB));
  }
}

function saveDB(db, actionText, actor = "Admin") {
  if (actionText) {
    db.logs = db.logs || [];
    db.logs.unshift({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor,
      action: actionText
    });
  }
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) {}
  if (cloudDocRef) {
    cloudDocRef.set(db).catch(err => console.error("Cloud Sync Error:", err));
  }
}

function wipeAllData() {
  if (confirm("Are you sure? This will wipe all rooms, students, and records from Cloud & Local (Your Hostel Name & Passwords will be kept)!")) {
    const currentDB = getDB();
    const fresh = JSON.parse(JSON.stringify(emptyDB));
    if (currentDB && currentDB.settings) {
      fresh.settings = {
        ...fresh.settings,
        hostelName: currentDB.settings.hostelName || fresh.settings.hostelName,
        jazzcash: currentDB.settings.jazzcash || fresh.settings.jazzcash,
        bankAccount: currentDB.settings.bankAccount || "",
        adminWhatsApp: currentDB.settings.adminWhatsApp || "",
        adminEmail: currentDB.settings.adminEmail || MASTER_FOUNDER_EMAIL,
        adminPass: currentDB.settings.adminPass || MASTER_FOUNDER_PASS,
        wardenEmail: currentDB.settings.wardenEmail || MASTER_FOUNDER_EMAIL,
        wardenPass: currentDB.settings.wardenPass || MASTER_FOUNDER_PASS,
        currentMonth: currentDB.settings.currentMonth || "",
        isSuspended: currentDB.settings.isSuspended || false
      };
    }
    try { localStorage.setItem(DB_KEY, JSON.stringify(fresh)); } catch (e) {}
    if (cloudDocRef) cloudDocRef.set(fresh).then(() => location.reload());
    else location.reload();
  }
}

function saveLiveNotice() {
  const input = document.getElementById("adminNoticeInput");
  if (!input) return;
  const db = getDB();
  db.settings = db.settings || {};
  db.settings.liveNotice = input.value.trim();
  saveDB(db, "Updated live notice broadcast", "Admin");
  alert("✅ Live Notice Broadcasted!");
}

function clearLiveNotice() {
  const db = getDB();
  db.settings = db.settings || {};
  db.settings.liveNotice = "";
  const input = document.getElementById("adminNoticeInput");
  if (input) input.value = "";
  saveDB(db, "Cleared live notice broadcast", "Admin");
}

function getLiveMetrics() {
  const db = getDB();
  const totalCapacity = (db.rooms || []).reduce((sum, r) => sum + Number(r.capacity || 0), 0);
  const activeStudents = (db.students || []).filter(s => s.status === "Active");
  const occupiedBeds = activeStudents.length;
  const emptyBeds = Math.max(0, totalCapacity - occupiedBeds);

  let collectedFee = 0, pendingFee = 0, paidCount = 0, unpaidCount = 0, totalSecurity = 0;

  activeStudents.forEach(s => {
    const secAmount = Number(s.security || 0);
    const secDue = s.securityPaid ? 0 : secAmount;
    const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) + secDue - Number(s.discount || 0);

    if (s.feeStatus === "Paid") {
      collectedFee += total;
      totalSecurity += secAmount;
      paidCount++;
    } else {
      pendingFee += total;
      if (s.securityPaid) totalSecurity += secAmount;
      unpaidCount++;
    }
  });

  const totalExpenses = (db.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = collectedFee - totalExpenses;
  const pendingApps = (db.applications || []).filter(a => a.status === "Pending").length;
  const openComplaints = (db.complaints || []).filter(c => c.status !== "Resolved").length;

  return {
    totalCapacity, occupiedBeds, emptyBeds,
    collectedFee, pendingFee, paidCount, unpaidCount,
    totalExpenses, netProfit, totalSecurity,
    pendingApps, openComplaints
  };
}

// ============================================================================
// 5. VIP 2-COPY VOUCHER (WITH SECURITY DEPOSIT), QR CARD & AUDIT PDF
// ============================================================================
function injectUniversalModal() {
  if (document.getElementById("universalDocModal")) return;
  const div = document.createElement("div");
  div.id = "universalDocModal";
  div.className = "fixed inset-0 bg-zinc-950/85 backdrop-blur-xs hidden items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto";
  div.innerHTML = `
    <div class="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 my-8 text-zinc-100 shadow-2xl">
      <div class="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-file-shield"></i></span>
          <h3 id="uniModalTitle" class="text-sm sm:text-base font-extrabold text-white">VIP Executive Document Preview</h3>
        </div>
        <button type="button" onclick="closeUniModal()" class="text-zinc-400 hover:text-white text-2xl leading-none px-2">&times;</button>
      </div>
      <div id="uniPrintArea" class="bg-white text-zinc-900 p-4 sm:p-6 rounded-xl overflow-x-auto"></div>
      <div class="flex flex-wrap justify-end gap-2.5 pt-2">
        <button type="button" onclick="closeUniModal()" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold">Close</button>
        <button type="button" onclick="window.print()" class="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-extrabold"><i class="fa-solid fa-print mr-1.5"></i> Print Document</button>
        <button type="button" id="uniDownloadBtn" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg"><i class="fa-solid fa-file-pdf mr-1.5"></i> Download Official PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

function closeUniModal() {
  const modal = document.getElementById("universalDocModal");
  if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); modal.style.setProperty("display", "none", "important"); }
}

function showUniModal(filename, orientation) {
  const modal = document.getElementById("universalDocModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.style.setProperty("display", "flex", "important");
  document.getElementById("uniDownloadBtn").onclick = () => {
    const el = document.getElementById("uniPrintArea");
    html2pdf().set({
      margin: 0.25,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation }
    }).from(el).save();
  };
}

function openStudentVoucher(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return alert("❌ Student not found!");

  const rent = Number(s.rent || 0);
  const mess = Number(s.mess || 0);
  const elec = Number(s.elec || 0);
  const other = Number(s.otherCharges || 0);
  const disc = Number(s.discount || 0);
  const secHeld = Number(s.security || 0);
  const secDue = s.securityPaid ? 0 : secHeld;
  const total = rent + mess + elec + other + secDue - disc;

  const challanNo = "VIP-" + new Date().getFullYear() + "-" + s.id.replace("ST-", "");
  const billingMonth = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const issueDate = new Date().toLocaleDateString("en-GB");
  const dueDateText = `05 ${billingMonth}`;
  const isPaid = s.feeStatus === "Paid";

  const payOption1 = (db.settings && db.settings.jazzcash) ? db.settings.jazzcash : "Not Configured in Settings";
  const payOption2 = (db.settings && db.settings.bankAccount) ? db.settings.bankAccount : "";

  const qrData = encodeURIComponent(`VOUCHER:${challanNo}|HOSTEL:${db.settings.hostelName}|ID:${s.id}|NAME:${s.name}|ROOM:${s.room}|AMT:${total}|STATUS:${s.feeStatus}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;

  const buildVIPCopy = (copyTitle, accentBg) => `
    <div style="border: 2px solid #18181b; border-radius: 14px; overflow: hidden; background: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="background: #18181b; color: #ffffff; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; font-weight: 800; display: block;">OFFICIAL HOSTEL FEE CHALLAN</span>
            <h4 style="font-size: 15px; font-weight: 800; margin: 2px 0 0 0; text-transform: uppercase;">${db.settings.hostelName || 'Hostel ERP'}</h4>
          </div>
          <span style="background: ${accentBg}; color: #ffffff; font-size: 9px; font-weight: 800; padding: 4px 9px; border-radius: 6px; text-transform: uppercase;">
            ${copyTitle}
          </span>
        </div>

        <div style="padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px; font-size: 11px;">
            <div><span style="color:#71717a;font-size:9px;text-transform:uppercase;font-weight:700;display:block;">Challan No.</span><strong style="color:#18181b;font-family:monospace;font-size:12px;">${challanNo}</strong></div>
            <div><span style="color:#71717a;font-size:9px;text-transform:uppercase;font-weight:700;display:block;">Billing Month</span><strong style="color:#047857;">${billingMonth}</strong></div>
            <div><span style="color:#71717a;font-size:9px;text-transform:uppercase;font-weight:700;display:block;">Due Date</span><strong style="color:#e11d48;">${dueDateText}</strong></div>
            <div style="text-align:right;"><span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;background:${isPaid ? '#d1fae5' : '#fef3c7'};color:${isPaid ? '#065f46' : '#92400e'};border:1px solid ${isPaid ? '#6ee7b7' : '#fcd34d'};">${isPaid ? '✓ PAID' : '● UNPAID'}</span></div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;">
            <div><span style="color:#71717a;">Resident:</span> <strong style="color:#18181b;">${s.name}</strong></div>
            <div><span style="color:#71717a;">Roll ID:</span> <strong style="color:#047857; font-family:monospace;">${s.id}</strong></div>
            <div><span style="color:#71717a;">Room No:</span> <strong style="color:#18181b;">Room ${s.room}</strong></div>
            <div><span style="color:#71717a;">CNIC:</span> <strong style="color:#18181b;">${s.cnic || s.phone || '—'}</strong></div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f4f4f5; border-top: 1px solid #d4d4d8; border-bottom: 1px solid #d4d4d8; text-transform: uppercase; font-size: 9.5px; color: #52525b;">
                <th style="padding: 6px 8px; text-align: left;">Description of Charges</th>
                <th style="padding: 6px 8px; text-align: right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 5px 8px;">01. Monthly Room / Seat Rent</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${rent.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 5px 8px;">02. Mess & Dining Charges</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${mess.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 5px 8px;">03. Electricity Sub-Meter Share</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${elec.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 5px 8px;">04. Refundable Security Deposit ${s.securityPaid ? '(Already Paid)' : '(1st Month)'}</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${secDue.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5; color: #e11d48;"><td style="padding: 5px 8px;">05. Late Fine / Previous Arrears</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${other.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #e4e4e7; color: #047857;"><td style="padding: 5px 8px;">06. Mess-Off Rebate / Scholarship</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">- Rs. ${disc.toLocaleString()}</td></tr>
            </tbody>
          </table>

          <div style="background: #18181b; color: #ffffff; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; display: block;">Total Net Payable</span>
              <span style="font-size: 10px; color: #fbbf24;">* Rs. 200 Fine after 5th</span>
            </div>
            <strong style="font-size: 16px; font-weight: 800; color: #34d399;">Rs. ${total.toLocaleString()}</strong>
          </div>

          <div style="background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="font-size: 10.5px; line-height: 1.45; flex: 1;">
              <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #065f46; display: block; margin-bottom: 3px;">
                💳 PAYABLE THROUGH (OFFICIAL DEPOSIT CHANNELS):
              </span>
              <div style="color: #18181b; font-weight: 700;"><span style="color: #047857;">● Option 1:</span> ${payOption1}</div>
              ${payOption2 ? `<div style="color: #18181b; font-weight: 700; margin-top: 2px;"><span style="color: #047857;">● Option 2:</span> ${payOption2}</div>` : ''}
              ${s.paymentTid ? `<div style="margin-top:4px; color:#1d4ed8; font-family:monospace; font-weight:700;">Submitted TID: ${s.paymentTid}</div>` : ''}
            </div>
            <img src="${qrUrl}" alt="QR" style="width: 56px; height: 56px; border: 1px solid #a7f3d0; border-radius: 8px; padding: 2px; background: #fff; flex-shrink: 0;" crossorigin="anonymous" />
          </div>
        </div>
      </div>

      <div style="padding: 10px 16px 12px 16px; border-top: 1px dashed #d4d4d8; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #71717a; background: #fafafa;">
        <span>Issued: ${issueDate}</span>
        <span>Depositor Sign: _____________</span>
        <span>Cashier / Stamp: _____________</span>
      </div>
    </div>
  `;

  document.getElementById("uniModalTitle").innerText = `VIP Executive 2-Copy Fee Challan (${billingMonth})`;
  document.getElementById("uniPrintArea").innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">${buildVIPCopy("HOSTEL OFFICE COPY", "#059669") + buildVIPCopy("RESIDENT STUDENT COPY", "#2563eb")}</div>`;
  showUniModal(`VIP_Fee_Voucher_${s.id}_${billingMonth.replace(/\s+/g, "_")}.pdf`, "landscape");
}

function openStudentQRCard(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const qrData = encodeURIComponent(`HOSTEL:${db.settings.hostelName}|ID:${s.id}|NAME:${s.name}|ROOM:${s.room}|CNIC:${s.cnic}`);
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;
  const avatarHtml = s.photo
    ? `<img src="${s.photo}" class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-emerald-600 shadow-md" />`
    : `<div class="w-20 h-20 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-2xl flex items-center justify-center mx-auto border-2 border-emerald-600">${(s.name || 'ST').substring(0, 2).toUpperCase()}</div>`;

  document.getElementById("uniModalTitle").innerText = "Digital Student QR Gate Pass ID Card";
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="max-w-sm mx-auto border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-lg bg-white text-zinc-900">
      <div class="bg-zinc-900 text-white p-4 text-center">
        <h3 class="font-extrabold text-base uppercase">${db.settings.hostelName}</h3>
        <span class="text-[10px] uppercase bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">Official Resident Gate Pass ID</span>
      </div>
      <div class="p-5 text-center space-y-3">
        ${avatarHtml}
        <div>
          <h4 class="text-lg font-extrabold text-zinc-900">${s.name}</h4>
          <p class="text-xs font-bold text-emerald-700">Roll ID: ${s.id} | Room: ${s.room}</p>
        </div>
        <div class="bg-zinc-100 p-3 rounded-xl text-left text-xs space-y-1">
          <div><strong>CNIC:</strong> ${s.cnic}</div>
          <div><strong>Phone:</strong> ${s.phone}</div>
          <div><strong>Guardian Emergency:</strong> ${s.guardian || 'N/A'}</div>
          <div><strong>Institute:</strong> ${s.uni || '—'}</div>
        </div>
        <div class="py-2">
          <img src="${qrImgUrl}" alt="QR Code" class="w-32 h-32 mx-auto border p-1 rounded-lg" crossorigin="anonymous" />
          <p class="text-[10px] text-zinc-500 mt-1">Scan at Hostel Gate for Entry/Exit & Mess Verification</p>
        </div>
      </div>
    </div>
  `;
  showUniModal(`Hostel_ID_Card_${s.id}.pdf`, "portrait");
}

function openClearanceCertificate(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const unpaid = s.feeStatus === "Paid" ? 0 : (Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0));
  const securityHeld = Number(s.security || 0);
  const netRefund = Math.max(0, securityHeld - unpaid);

  document.getElementById("uniModalTitle").innerText = "Student No-Dues Clearance & Security Refund Certificate";
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="border-2 border-zinc-900 p-6 rounded-xl space-y-4 text-xs max-w-2xl mx-auto">
      <div class="text-center border-b-2 border-zinc-300 pb-3">
        <h2 class="text-xl font-extrabold uppercase">${db.settings.hostelName}</h2>
        <p class="text-xs font-bold text-emerald-700 uppercase mt-1">Official Leaving Clearance & Security Refund Certificate</p>
      </div>
      <p class="text-sm leading-relaxed">
        This is to certify that <strong>${s.name}</strong> (Roll ID: <strong>${s.id}</strong>, CNIC: <strong>${s.cnic}</strong>), occupant of Room <strong>${s.room}</strong>, is checking out of the hostel.
      </p>
      <table class="w-full text-left border border-zinc-300">
        <tbody class="divide-y divide-zinc-200">
          <tr><td class="p-2 font-semibold">Refundable Security Deposit Held</td><td class="p-2 text-right font-bold text-emerald-700">Rs. ${securityHeld.toLocaleString()}</td></tr>
          <tr><td class="p-2 font-semibold">Pending Rent / Mess / Electricity Dues Deducted</td><td class="p-2 text-right font-bold text-rose-600">- Rs. ${unpaid.toLocaleString()}</td></tr>
          <tr class="bg-zinc-900 text-white text-sm"><td class="p-2.5 font-bold">NET SECURITY REFUNDABLE TO STUDENT</td><td class="p-2.5 text-right font-bold">Rs. ${netRefund.toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
  `;
  showUniModal(`Clearance_Certificate_${s.id}.pdf`, "portrait");
}

function openMonthlyAuditPDF() {
  injectUniversalModal();
  const db = getDB();
  const m = getLiveMetrics();
  const billingMonth = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const expRows = (db.expenses || []).map((e, i) => `<tr><td class="p-1.5 border border-zinc-300">${i + 1}</td><td class="p-1.5 border border-zinc-300 font-semibold">${e.title || 'Expense'}</td><td class="p-1.5 border border-zinc-300">${e.date || '-'}</td><td class="p-1.5 border border-zinc-300 text-right font-bold text-rose-600">Rs. ${Number(e.amount || 0).toLocaleString()}</td></tr>`).join("") || `<tr><td colspan="4" class="p-2 text-center text-zinc-400">No expenses recorded</td></tr>`;

  document.getElementById("uniModalTitle").innerText = `Official Monthly Financial Audit Report (${billingMonth})`;
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="border-2 border-zinc-900 p-6 rounded-xl space-y-4 text-xs max-w-3xl mx-auto">
      <div class="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
        <div><h2 class="text-xl font-extrabold uppercase text-zinc-900">${db.settings.hostelName}</h2><p class="text-xs font-bold text-emerald-700 uppercase">Monthly P&L Financial Audit</p></div>
        <span class="bg-zinc-900 text-white px-3 py-1 rounded font-bold text-xs">${billingMonth}</span>
      </div>
      <div class="grid grid-cols-4 gap-3 text-center bg-zinc-100 p-3 rounded-xl border border-zinc-300">
        <div><span class="text-[10px] text-zinc-500 block">Occupancy</span><strong class="text-sm text-zinc-900">${m.occupiedBeds} / ${m.totalCapacity}</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Collected</span><strong class="text-sm text-emerald-700">Rs. ${m.collectedFee.toLocaleString()}</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Expenses</span><strong class="text-sm text-rose-600">Rs. ${m.totalExpenses.toLocaleString()}</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Net Profit</span><strong class="text-sm text-emerald-700">Rs. ${m.netProfit.toLocaleString()}</strong></div>
      </div>
      <table class="w-full text-left border-collapse border border-zinc-300 text-[11px]">
        <thead class="bg-zinc-200"><tr><th class="p-1.5 border border-zinc-300">#</th><th class="p-1.5 border border-zinc-300">Expense Head</th><th class="p-1.5 border border-zinc-300">Date</th><th class="p-1.5 border border-zinc-300 text-right">Amount</th></tr></thead>
        <tbody>${expRows}</tbody>
      </table>
    </div>
  `;
  showUniModal(`Financial_Audit_${billingMonth.replace(/\s+/g, "_")}.pdf`, "portrait");
}

// ============================================================================
// 6. BILLING, ROOM SHIFT, MESS REBATE, WHATSAPP, KYC & RULES MODAL
// ============================================================================
function startNewBillingMonth() {
  const monthName = prompt("Enter New Billing Month Name (e.g. November 2026):", "November 2026");
  if (!monthName) return;

  const db = getDB();
  db.settings.currentMonth = monthName;
  (db.students || []).forEach(s => {
    if (s.status === "Active") {
      if (s.feeStatus === "Paid") {
        s.securityPaid = true;
        s.otherCharges = 0;
        s.elec = 0;
      } else {
        const secDue = s.securityPaid ? 0 : Number(s.security || 0);
        const prevUnpaid = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + secDue;
        s.otherCharges = Number(s.otherCharges || 0) + prevUnpaid;
        s.securityPaid = true;
      }
      s.feeStatus = "Unpaid";
      s.paymentTid = "";
      s.paymentImg = "";
      s.lastFineMonth = "";
    }
  });

  saveDB(db, `Started new billing cycle for ${monthName}`, "Admin");
  alert(`✅ New Month (${monthName}) Vouchers Generated!`);
  refreshCurrentPortalUI();
}

function sendStudentFeeReminder(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;
  const secDue = s.securityPaid ? 0 : Number(s.security || 0);
  const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) + secDue - Number(s.discount || 0);
  const month = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const cleanPhone = "92" + (s.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
  const msg = `*FEE REMINDER — ${db.settings.hostelName}*\n\nSalam *${s.name}* (${s.id}, Room ${s.room}),\nYour hostel fee for *${month}* is *${s.feeStatus.toUpperCase()}*.\n\n💰 *Payable:* Rs. ${total.toLocaleString()}\n💳 *Account:* ${db.settings.jazzcash}`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendGuardianAlert(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;
  const targetPhone = s.guardian || s.phone;
  if (!targetPhone) return alert("⚠️ No Guardian phone number saved!");
  const cleanPhone = "92" + targetPhone.replace(/[^0-9]/g, "").replace(/^0/, "");
  const secDue = s.securityPaid ? 0 : Number(s.security || 0);
  const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) + secDue - Number(s.discount || 0);
  const msg = `*GUARDIAN ALERT — ${db.settings.hostelName}*\n\nRespected Guardian of *${s.name}* (Room ${s.room}),\nStatus: *${s.feeStatus.toUpperCase()}* (Rs. ${total.toLocaleString()}).`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function exportHostelBackupJSON() {
  const db = getDB();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `Backup_${TENANT_ID}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

function importHostelBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedDB = JSON.parse(e.target.result);
      if (confirm(`Restore backup for "${importedDB.settings?.hostelName}"?`)) {
        saveDB(importedDB, "Restored database from JSON backup", "Admin");
        location.reload();
      }
    } catch (err) { alert("❌ Invalid JSON file!"); }
  };
  reader.readAsText(file);
}

function shiftStudentRoom(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;
  const newRoomNo = prompt(`🔄 SHIFT ROOM FOR: ${s.name} (Current: ${s.room})\nEnter New Room Number:`, s.room);
  if (!newRoomNo || String(newRoomNo).trim() === String(s.room)) return;
  const targetRoom = (db.rooms || []).find(r => String(r.no) === String(newRoomNo).trim());
  if (!targetRoom) return alert(`❌ Room "${newRoomNo}" does not exist!`);
  s.room = targetRoom.no;
  saveDB(db, `Shifted ${s.name} to Room ${targetRoom.no}`, "Admin");
  refreshCurrentPortalUI();
  alert(`✅ ${s.name} shifted to Room ${targetRoom.no}!`);
}

function applyMessRebate(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;
  const days = Number(prompt(`🍲 Enter number of Mess-Off days for ${s.name}:`, "5"));
  if (!days || days <= 0) return;
  const perDayRate = Number(prompt(`Enter Per-Day Mess Rate (Rs.):`, "250"));
  if (!perDayRate || perDayRate <= 0) return;
  const rebateAmount = days * perDayRate;
  s.discount = Number(s.discount || 0) + rebateAmount;
  saveDB(db, `Applied Rs. ${rebateAmount} Mess Rebate to ${s.name}`, "Admin");
  refreshCurrentPortalUI();
  alert(`✅ Rs. ${rebateAmount.toLocaleString()} Mess Rebate added!`);
}

window.kycTempUploads = { photo: "", cnicFront: "", cnicBack: "" };
window.handleKYCFileUpload = function(inputEl, key, previewId) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const maxW = key === "photo" ? 320 : 650;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      window.kycTempUploads[key] = dataUrl;
      const prev = document.getElementById(previewId);
      if (prev) { prev.src = dataUrl; prev.classList.remove("hidden"); prev.style.setProperty("display", "block", "important"); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.openKYCDocumentsModal = function(recordId) {
  injectUniversalModal();
  const db = getDB();
  const rec = (db.applications || []).find(a => String(a.id) === String(recordId)) || (db.students || []).find(s => String(s.id) === String(recordId));
  if (!rec) return alert("❌ Record not found!");

  document.getElementById("uniModalTitle").innerText = `Identity & KYC File — ${rec.name} (${rec.id})`;
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="space-y-5 text-xs max-w-3xl mx-auto p-2">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div class="flex items-center gap-4">
          ${rec.photo ? `<img src="${rec.photo}" class="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-900" />` : `<div class="w-20 h-20 rounded-2xl bg-zinc-200 flex items-center justify-center font-bold text-zinc-500">No Photo</div>`}
          <div>
            <h3 class="text-lg font-extrabold text-zinc-900">${rec.name}</h3>
            <p class="text-zinc-600 font-mono">ID: ${rec.id} • CNIC: ${rec.cnic || '—'} • Phone: ${rec.phone || '—'}</p>
          </div>
        </div>
        <span class="bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl font-bold">Room ${rec.room || '—'}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-zinc-300 rounded-xl p-3 bg-zinc-50 text-center">
          <span class="text-[11px] font-extrabold uppercase text-zinc-800 block mb-2">CNIC Front Side</span>
          ${rec.cnicFront ? `<img src="${rec.cnicFront}" class="w-full h-56 object-contain rounded-lg bg-white mx-auto" />` : `<div class="h-56 flex items-center justify-center text-zinc-400">No CNIC Front</div>`}
        </div>
        <div class="border border-zinc-300 rounded-xl p-3 bg-zinc-50 text-center">
          <span class="text-[11px] font-extrabold uppercase text-zinc-800 block mb-2">CNIC Back Side</span>
          ${rec.cnicBack ? `<img src="${rec.cnicBack}" class="w-full h-56 object-contain rounded-lg bg-white mx-auto" />` : `<div class="h-56 flex items-center justify-center text-zinc-400">No CNIC Back</div>`}
        </div>
      </div>
    </div>
  `;
  showUniModal(`KYC_Docs_${rec.id}.pdf`, "portrait");
};

window.openPaymentReceiptModal = function(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s || !s.paymentImg) return alert("⚠️ No receipt screenshot attached by student!");
  document.getElementById("uniModalTitle").innerText = `Payment Receipt Proof — ${s.name} (${s.id})`;
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="max-w-md mx-auto text-center space-y-4 p-2 text-xs">
      <div class="bg-zinc-100 border border-zinc-300 rounded-xl p-3 flex justify-between items-center">
        <span>Student: <strong>${s.name} (${s.id})</strong></span>
        <span>TID: <strong class="font-mono text-emerald-800">${s.paymentTid || '—'}</strong></span>
      </div>
      <img src="${s.paymentImg}" class="w-full max-h-[480px] object-contain rounded-xl border-2 border-zinc-900 mx-auto" />
    </div>
  `;
  showUniModal(`Payment_Receipt_${s.id}.pdf`, "portrait");
};

// 📜 HOSTEL RULES (rules.jpg) MODAL & CHECKBOX
window.openHostelRulesModal = function() {
  let modal = document.getElementById("hostelRulesImgModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "hostelRulesImgModal";
    modal.className = "fixed inset-0 bg-zinc-950/85 backdrop-blur-xs hidden items-center justify-center z-[85] p-3 sm:p-5";
    modal.innerHTML = `
      <div class="bg-white border border-zinc-300 rounded-2xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden text-zinc-900">
        <div class="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white shrink-0">
          <h3 class="text-sm font-extrabold"><i class="fa-solid fa-scroll text-emerald-400 mr-1.5"></i> Official Hostel Rules & Terms</h3>
          <button type="button" onclick="closeHostelRulesModal()" class="text-zinc-400 hover:text-white text-2xl leading-none px-1 cursor-pointer">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto p-3 bg-zinc-100 text-center custom-scroll">
          <img src="rules.jpg" alt="Hostel Rules" class="w-full h-auto rounded-xl border border-zinc-300 mx-auto" />
        </div>
        <div class="p-3.5 border-t border-zinc-200 bg-white flex justify-end gap-2 shrink-0 text-xs">
          <button type="button" onclick="closeHostelRulesModal()" class="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-bold cursor-pointer">Close</button>
          <button type="button" onclick="acceptHostelRules()" class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold cursor-pointer"><i class="fa-solid fa-check mr-1"></i> I Have Read & Agree</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.style.setProperty("display", "flex", "important");
};

window.closeHostelRulesModal = function() {
  const modal = document.getElementById("hostelRulesImgModal");
  if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); modal.style.setProperty("display", "none", "important"); }
};

window.acceptHostelRules = function() {
  const chk = document.getElementById("agreeRulesCheckbox");
  if (chk) chk.checked = true;
  closeHostelRulesModal();
};

function injectRulesCheckboxInAdmissionForm() {
  const admForm = document.getElementById("onlineAdmissionForm");
  if (admForm && !document.getElementById("agreeRulesCheckbox")) {
    const termsBox = document.createElement("div");
    termsBox.className = "bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs";
    termsBox.innerHTML = `
      <label class="flex items-start sm:items-center gap-2.5 cursor-pointer select-none">
        <input id="agreeRulesCheckbox" type="checkbox" required class="w-4 h-4 mt-0.5 sm:mt-0 accent-emerald-700 rounded cursor-pointer shrink-0" />
        <span class="font-bold text-zinc-800 leading-snug">I have read and agree to the <span class="text-emerald-800 underline">Hostel Rules, Terms & Conditions</span> *</span>
      </label>
      <button type="button" onclick="openHostelRulesModal()" class="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer">
        <i class="fa-solid fa-file-contract text-emerald-400 mr-1"></i> Read Rules & Terms
      </button>
    `;
    admForm.insertBefore(termsBox, admForm.lastElementChild);
  }
}

// ============================================================================
// 7. 🎨 CUSTOM UI POPUP & ANIMATION ENGINE
// ============================================================================
(function initCustomSaaSUI() {
  if (document.getElementById("saasGlobalAnimations")) return;
  const style = document.createElement("style");
  style.id = "saasGlobalAnimations";
  style.innerHTML = `
    @keyframes saasSlideUpFade { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
    @keyframes saasModalSpring { 0% { opacity: 0; transform: scale(0.90) translateY(14px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
    [id^="view-"]:not(.hidden), [id^="stuView-"]:not(.hidden), [id^="wardenView-"]:not(.hidden), [id^="masterView-"]:not(.hidden) { animation: saasSlideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    #customSaaSAlertModal:not(.hidden) > div, #hostelRulesImgModal:not(.hidden) > div { animation: saasModalSpring 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  `;
  document.head.appendChild(style);

  window.showSaaSPopup = function(rawMsg) {
    let modal = document.getElementById("customSaaSAlertModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customSaaSAlertModal";
      modal.className = "fixed inset-0 bg-zinc-950/75 backdrop-blur-xs hidden items-center justify-center z-[9999] p-4";
      document.body.appendChild(modal);
    }
    const msg = String(rawMsg || "").trim();
    const isError = msg.includes("❌") || /invalid|incorrect|denied|error|failed|full/i.test(msg);
    const isWarn  = msg.includes("⚠️") || /warning|wait|please/i.test(msg);
    const cleanText = msg.replace(/^[✅❌⚠️🎉🗑️]+\s*/, "");
    const lines = cleanText.split("\n").filter(l => l.trim() !== "");
    const headline = lines[0] || (isError ? "Action Blocked" : isWarn ? "System Notice" : "Confirmed");
    const bodyLines = lines.slice(1);
    const badgeBg = isError ? "bg-rose-600 text-white" : isWarn ? "bg-amber-500 text-zinc-950" : "bg-emerald-600 text-white";
    const iconHtml = isError ? `<i class="fa-solid fa-shield-xmark"></i>` : isWarn ? `<i class="fa-solid fa-triangle-exclamation"></i>` : `<i class="fa-solid fa-circle-check"></i>`;

    modal.innerHTML = `
      <div class="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-zinc-900">
        <div class="flex items-start gap-3.5 border-b border-zinc-100 pb-4">
          <div class="w-11 h-11 rounded-xl ${badgeBg} flex items-center justify-center text-lg font-bold shrink-0">${iconHtml}</div>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm sm:text-base font-extrabold text-zinc-900 leading-snug break-words">${headline}</h3>
          </div>
          <button type="button" onclick="closeSaaSPopup()" class="text-zinc-400 hover:text-zinc-800 text-xl leading-none">&times;</button>
        </div>
        ${bodyLines.length > 0 ? `<div class="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-1 text-xs text-zinc-700 font-medium">${bodyLines.map(l => `<div>${l}</div>`).join("")}</div>` : ""}
        <button type="button" onclick="closeSaaSPopup()" class="w-full ${isError ? 'bg-rose-600 hover:bg-rose-500' : 'bg-zinc-900 hover:bg-zinc-800'} text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer">Continue →</button>
      </div>
    `;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.style.setProperty("display", "flex", "important");
  };

  window.closeSaaSPopup = function() {
    const modal = document.getElementById("customSaaSAlertModal");
    if (modal) { modal.classList.add("hidden"); modal.classList.remove("flex"); modal.style.setProperty("display", "none", "important"); }
  };

  window.alert = function(message) { window.showSaaSPopup(message); };
})();

// 🖼️ UNIVERSAL SAAS LOGO ENGINE (Auto-Applies logo.png + Admin Custom Logo!)

window.handleHostelLogoUpload = function(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 200 / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const logoDataUrl = canvas.toDataURL("image/png");
      const db = getDB();
      db.settings = db.settings || {};
      db.settings.logo = logoDataUrl;
      saveDB(db, "Updated official hostel logo", "Admin");
      applyBrandLogoEverywhere();
      alert("✅ Official Hostel Logo Updated & Synced!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

function applyBrandLogoEverywhere() {
  const db = getDB();
  const logoSrc = (db.settings && db.settings.logo) ? db.settings.logo : "logo.png";

  // 1. Set Browser Tab Favicon
  let fav = document.querySelector("link[rel='icon']");
  if (!fav) {
    fav = document.createElement("link");
    fav.rel = "icon";
    document.head.appendChild(fav);
  }
  fav.href = logoSrc;

  // 2. Replace Brand Icon Boxes in Header, Sidebars & Login Gates with Real Logo Image
  const brandSelectors = [
    "header .fa-building-shield",
    "header .fa-building",
    "#adminSidebar .fa-layer-group",
    "#stuSidebar .fa-user-graduate",
    "#wardenSidebar .fa-shield-halved",
    "#masterSidebar .fa-crown",
    "#adminLoginGate .fa-shield-halved",
    "#studentLoginGate .fa-user-graduate",
    "#wardenLoginGate .fa-user-shield",
    "#masterLoginGate .fa-crown"
  ];

  brandSelectors.forEach(sel => {
    const iconEl = document.querySelector(sel);
    if (iconEl && iconEl.parentElement) {
      const box = iconEl.parentElement;
      box.innerHTML = `<img src="${logoSrc}" alt="Logo" class="w-full h-full object-contain rounded-lg p-0.5 bg-white" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-building-shield\\'></i>'" />`;
    }
  });

  // 3. Inject "Upload Hostel Logo" inside Admin Settings Form
  const nameInput = document.getElementById("setHostelName");
  if (nameInput && !document.getElementById("setHostelLogoBox")) {
    const logoDiv = document.createElement("div");
    logoDiv.id = "setHostelLogoBox";
    logoDiv.innerHTML = `
      <label class="block font-bold text-zinc-700 mb-1">Official Hostel Logo (PNG/JPG)</label>
      <label class="cursor-pointer bg-zinc-50 hover:bg-emerald-50 border border-dashed border-zinc-300 rounded-lg px-3.5 py-2 flex items-center justify-between gap-2 transition">
        <span class="text-xs font-semibold text-zinc-700 truncate"><i class="fa-solid fa-image text-emerald-700 mr-1.5"></i> Upload / Change Logo</span>
        <img src="${logoSrc}" class="w-7 h-7 object-contain rounded border border-zinc-200 bg-white" onerror="this.style.display='none'" />
        <input type="file" accept="image/*" onchange="handleHostelLogoUpload(this)" class="hidden" />
      </label>
    `;
    nameInput.parentElement.insertAdjacentElement("afterend", logoDiv);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  applyBrandLogoEverywhere();
  setTimeout(applyBrandLogoEverywhere, 1000);
});
