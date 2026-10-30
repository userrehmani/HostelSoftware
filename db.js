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
// MULTI-TENANT SAAS ENGINE & SECURE CLOUD AUTHENTICATION
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

        // 🔒 REMOTE SAAS KILL-SWITCH
        if (cloudData.settings.isSuspended === true && !isMasterPage()) {
          document.body.innerHTML = `
            <div style="background:#020617;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:24px;">
              <div style="width:70px;height:70px;border-radius:20px;background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.4);display:flex;align-items:center;justify-content:center;font-size:32px;color:#f43f5e;margin-bottom:16px;">🔒</div>
              <h1 style="color:#f43f5e;font-size:26px;font-weight:800;margin:0;">Software License Suspended</h1>
              <p style="color:#94a3b8;max-width:420px;margin-top:10px;font-size:14px;line-height:1.6;">
                Access to <strong>${cloudData.settings.hostelName || TENANT_ID}</strong> has been temporarily locked due to an expired subscription. Please contact the software provider to renew your license.
              </p>
            </div>`;
          return;
        }

        try { localStorage.setItem(DB_KEY, JSON.stringify(cloudData)); } catch (e) {}
        refreshCurrentPortalUI();
      }
    }, (err) => {
      console.error("Firestore Sync Blocked:", err);
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
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (!started) {
          started = true;
          startFirestoreListener();
        }
      } else {
        firebase.auth().signInAnonymously().catch((err) => {
          console.warn("Auth note:", err.message);
          if (!started) {
            started = true;
            startFirestoreListener();
          }
        });
      }
    });
  };

  if (typeof firebase.auth === "function") {
    connectWithAuth();
  } else {
    const authScript = document.createElement("script");
    authScript.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";
    authScript.onload = connectWithAuth;
    document.head.appendChild(authScript);
  }
}

initSecureFirebase();

// ============================================================================
// 🔐 STRICT ZERO-TRUST LOGIN GATES & ADMIN SETTINGS UPGRADER
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  upgradePortalLoginGates();
  upgradeAdminPaymentSettings();
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

    // Also add Admin Email & Warden Email fields in Settings so Admin can update them
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
      if (document.getElementById("setAdminEmail")) {
        db.settings.adminEmail = document.getElementById("setAdminEmail").value.trim().toLowerCase();
      }
      db.settings.adminPass = document.getElementById("setAdminPass").value.trim();
      if (document.getElementById("setWardenEmail")) {
        db.settings.wardenEmail = document.getElementById("setWardenEmail").value.trim().toLowerCase();
      }
      db.settings.wardenPass = document.getElementById("setWardenPass").value.trim();

      saveDB(db, "Updated hostel settings, payment channels & security credentials", "Admin");
      if (typeof renderAdminAll === "function") renderAdminAll();
      alert("✅ Hostel Settings, Payment Options & Login Emails/Passwords Saved!");
    };

    window.populateSettingsForm();
  }
}

function upgradePortalLoginGates() {
  // 1. ADMIN LOGIN GATE: Strict Email + Password (No Public Sign-Up!)
  const adminForm = document.querySelector("#adminLoginGate form");
  if (adminForm && !document.getElementById("adminEmailInput")) {
    const emailDiv = document.createElement("div");
    emailDiv.innerHTML = `
      <label class="block text-xs font-semibold text-zinc-700 mb-1.5">Authorized Admin Email *</label>
      <input id="adminEmailInput" type="email" required placeholder="Enter Registered Admin Email" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white outline-none mb-3" />
    `;
    adminForm.insertBefore(emailDiv, adminForm.firstChild);
  }

  // 2. WARDEN LOGIN GATE: Strict Email + Password (No Public Sign-Up!)
  const wardenForm = document.querySelector("#wardenLoginGate form");
  if (wardenForm && !document.getElementById("wardenEmailInput")) {
    const emailDiv = document.createElement("div");
    emailDiv.innerHTML = `
      <label class="block text-xs font-bold text-zinc-700 mb-1.5">Authorized Warden Email *</label>
      <input id="wardenEmailInput" type="email" required placeholder="Enter Registered Warden Email" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 font-semibold focus:border-zinc-900 focus:bg-white outline-none mb-3" />
    `;
    wardenForm.insertBefore(emailDiv, wardenForm.firstChild);
  }

  // 3. STUDENT LOGIN GATE: Strict Roll ID / Phone / CNIC + Admin-Issued Password ONLY!
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
// 🔑 STRICT PRE-AUTHORIZED LOGIN VERIFIERS (Admin, Warden & Student)
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  // 1. STRICT ADMIN LOGIN (Must match Both Pre-Registered Email AND Password!)
  window.verifyAdminLogin = async function(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById("adminEmailInput");
    const passInput = document.getElementById("adminPassInput");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";
    if (!email || !pass) return alert("Please enter both Admin Email and Password!");

    let db = getDB();
    if (cloudDocRef) {
      try {
        const snap = await cloudDocRef.get();
        if (snap.exists) {
          db = snap.data();
          localStorage.setItem(DB_KEY, JSON.stringify(db));
        }
      } catch (err) {}
    }

    const set = db.settings || {};
    const savedEmail = (set.adminEmail || MASTER_FOUNDER_EMAIL).trim().toLowerCase();
    const savedPass = (set.adminPass || MASTER_FOUNDER_PASS).trim();

    // Allow Master Founder OR exact matching Registered Tenant Admin Email + Password
    const isFounder = (email === MASTER_FOUNDER_EMAIL.toLowerCase() && pass === MASTER_FOUNDER_PASS);
    const isTenantAdmin = (email === savedEmail && pass === savedPass);

    if (isFounder || isTenantAdmin) {
      try { sessionStorage.setItem("ADMIN_AUTH_" + TENANT_ID, "true"); } catch (err) {}
      const gate = document.getElementById("adminLoginGate");
      if (gate) {
        gate.classList.remove("flex");
        gate.classList.add("hidden");
        gate.style.setProperty("display", "none", "important");
      }
      if (typeof renderAdminAll === "function") renderAdminAll();
    } else {
      alert("❌ Access Denied: Invalid Admin Email or Password!");
    }
  };

  // 2. STRICT WARDEN LOGIN (Must match Both Pre-Registered Warden Email AND Password!)
  window.handleWardenLogin = async function(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById("wardenEmailInput");
    const passInput = document.getElementById("wardenPassInput");
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";
    if (!email || !pass) return alert("Please enter both Warden Email and Password!");

    let db = getDB();
    if (cloudDocRef) {
      try {
        const snap = await cloudDocRef.get();
        if (snap.exists) {
          db = snap.data();
          localStorage.setItem(DB_KEY, JSON.stringify(db));
        }
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
      if (gate) {
        gate.classList.remove("flex");
        gate.classList.add("hidden");
        gate.style.setProperty("display", "none", "important");
      }
      if (typeof renderWardenConsole === "function") renderWardenConsole();
    } else {
      alert("❌ Access Denied: Invalid Warden Email or Password!");
    }
  };

  // 3. STRICT STUDENT LOGIN (Must be Admitted Active Student + Must Match Admin-Issued Password!)
  window.handleStudentLogin = async function(e) {
    if (e) e.preventDefault();
    const loginInput = document.getElementById("stuLoginInput");
    const passInput = document.getElementById("stuPassInput");
    const q = loginInput ? loginInput.value.trim().toLowerCase() : "";
    const pass = passInput ? passInput.value.trim() : "";
    if (!q || !pass) return alert("Please enter both your Roll ID/Phone and Student Password!");

    let db = getDB();
    const findStu = (database) => (database.students || []).find(s =>
      s.status === "Active" && (
        String(s.id || "").toLowerCase() === q ||
        String(s.cnic || "").toLowerCase() === q ||
        String(s.phone || "").toLowerCase() === q
      )
    );

    let found = findStu(db);

    if ((!found || String(found.pass || "").trim() !== pass) && cloudDocRef) {
      try {
        const snap = await cloudDocRef.get();
        if (snap.exists) {
          db = snap.data();
          localStorage.setItem(DB_KEY, JSON.stringify(db));
          found = findStu(db);
        }
      } catch (err) {}
    }

    if (!found) {
      return alert("❌ Access Denied! You are not an admitted resident of this hostel. Please apply online and wait for Admin approval.");
    }

    const assignedPass = found.pass ? String(found.pass).trim() : "";
    if (!assignedPass) {
      return alert("⚠️ Your Student Password has not been set by the Hostel Admin yet. Please ask your Hostel Admin to assign you a password.");
    }

    if (pass !== assignedPass) {
      return alert("❌ Incorrect Student Password!");
    }

    window.loggedStudent = found;
    try { sessionStorage.setItem("STU_AUTH_" + TENANT_ID, found.id); } catch (err) {}
    const gate = document.getElementById("studentLoginGate");
    if (gate) {
      gate.classList.remove("flex");
      gate.classList.add("hidden");
      gate.style.setProperty("display", "none", "important");
    }
    if (typeof renderStudentDashboard === "function") renderStudentDashboard();
  };
});

function refreshCurrentPortalUI() {
  if (typeof renderAdminAll === "function") renderAdminAll();
  if (typeof loadPublicSite === "function") loadPublicSite();
  if (typeof renderPublicPage === "function") renderPublicPage();
  if (typeof renderWardenConsole === "function") renderWardenConsole();
  if (typeof renderStudentDashboard === "function" && window.loggedStudent) {
    renderStudentDashboard();
    const payBox = document.getElementById("payAccountBox");
    const db = getDB();
    if (payBox && db.settings) {
      const opt1 = db.settings.jazzcash || "Contact Admin Office";
      const opt2 = db.settings.bankAccount ? `<div class="mt-1 pt-1 border-t border-zinc-200 text-emerald-800">${db.settings.bankAccount}</div>` : "";
      payBox.innerHTML = `<div>${opt1}</div>${opt2}`;
    }
  }
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
    if (cloudDocRef) {
      cloudDocRef.set(fresh).then(() => location.reload());
    } else {
      location.reload();
    }
  }
}

function saveLiveNotice() {
  const input = document.getElementById("adminNoticeInput");
  if (!input) return;
  const db = getDB();
  db.settings = db.settings || {};
  db.settings.liveNotice = input.value.trim();
  saveDB(db, "Updated live notice broadcast", "Admin");
  alert("✅ Live Notice broadcasted!");
}

function clearLiveNotice() {
  const db = getDB();
  db.settings = db.settings || {};
  db.settings.liveNotice = "";
  const input = document.getElementById("adminNoticeInput");
  if (input) input.value = "";
  saveDB(db, "Cleared live notice broadcast", "Admin");
}

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function installHostelPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
  } else {
    alert("To install as an App:\nOpen browser menu (⋮) and tap 'Add to Home Screen' or 'Install App'.");
  }
}

function getLiveMetrics() {
  const db = getDB();
  const totalCapacity = (db.rooms || []).reduce((sum, r) => sum + Number(r.capacity || 0), 0);
  const activeStudents = (db.students || []).filter(s => s.status === "Active");
  const occupiedBeds = activeStudents.length;
  const emptyBeds = Math.max(0, totalCapacity - occupiedBeds);

  let collectedFee = 0, pendingFee = 0, paidCount = 0, unpaidCount = 0, totalSecurity = 0;

  activeStudents.forEach(s => {
    const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0);
    totalSecurity += Number(s.security || 0);
    if (s.feeStatus === "Paid") {
      collectedFee += total;
      paidCount++;
    } else {
      pendingFee += total;
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
        <button onclick="closeUniModal()" class="text-zinc-400 hover:text-white text-2xl leading-none px-2">&times;</button>
      </div>
      <div id="uniPrintArea" class="bg-white text-zinc-900 p-4 sm:p-6 rounded-xl overflow-x-auto"></div>
      <div class="flex flex-wrap justify-end gap-2.5 pt-2">
        <button onclick="closeUniModal()" class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold">Close</button>
        <button onclick="window.print()" class="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-extrabold"><i class="fa-solid fa-print mr-1.5"></i> Print Document</button>
        <button id="uniDownloadBtn" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg"><i class="fa-solid fa-file-pdf mr-1.5"></i> Download Official PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

function closeUniModal() {
  const modal = document.getElementById("universalDocModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.style.setProperty("display", "none", "important");
  }
}

// ============================================================================
// 💎 VIP EXECUTIVE 2-COPY FEE VOUCHER (With 2 Configurable Payment Channels)
// ============================================================================
function openStudentVoucher(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return alert("Student not found!");

  const rent = Number(s.rent || 0), mess = Number(s.mess || 0), elec = Number(s.elec || 0), other = Number(s.otherCharges || 0), disc = Number(s.discount || 0);
  const total = rent + mess + elec + other - disc;
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
            <h4 style="font-size: 15px; font-weight: 800; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.3px;">${db.settings.hostelName || 'Hostel ERP'}</h4>
          </div>
          <span style="background: ${accentBg}; color: #ffffff; font-size: 9px; font-weight: 800; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.8px; text-transform: uppercase;">
            ${copyTitle}
          </span>
        </div>

        <div style="padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px; font-size: 11px;">
            <div>
              <span style="color: #71717a; font-size: 9px; text-transform: uppercase; font-weight: 700; display: block;">Challan No.</span>
              <strong style="color: #18181b; font-family: monospace; font-size: 12px;">${challanNo}</strong>
            </div>
            <div>
              <span style="color: #71717a; font-size: 9px; text-transform: uppercase; font-weight: 700; display: block;">Billing Month</span>
              <strong style="color: #047857;">${billingMonth}</strong>
            </div>
            <div>
              <span style="color: #71717a; font-size: 9px; text-transform: uppercase; font-weight: 700; display: block;">Due Date</span>
              <strong style="color: #e11d48;">${dueDateText}</strong>
            </div>
            <div style="text-align: right;">
              <span style="padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; background: ${isPaid ? '#d1fae5' : '#fef3c7'}; color: ${isPaid ? '#065f46' : '#92400e'}; border: 1px solid ${isPaid ? '#6ee7b7' : '#fcd34d'};">
                ${isPaid ? '✓ PAID' : '● UNPAID'}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; border: 1px solid #e4e4e7; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;">
            <div><span style="color:#71717a;">Resident:</span> <strong style="color:#18181b;">${s.name}</strong></div>
            <div><span style="color:#71717a;">Roll ID:</span> <strong style="color:#047857; font-family:monospace;">${s.id}</strong></div>
            <div><span style="color:#71717a;">Room No:</span> <strong style="color:#18181b;">Room ${s.room}</strong></div>
            <div><span style="color:#71717a;">Phone:</span> <strong style="color:#18181b;">${s.phone || '—'}</strong></div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f4f4f5; border-top: 1px solid #d4d4d8; border-bottom: 1px solid #d4d4d8; text-transform: uppercase; font-size: 9.5px; color: #52525b;">
                <th style="padding: 6px 8px; text-align: left;">Description of Charges</th>
                <th style="padding: 6px 8px; text-align: right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 6px 8px;">01. Monthly Room / Seat Rent</td><td style="padding: 6px 8px; text-align: right; font-weight: 700;">Rs. ${rent.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 6px 8px;">02. Mess & Dining Charges</td><td style="padding: 6px 8px; text-align: right; font-weight: 700;">Rs. ${mess.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 6px 8px;">03. Electricity Sub-Meter Share</td><td style="padding: 6px 8px; text-align: right; font-weight: 700;">Rs. ${elec.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #f4f4f5; color: #e11d48;"><td style="padding: 6px 8px;">04. Late Fine / Previous Arrears</td><td style="padding: 6px 8px; text-align: right; font-weight: 700;">Rs. ${other.toLocaleString()}</td></tr>
              <tr style="border-bottom: 1px solid #e4e4e7; color: #047857;"><td style="padding: 6px 8px;">05. Mess-Off Rebate / Scholarship</td><td style="padding: 6px 8px; text-align: right; font-weight: 700;">- Rs. ${disc.toLocaleString()}</td></tr>
            </tbody>
          </table>

          <div style="background: #18181b; color: #ffffff; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; display: block;">Total Net Payable</span>
              <span style="font-size: 10px; color: #fbbf24;">* Rs. 200 Fine after 5th</span>
            </div>
            <strong style="font-size: 16px; font-weight: 800; color: #34d399;">Rs. ${total.toLocaleString()}</strong>
          </div>

          <!-- 💳 PAYABLE THROUGH (2 ADMIN-CONFIGURED PAYMENT OPTIONS) -->
          <div style="background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="font-size: 10.5px; line-height: 1.45; flex: 1;">
              <span style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #065f46; letter-spacing: 0.5px; display: block; margin-bottom: 3px;">
                💳 PAYABLE THROUGH (OFFICIAL DEPOSIT CHANNELS):
              </span>
              <div style="color: #18181b; font-weight: 700;">
                <span style="color: #047857;">● Option 1:</span> ${payOption1}
              </div>
              ${payOption2 ? `
                <div style="color: #18181b; font-weight: 700; margin-top: 2px;">
                  <span style="color: #047857;">● Option 2:</span> ${payOption2}
                </div>
              ` : `
                <div style="color: #52525b; font-size: 9.5px; margin-top: 2px;">
                  (Or deposit cash directly at the Hostel Admin Office)
                </div>
              `}
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
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      ${buildVIPCopy("HOSTEL OFFICE COPY", "#059669")}
      ${buildVIPCopy("RESIDENT STUDENT COPY", "#2563eb")}
    </div>
  `;
  showUniModal(`VIP_Fee_Voucher_${s.id}_${billingMonth.replace(/\s+/g, "_")}.pdf`, "landscape");
}

function openStudentQRCard(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const qrData = encodeURIComponent(`HOSTEL:${db.settings.hostelName}|ID:${s.id}|NAME:${s.name}|ROOM:${s.room}|CNIC:${s.cnic}`);
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;

  document.getElementById("uniModalTitle").innerText = "Digital Student QR Gate Pass ID Card";
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="max-w-sm mx-auto border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-lg bg-white text-zinc-900">
      <div class="bg-zinc-900 text-white p-4 text-center">
        <h3 class="font-extrabold text-base uppercase tracking-wider">${db.settings.hostelName}</h3>
        <span class="text-[10px] uppercase bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">Official Resident Gate Pass ID</span>
      </div>
      <div class="p-5 text-center space-y-3">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-2xl flex items-center justify-center mx-auto border-2 border-emerald-600">
          ${s.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h4 class="text-lg font-bold text-zinc-900">${s.name}</h4>
          <p class="text-xs font-bold text-emerald-700">Roll ID: ${s.id} | Room: ${s.room}</p>
        </div>
        <div class="bg-zinc-100 p-3 rounded-xl text-left text-xs space-y-1">
          <div><strong>CNIC:</strong> ${s.cnic}</div>
          <div><strong>Phone:</strong> ${s.phone}</div>
          <div><strong>Guardian Emergency:</strong> ${s.guardian || 'N/A'}</div>
          <div><strong>Institute:</strong> ${s.uni}</div>
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
      <div class="flex justify-between text-zinc-600">
        <span>Certificate Ref: <strong>CLR-${s.id}-${new Date().getFullYear()}</strong></span>
        <span>Issue Date: <strong>${new Date().toLocaleDateString("en-GB")}</strong></span>
      </div>
      <p class="text-sm leading-relaxed">
        This is to certify that <strong>${s.name}</strong> (Roll ID: <strong>${s.id}</strong>, CNIC: <strong>${s.cnic}</strong>), occupant of Room <strong>${s.room}</strong>, is checking out of the hostel. Below is the final settlement of their account and refundable security deposit:
      </p>
      <table class="w-full text-left border border-zinc-300">
        <tbody class="divide-y divide-zinc-200">
          <tr><td class="p-2 font-semibold">Refundable Security Deposit Held</td><td class="p-2 text-right font-bold text-emerald-700">Rs. ${securityHeld.toLocaleString()}</td></tr>
          <tr><td class="p-2 font-semibold">Pending Rent / Mess / Electricity Dues Deducted</td><td class="p-2 text-right font-bold text-rose-600">- Rs. ${unpaid.toLocaleString()}</td></tr>
          <tr class="bg-zinc-900 text-white text-sm"><td class="p-2.5 font-bold">NET SECURITY REFUNDABLE TO STUDENT</td><td class="p-2.5 text-right font-bold">Rs. ${netRefund.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div class="grid grid-cols-3 gap-4 pt-8 text-center text-[11px] text-zinc-600">
        <div>______________________<br>Warden (Room Key & Assets)</div>
        <div>______________________<br>Accountant / Owner Stamp</div>
        <div>______________________<br>Student Receiving Sign</div>
      </div>
    </div>
  `;
  showUniModal(`Clearance_Certificate_${s.id}.pdf`, "portrait");
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

function checkAndApplyAutoLateFine() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthKey = today.getFullYear() + "-" + (today.getMonth() + 1);

  if (currentDay > 5 && !isMasterPage()) {
    const db = getDB();
    let updated = false;

    (db.students || []).forEach(s => {
      if (s.status === "Active" && s.feeStatus !== "Paid" && s.lastFineMonth !== currentMonthKey) {
        s.otherCharges = Number(s.otherCharges || 0) + 200;
        s.lastFineMonth = currentMonthKey;
        updated = true;
      }
    });

    if (updated) {
      saveDB(db, "Auto-applied Rs. 200 Late Fine to Unpaid students (After 5th of month)", "System");
    }
  }
}

function startNewBillingMonth() {
  const monthName = prompt("Enter New Billing Month Name (e.g. November 2026):", "November 2026");
  if (!monthName) return;

  const db = getDB();
  db.settings.currentMonth = monthName;
  (db.students || []).forEach(s => {
    if (s.status === "Active") {
      if (s.feeStatus !== "Paid") {
        const prevUnpaid = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0);
        s.otherCharges = Number(s.otherCharges || 0) + prevUnpaid;
      } else {
        s.otherCharges = 0;
        s.elec = 0;
      }
      s.feeStatus = "Unpaid";
      s.paymentTid = "";
      s.paymentImg = "";
      s.lastFineMonth = "";
    }
  });

  saveDB(db, `Started new billing cycle for ${monthName} (Custom rents preserved)`, "Admin");
  alert(`New Month (${monthName}) Vouchers Generated!\nEach student's custom agreed rent has been applied.`);
  refreshCurrentPortalUI();
}

function sendStudentFeeReminder(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0);
  const month = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const cleanPhone = "92" + (s.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");
  const opt1 = db.settings.jazzcash || "Not Set";
  const opt2 = db.settings.bankAccount ? `\n🏦 *Option 2:* ${db.settings.bankAccount}` : "";

  const msg = `*FEE REMINDER — ${db.settings.hostelName}*\n\nSalam *${s.name}* (ID: ${s.id}, Room: ${s.room}),\nYour hostel fee for *${month}* is *${s.feeStatus.toUpperCase()}*.\n\n💰 *Payable:* Rs. ${total.toLocaleString()}\n📅 *Due Date:* 05 ${month}\n\n*PAYABLE THROUGH:*\n💳 *Option 1:* ${opt1}${opt2}\n\nStudent Portal: ${window.location.origin}/student?hostel=${TENANT_ID}`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function sendGuardianAlert(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;
  const targetPhone = s.guardian || s.phone;
  if (!targetPhone) return alert("No Guardian or Student phone number saved!");

  const cleanPhone = "92" + targetPhone.replace(/[^0-9]/g, "").replace(/^0/, "");
  const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0);
  const statusText = s.feeStatus === "Paid"
    ? `has *PAID* the monthly hostel dues of Rs. ${total.toLocaleString()}. Thank you!`
    : `has *PENDING* hostel dues of Rs. ${total.toLocaleString()}. Kindly clear before the 5th.`;

  const msg = `*GUARDIAN ALERT — ${db.settings.hostelName}*\n\nRespected Parent/Guardian of *${s.name}* (Room ${s.room}, ID: ${s.id}),\nYour ward ${statusText}`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function exportHostelBackupJSON() {
  const db = getDB();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `Backup_${TENANT_ID}_${new Date().toISOString().slice(0, 10)}.json`);
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
      if (!importedDB.settings || !Array.isArray(importedDB.rooms)) return alert("Invalid backup file!");
      if (confirm(`Restore backup for "${importedDB.settings.hostelName}"?`)) {
        saveDB(importedDB, "Restored database from JSON backup", "Admin");
        location.reload();
      }
    } catch (err) { alert("Invalid JSON file!"); }
  };
  reader.readAsText(file);
}

function shiftStudentRoom(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const availRooms = (db.rooms || []).map(r => {
    const occ = (db.students || []).filter(st => st.status === "Active" && String(st.room) === String(r.no)).length;
    const free = Number(r.capacity || 0) - occ;
    return free > 0 ? `Room ${r.no} (${free} beds free - Rs.${r.rent || s.rent})` : null;
  }).filter(Boolean).join("\n");

  const newRoomNo = prompt(
    `🔄 SHIFT ROOM FOR: ${s.name} (Current Room: ${s.room})\n\nAvailable Rooms:\n${availRooms || "No rooms with free beds!"}\n\nEnter New Room Number:`,
    s.room
  );
  if (!newRoomNo || String(newRoomNo).trim() === String(s.room)) return;

  const targetRoom = (db.rooms || []).find(r => String(r.no) === String(newRoomNo).trim());
  if (!targetRoom) return alert(`Room "${newRoomNo}" does not exist!`);

  const occupied = (db.students || []).filter(st => st.status === "Active" && String(st.room) === String(targetRoom.no)).length;
  if (occupied >= Number(targetRoom.capacity || 0)) {
    return alert(`❌ Room ${targetRoom.no} is already FULL (${occupied}/${targetRoom.capacity} beds occupied)!`);
  }

  const oldRoom = s.room;
  s.room = targetRoom.no;
  if (targetRoom.rent && confirm(`Update ${s.name}'s monthly rent to Room ${targetRoom.no}'s rate (Rs. ${targetRoom.rent})?`)) {
    s.rent = Number(targetRoom.rent);
  }

  saveDB(db, `Shifted ${s.name} (${s.id}) from Room ${oldRoom} to Room ${targetRoom.no}`, "Admin");
  refreshCurrentPortalUI();
  alert(`✅ ${s.name} successfully shifted to Room ${targetRoom.no}!`);
}

function applyMessRebate(studentId) {
  const db = getDB();
  const s = (db.students || []).find(st => st.id === studentId);
  if (!s) return;

  const days = Number(prompt(`🍲 MESS-OFF REBATE CALCULATOR\nStudent: ${s.name} (${s.id})\n\nEnter number of Mess-Off / Leave days:`, "5"));
  if (!days || days <= 0) return;

  const perDayRate = Number(prompt(`Enter Per-Day Mess Deduction Rate (Rs.):`, "250"));
  if (!perDayRate || perDayRate <= 0) return;

  const rebateAmount = days * perDayRate;
  s.discount = Number(s.discount || 0) + rebateAmount;

  saveDB(db, `Applied Rs. ${rebateAmount} Mess-Off Rebate (${days} days @ Rs.${perDayRate}/day) to ${s.name}`, "Admin");
  refreshCurrentPortalUI();
  alert(`✅ Rs. ${rebateAmount.toLocaleString()} Mess Rebate added to ${s.name}'s fee voucher discount!`);
}

function openMonthlyAuditPDF() {
  injectUniversalModal();
  const db = getDB();
  const m = getLiveMetrics();
  const billingMonth = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const expRows = (db.expenses || []).map((e, i) => `
    <tr>
      <td class="p-1.5 border border-zinc-300">${i + 1}</td>
      <td class="p-1.5 border border-zinc-300 font-semibold">${e.title || e.category || 'Expense'}</td>
      <td class="p-1.5 border border-zinc-300">${e.date || '-'}</td>
      <td class="p-1.5 border border-zinc-300 text-right font-bold text-rose-600">Rs. ${Number(e.amount || 0).toLocaleString()}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="p-2 text-center text-zinc-400">No expenses recorded this month</td></tr>`;

  document.getElementById("uniModalTitle").innerText = `Official Monthly Financial Audit Report (${billingMonth})`;
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="border-2 border-zinc-900 p-6 rounded-xl space-y-4 text-xs max-w-3xl mx-auto">
      <div class="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
        <div>
          <h2 class="text-xl font-extrabold uppercase text-zinc-900">${db.settings.hostelName}</h2>
          <p class="text-xs font-bold text-emerald-700 uppercase">Monthly Profit & Loss (P&L) Financial Audit Statement</p>
        </div>
        <div class="text-right">
          <span class="bg-zinc-900 text-white px-3 py-1 rounded font-bold text-xs">${billingMonth}</span>
          <p class="text-[10px] text-zinc-500 mt-1">Generated: ${new Date().toLocaleDateString("en-GB")}</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 text-center bg-zinc-100 p-3 rounded-xl border border-zinc-300">
        <div><span class="text-[10px] text-zinc-500 block">Occupancy</span><strong class="text-sm text-zinc-900">${m.occupiedBeds} / ${m.totalCapacity} Beds</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Collected Revenue</span><strong class="text-sm text-emerald-700">Rs. ${m.collectedFee.toLocaleString()}</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Total Expenses</span><strong class="text-sm text-rose-600">Rs. ${m.totalExpenses.toLocaleString()}</strong></div>
        <div><span class="text-[10px] text-zinc-500 block">Net Profit / Loss</span><strong class="text-sm ${m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">Rs. ${m.netProfit.toLocaleString()}</strong></div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="border border-zinc-300 rounded-lg p-3 space-y-1.5">
          <h4 class="font-bold text-emerald-800 border-b pb-1">A. REVENUE BREAKDOWN</h4>
          <div class="flex justify-between"><span>Paid Students (${m.paidCount}):</span><strong class="text-emerald-700">Rs. ${m.collectedFee.toLocaleString()}</strong></div>
          <div class="flex justify-between"><span>Pending Dues (${m.unpaidCount}):</span><strong class="text-amber-600">Rs. ${m.pendingFee.toLocaleString()}</strong></div>
          <div class="flex justify-between"><span>Refundable Security Held:</span><strong>Rs. ${m.totalSecurity.toLocaleString()}</strong></div>
        </div>
        <div class="border border-zinc-300 rounded-lg p-3 space-y-1.5">
          <h4 class="font-bold text-zinc-800 border-b pb-1">B. FINAL SETTLEMENT</h4>
          <div class="flex justify-between"><span>Gross Collected Cash:</span><strong>Rs. ${m.collectedFee.toLocaleString()}</strong></div>
          <div class="flex justify-between"><span>Less Operational Expenses:</span><strong class="text-rose-600">- Rs. ${m.totalExpenses.toLocaleString()}</strong></div>
          <div class="flex justify-between border-t pt-1 text-sm font-extrabold"><span>NET DISTRIBUTABLE PROFIT:</span><span class="${m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}">Rs. ${m.netProfit.toLocaleString()}</span></div>
        </div>
      </div>

      <div>
        <h4 class="font-bold text-zinc-800 mb-1">C. ITEMIZED EXPENSE LEDGER</h4>
        <table class="w-full text-left border-collapse border border-zinc-300 text-[11px]">
          <thead class="bg-zinc-200">
            <tr><th class="p-1.5 border border-zinc-300">#</th><th class="p-1.5 border border-zinc-300">Expense Head</th><th class="p-1.5 border border-zinc-300">Date</th><th class="p-1.5 border border-zinc-300 text-right">Amount</th></tr>
          </thead>
          <tbody>${expRows}</tbody>
        </table>
      </div>

      <div class="grid grid-cols-3 gap-4 pt-8 text-center text-[11px] text-zinc-600">
        <div>______________________<br>Prepared By (Manager)</div>
        <div>______________________<br>Verified By (Accountant)</div>
        <div>______________________<br>Approved By (Owner / Partner)</div>
      </div>
    </div>
  `;
  showUniModal(`Financial_Audit_${billingMonth.replace(/\s+/g, "_")}.pdf`, "portrait");
}

setTimeout(checkAndApplyAutoLateFine, 2500);

// ============================================================================
// 🎨 UNIVERSAL CUSTOM UI POPUP & ANIMATION ENGINE (Replaces All Browser Alerts!)
// Paste at the very bottom of db.js
// ============================================================================
(function initCustomSaaSUI() {
  if (document.getElementById("saasGlobalAnimations")) return;

  // 1. Global Animations & Custom Popup Styles
  const style = document.createElement("style");
  style.id = "saasGlobalAnimations";
  style.innerHTML = `
    @keyframes saasSlideUpFade {
      0% { opacity: 0; transform: translateY(14px) scale(0.99); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes saasModalSpring {
      0% { opacity: 0; transform: scale(0.88) translateY(18px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes saasBackdropFade {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    [id^="view-"]:not(.hidden),
    [id^="stuView-"]:not(.hidden),
    [id^="wardenView-"]:not(.hidden),
    [id^="masterView-"]:not(.hidden),
    #trackAppResult:not(.hidden),
    #scanResultBox:not(.hidden),
    #pubMobileNav:not(.hidden) {
      animation: saasSlideUpFade 0.36s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    #admissionModal:not(.hidden),
    #approveAllotModal:not(.hidden),
    #universalDocModal:not(.hidden),
    #customSaaSAlertModal:not(.hidden) {
      animation: saasBackdropFade 0.22s ease-out forwards;
    }

    #admissionModal:not(.hidden) > div,
    #approveAllotModal:not(.hidden) > div,
    #universalDocModal:not(.hidden) > div,
    #customSaaSAlertModal:not(.hidden) > div {
      animation: saasModalSpring 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    button, a[class*="rounded"] {
      transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background-color 0.18s ease !important;
    }
    button:hover:not(:disabled), a[class*="rounded"]:hover { transform: translateY(-1.5px); }
    button:active:not(:disabled), a[class*="rounded"]:active { transform: scale(0.96) translateY(0) !important; }
  `;
  document.head.appendChild(style);

  // 2. Replace Browser's Default alert() with Custom In-App UI Modal!
  window.showSaaSPopup = function(rawMsg, customTitle = "") {
    let modal = document.getElementById("customSaaSAlertModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "customSaaSAlertModal";
      modal.className = "fixed inset-0 bg-zinc-950/75 backdrop-blur-xs hidden items-center justify-center z-[9999] p-4";
      document.body.appendChild(modal);
    }

    const msg = String(rawMsg || "").trim();
    const isError = msg.includes("❌") || /invalid|incorrect|denied|error|failed|full/i.test(msg);
    const isWarn  = msg.includes("⚠️") || /warning|wait|cancel/i.test(msg);

    const cleanText = msg.replace(/^[✅❌⚠️🎉🗑️]+\s*/, "");
    const lines = cleanText.split("\n").filter(l => l.trim() !== "");
    const headline = customTitle || (lines[0] || (isError ? "Action Blocked" : isWarn ? "System Notice" : "Success"));
    const bodyLines = customTitle ? lines : lines.slice(1);

    // Check if there is an ID (APP-xxxx or ST-xxx) to offer 1-click copy
    const idMatch = msg.match(/\b(APP-\d+|ST-\d+)\b/);
    const extractedId = idMatch ? idMatch[1] : "";

    const badgeBg = isError ? "bg-rose-600 text-white" : isWarn ? "bg-amber-500 text-zinc-950" : "bg-emerald-600 text-white";
    const iconHtml = isError
      ? `<i class="fa-solid fa-shield-xmark"></i>`
      : isWarn
      ? `<i class="fa-solid fa-triangle-exclamation"></i>`
      : `<i class="fa-solid fa-circle-check"></i>`;
    const tagLabel = isError ? "Security / Validation Alert" : isWarn ? "System Notice" : "Confirmed & Synced";
    const tagColor = isError ? "text-rose-600" : isWarn ? "text-amber-600" : "text-emerald-700";

    modal.innerHTML = `
      <div class="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-zinc-900 font-sans">
        <div class="flex items-start gap-3.5 border-b border-zinc-100 pb-4">
          <div class="w-11 h-11 rounded-xl ${badgeBg} flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
            ${iconHtml}
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-extrabold uppercase tracking-wider ${tagColor} block">${tagLabel}</span>
            <h3 class="text-sm sm:text-base font-extrabold text-zinc-900 mt-0.5 leading-snug break-words">${headline}</h3>
          </div>
          <button type="button" onclick="closeSaaSPopup()" class="text-zinc-400 hover:text-zinc-800 text-xl leading-none">&times;</button>
        </div>

        ${bodyLines.length > 0 ? `
          <div class="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 space-y-1.5 text-xs text-zinc-700 font-medium leading-relaxed">
            ${bodyLines.map(line => `<div class="break-words">${line}</div>`).join("")}
          </div>
        ` : ""}

        ${extractedId ? `
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
            <div>
              <span class="text-[10px] uppercase font-bold text-emerald-700 block">Reference / Roll ID</span>
              <strong class="font-mono text-sm font-extrabold text-zinc-900">${extractedId}</strong>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('${extractedId}');this.innerText='✓ Copied!';" class="bg-white hover:bg-emerald-700 hover:text-white border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer">
              Copy ID
            </button>
          </div>
        ` : ""}

        <div class="pt-1 flex justify-end gap-2">
          <button type="button" id="saasPopupOkBtn" onclick="closeSaaSPopup()" class="w-full ${isError ? 'bg-rose-600 hover:bg-rose-500' : 'bg-zinc-900 hover:bg-zinc-800'} text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer">
            ${isError ? "Try Again" : "Continue →"}
          </button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.style.setProperty("display", "flex", "important");
    setTimeout(() => document.getElementById("saasPopupOkBtn")?.focus(), 50);
  };

  window.closeSaaSPopup = function() {
    const modal = document.getElementById("customSaaSAlertModal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modal.style.setProperty("display", "none", "important");
    }
  };

  // Override native browser alert() globally across all pages!
  window.alert = function(message) {
    window.showSaaSPopup(message);
  };
})();
