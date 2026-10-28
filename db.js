
const firebaseConfig = {
  apiKey: "AIzaSyCRXCp75adfyFUbyZHlgRGQtu2vqb-TPMM",
  authDomain: "hostel-cloud-pk.firebaseapp.com",
  projectId: "hostel-cloud-pk",
  storageBucket: "hostel-cloud-pk.firebasestorage.app",
  messagingSenderId: "394742737685",
  appId: "1:394742737685:web:a8faef1ab5bf69d84e971c"
};

const emptyDB = {
  settings: {
    hostelName: "My Hostel (Update in Settings)",
    jazzcash: "Not Set",
    adminWhatsApp: "",
    adminPass: "123",
    wardenPass: "123"
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
// ============================================================================
// MULTI-TENANT SAAS ENGINE & REMOTE KILL-SWITCH (Fixed - No Duplicate const)
// ============================================================================
const urlParams = new URLSearchParams(window.location.search);
const TENANT_ID = (urlParams.get("hostel") || "main_hostel").toLowerCase().replace(/[^a-z0-9_-]/g, "");
const DB_KEY = "HOSTEL_SAAS_DB_" + TENANT_ID;
let cloudDocRef = null;

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http") && !href.startsWith("#") && !href.includes("?hostel=")) {
      link.setAttribute("href", `${href.replace('.html', '')}?hostel=${TENANT_ID}`);
    }
  });
});

try {
  if (typeof firebase !== "undefined" && firebaseConfig.apiKey !== "AIzaSyD-YOUR-API-KEY-HERE") {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const firestore = firebase.firestore();
    cloudDocRef = firestore.collection("hostel_system").doc(TENANT_ID);

    cloudDocRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const cloudData = docSnap.data();

        // 🔒 REMOTE SAAS KILL-SWITCH (If suspended from master.html)
        if (cloudData.settings && cloudData.settings.isSuspended === true && !location.pathname.includes("master")) {
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

        localStorage.setItem(DB_KEY, JSON.stringify(cloudData));
        refreshCurrentPortalUI();
      } else {
        cloudDocRef.set(getDB());
      }
    }, (err) => {
      console.error("Firestore Sync Blocked (Check Firebase Rules):", err);
    });
  }
} catch (err) {
  console.error("Firebase Init Error:", err);
}

function refreshCurrentPortalUI() {
  if (typeof renderAdminAll === "function") renderAdminAll();
  if (typeof loadPublicSite === "function") loadPublicSite();
  if (typeof renderPublicPage === "function") renderPublicPage();
  if (typeof renderWardenConsole === "function") renderWardenConsole();
  if (typeof renderStudentDashboard === "function" && window.loggedStudent) renderStudentDashboard();
}
function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(emptyDB));
    return JSON.parse(JSON.stringify(emptyDB));
  }
  return JSON.parse(raw);
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
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  

  if (cloudDocRef) {
    cloudDocRef.set(db).catch(err => console.error("Cloud Sync Error:", err));
  }
}function wipeAllData() {
  if (confirm("Are you sure? This will wipe all rooms, students, and records from Cloud & Local!")) {
    const fresh = JSON.parse(JSON.stringify(emptyDB));
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    if (cloudDocRef) {
      cloudDocRef.set(fresh).then(() => location.reload());
    } else {
      location.reload();
    }
  }
}

// PWA INSTALLER
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

// LIVE METRICS CALCULATOR
function getLiveMetrics() {
  const db = getDB();
  const totalCapacity = db.rooms.reduce((sum, r) => sum + Number(r.capacity || 0), 0);
  const activeStudents = db.students.filter(s => s.status === "Active");
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

  const totalExpenses = db.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = collectedFee - totalExpenses;
  const pendingApps = db.applications.filter(a => a.status === "Pending").length;
  const openComplaints = db.complaints.filter(c => c.status !== "Resolved").length;

  return {
    totalCapacity, occupiedBeds, emptyBeds,
    collectedFee, pendingFee, paidCount, unpaidCount,
    totalExpenses, netProfit, totalSecurity,
    pendingApps, openComplaints
  };
}

// ============================================================================
// UNIVERSAL PRINT / PDF MODAL (Handles Vouchers, QR ID Cards & Clearance Forms)
// ============================================================================
function injectUniversalModal() {
  if (document.getElementById("universalDocModal")) return;
  const div = document.createElement("div");
  div.id = "universalDocModal";
  div.className = "fixed inset-0 bg-black/80 hidden items-center justify-center z-50 p-4 overflow-y-auto";
  div.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-5 space-y-4 my-8 text-slate-100">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 id="uniModalTitle" class="text-base font-bold text-white">Document Preview</h3>
        <button onclick="document.getElementById('universalDocModal').classList.add('hidden')" class="text-slate-400 hover:text-white text-xl">&times;</button>
      </div>
      <div id="uniPrintArea" class="bg-white text-slate-900 p-5 rounded-xl"></div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="document.getElementById('universalDocModal').classList.add('hidden')" class="px-4 py-2 rounded-lg bg-slate-800 text-xs">Close</button>
        <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"><i class="fa-solid fa-print mr-1"></i> Print</button>
        <button id="uniDownloadBtn" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"><i class="fa-solid fa-file-pdf mr-1"></i> Download PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

// 1. 2-COPY FEE VOUCHER (With Billing Month & 5th Due Date Warning)
function openStudentVoucher(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = db.students.find(st => st.id === studentId);
  if (!s) return alert("Student not found!");

  const rent = Number(s.rent || 0), mess = Number(s.mess || 0), elec = Number(s.elec || 0), other = Number(s.otherCharges || 0), disc = Number(s.discount || 0);
  const total = rent + mess + elec + other - disc;
  const challanNo = "CH-" + new Date().getFullYear() + "-" + s.id.replace("ST-", "");

  // Active Billing Month & Due Date
  const billingMonth = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const dueDateText = `05 ${billingMonth}`;

  const buildCopy = (copyTitle, badgeColor) => `
    <div class="border-2 border-dashed border-slate-400 p-4 rounded-lg text-xs space-y-2.5">
      <div class="flex justify-between items-start border-b border-slate-300 pb-2">
        <div>
          <h4 class="font-bold text-sm uppercase text-slate-900">${db.settings.hostelName}</h4>
          <p class="text-[10px] text-slate-600">JazzCash / Easypaisa / Bank: <strong>${db.settings.jazzcash}</strong></p>
        </div>
        <span class="${badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded">${copyTitle}</span>
      </div>
      <div class="grid grid-cols-2 gap-1 text-[11px] bg-slate-100 p-2 rounded">
        <div>Challan #: <strong>${challanNo}</strong></div>
        <div>Billing Month: <strong class="text-indigo-700">${billingMonth}</strong></div>
        <div>Due Date: <strong class="text-rose-600">${dueDateText}</strong></div>
        <div>Status: <strong class="${s.feeStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-600'}">${s.feeStatus.toUpperCase()}</strong></div>
        <div>Student: <strong>${s.name} (${s.id})</strong></div>
        <div>Room: <strong>${s.room}</strong></div>
      </div>
      <table class="w-full text-left text-[11px] border-t border-b border-slate-300 my-1">
        <tbody class="divide-y divide-slate-200">
          <tr><td class="py-1">1. Monthly Room / Bed Rent</td><td class="py-1 text-right font-semibold">Rs. ${rent.toLocaleString()}</td></tr>
          <tr><td class="py-1">2. Mess / Meal Charges</td><td class="py-1 text-right font-semibold">Rs. ${mess.toLocaleString()}</td></tr>
          <tr><td class="py-1">3. Electricity Sub-Meter Share</td><td class="py-1 text-right font-semibold">Rs. ${elec.toLocaleString()}</td></tr>
          <tr><td class="py-1 text-rose-600">4. Late Fine / Arrears (Rs. 200 after 5th)</td><td class="py-1 text-right font-semibold text-rose-600">Rs. ${other.toLocaleString()}</td></tr>
          <tr><td class="py-1 text-emerald-700">5. Discount / Scholarship</td><td class="py-1 text-right font-semibold text-emerald-700">- Rs. ${disc.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div class="flex justify-between items-center text-sm font-bold bg-slate-900 text-white px-3 py-2 rounded">
        <span>NET PAYABLE:</span>
        <span>Rs. ${total.toLocaleString()}</span>
      </div>
      <p class="text-[10px] text-rose-600 font-semibold text-center">* Note: Rs. 200 Late Fine applies automatically after 5th of the month.</p>
      ${s.paymentTid ? `<p class="text-[10px] text-indigo-700 font-semibold">Paid TID Submitted: ${s.paymentTid}</p>` : ''}
      <div class="pt-2 flex justify-between text-[10px] text-slate-500">
        <span>Depositor Sign: __________</span>
        <span>Authorized Sign: __________</span>
      </div>
    </div>
  `;

  document.getElementById("uniModalTitle").innerText = `Official 2-Copy Fee Voucher (${billingMonth})`;
  document.getElementById("uniPrintArea").innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">${buildCopy("HOSTEL ADMIN COPY", "bg-slate-900") + buildCopy("STUDENT COPY", "bg-indigo-700")}</div>`;
  showUniModal(`Fee_Voucher_${s.id}_${billingMonth.replace(/\s+/g, "_")}.pdf`, "landscape");
}
// 2. DIGITAL QR STUDENT ID CARD GENERATOR
function openStudentQRCard(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = db.students.find(st => st.id === studentId);
  if (!s) return;

  const qrData = encodeURIComponent(`HOSTEL:${db.settings.hostelName}|ID:${s.id}|NAME:${s.name}|ROOM:${s.room}|CNIC:${s.cnic}`);
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}`;

  document.getElementById("uniModalTitle").innerText = "Digital Student QR Gate Pass ID Card";
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="max-w-sm mx-auto border-2 border-slate-800 rounded-2xl overflow-hidden shadow-lg bg-white text-slate-900">
      <div class="bg-indigo-700 text-white p-4 text-center">
        <h3 class="font-extrabold text-base uppercase tracking-wider">${db.settings.hostelName}</h3>
        <span class="text-[10px] uppercase bg-indigo-900 px-2.5 py-0.5 rounded-full">Official Resident Gate Pass ID</span>
      </div>
      <div class="p-5 text-center space-y-3">
        <div class="w-16 h-16 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-2xl flex items-center justify-center mx-auto border-2 border-indigo-600">
          ${s.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h4 class="text-lg font-bold text-slate-900">${s.name}</h4>
          <p class="text-xs font-bold text-indigo-700">Roll ID: ${s.id} | Room: ${s.room}</p>
        </div>
        <div class="bg-slate-100 p-3 rounded-xl text-left text-xs space-y-1">
          <div><strong>CNIC:</strong> ${s.cnic}</div>
          <div><strong>Phone:</strong> ${s.phone}</div>
          <div><strong>Guardian Emergency:</strong> ${s.guardian || 'N/A'}</div>
          <div><strong>Institute:</strong> ${s.uni}</div>
        </div>
        <div class="py-2">
          <img src="${qrImgUrl}" alt="QR Code" class="w-32 h-32 mx-auto border p-1 rounded-lg" crossorigin="anonymous" />
          <p class="text-[10px] text-slate-500 mt-1">Scan at Hostel Gate for Entry/Exit & Mess Verification</p>
        </div>
      </div>
    </div>
  `;
  showUniModal(`Hostel_ID_Card_${s.id}.pdf`, "portrait");
}

// 3. NO-DUES CLEARANCE & SECURITY DEPOSIT REFUND CERTIFICATE
function openClearanceCertificate(studentId) {
  injectUniversalModal();
  const db = getDB();
  const s = db.students.find(st => st.id === studentId);
  if (!s) return;

  const unpaid = s.feeStatus === "Paid" ? 0 : (Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0));
  const securityHeld = Number(s.security || 0);
  const netRefund = Math.max(0, securityHeld - unpaid);

  document.getElementById("uniModalTitle").innerText = "Student No-Dues Clearance & Security Refund Certificate";
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="border-2 border-slate-800 p-6 rounded-xl space-y-4 text-xs max-w-2xl mx-auto">
      <div class="text-center border-b-2 border-slate-300 pb-3">
        <h2 class="text-xl font-extrabold uppercase">${db.settings.hostelName}</h2>
        <p class="text-xs font-bold text-slate-600 uppercase mt-1">Official Leaving Clearance & Security Refund Certificate</p>
      </div>
      <div class="flex justify-between text-slate-600">
        <span>Certificate Ref: <strong>CLR-${s.id}-${new Date().getFullYear()}</strong></span>
        <span>Issue Date: <strong>${new Date().toLocaleDateString("en-GB")}</strong></span>
      </div>
      <p class="text-sm leading-relaxed">
        This is to certify that <strong>${s.name}</strong> (Roll ID: <strong>${s.id}</strong>, CNIC: <strong>${s.cnic}</strong>), occupant of Room <strong>${s.room}</strong>, is checking out of the hostel. Below is the final settlement of their account and refundable security deposit:
      </p>
      <table class="w-full text-left border border-slate-300">
        <tbody class="divide-y divide-slate-200">
          <tr><td class="p-2 font-semibold">Refundable Security Deposit Held</td><td class="p-2 text-right font-bold text-emerald-700">Rs. ${securityHeld.toLocaleString()}</td></tr>
          <tr><td class="p-2 font-semibold">Pending Rent / Mess / Electricity Dues Deducted</td><td class="p-2 text-right font-bold text-rose-600">- Rs. ${unpaid.toLocaleString()}</td></tr>
          <tr class="bg-slate-900 text-white text-sm"><td class="p-2.5 font-bold">NET SECURITY REFUNDABLE TO STUDENT</td><td class="p-2.5 text-right font-bold">Rs. ${netRefund.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div class="grid grid-cols-3 gap-4 pt-8 text-center text-[11px] text-slate-600">
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
  document.getElementById("uniDownloadBtn").onclick = () => {
    const el = document.getElementById("uniPrintArea");
    html2pdf().set({
      margin: 0.3,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation }
    }).from(el).save();
  };
}
// ============================================================================
// AUTO 5th DATE LATE FINE (Rs. 200) & NEW MONTH BILLING CYCLE
// Paste at the very bottom of db.js
// ============================================================================
function checkAndApplyAutoLateFine() {
  const today = new Date();
  const currentDay = today.getDate(); // Gets day of month (1 to 31)
  const currentMonthKey = today.getFullYear() + "-" + (today.getMonth() + 1);

  // Agar aaj 5 tareekh se upar ho chuki hai (e.g. 6th, 7th...)
  if (currentDay > 5) {
    const db = getDB();
    let updated = false;

    db.students.forEach(s => {
      if (s.status === "Active" && s.feeStatus !== "Paid" && s.lastFineMonth !== currentMonthKey) {
        s.otherCharges = Number(s.otherCharges || 0) + 200; // Auto Rs. 200 Fine
        s.lastFineMonth = currentMonthKey; // Ek mahine me sirf 1 dafa fine lagega
        updated = true;
      }
    });

    if (updated) {
      saveDB(db, "Auto-applied Rs. 200 Late Fine to Unpaid students (After 5th of month)", "System");
    }
  }
}

// Har naye mahine ki 1 tareekh ko Admin ye button dabayega
function startNewBillingMonth() {
  const monthName = prompt("Enter New Billing Month Name (e.g. November 2026):", "November 2026");
  if (!monthName) return;

  const db = getDB();
db.settings.currentMonth = monthName;
  db.students.forEach(s => {
    if (s.status === "Active") {
      // Agar pichle mahine ki fee Unpaid thi, toh wo pichle baqaya (otherCharges) me add ho jayegi
      if (s.feeStatus !== "Paid") {
        const prevUnpaid = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0);
        s.otherCharges = Number(s.otherCharges || 0) + prevUnpaid;
      } else {
        // Paid walon ka fine aur bijli 0 ho jayegi, lekin unka Agreed Rent (3500 ya 5000) wohi rahega!
        s.otherCharges = 0;
        s.elec = 0;
      }
      s.feeStatus = "Unpaid";
      s.paymentTid = "";
      s.paymentImg = "";
      s.lastFineMonth = ""; // Reset fine tracker for the new month
    }
  });

  saveDB(db, `Started new billing cycle for ${monthName} (Custom rents preserved)`, "Admin");
  alert(`New Month (${monthName}) Vouchers Generated!\nEach student's custom agreed rent (e.g. 3500 or 5000) has been applied.`);
  refreshCurrentPortalUI();
}


// ============================================================================
// 🚀 CLEAN NATIVE SAAS SUITE (No Top Bar! Direct Row Buttons + Settings Backup)
// ============================================================================
const SAAS_FOUNDER_WHATSAPP = "923000000000"; // Apna WhatsApp number yahan likhein
const SAAS_BRAND_NAME = "HostelCloud SaaS";

// 1. 📲 DIRECT WHATSAPP FEE REMINDER (Clicks right next to Student Name)
function sendStudentFeeReminder(studentId) {
  const db = getDB();
  const s = db.students.find(st => st.id === studentId);
  if (!s) return;

  const total = Number(s.rent || 0) + Number(s.mess || 0) + Number(s.elec || 0) + Number(s.otherCharges || 0) - Number(s.discount || 0);
  const month = db.settings.currentMonth || new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const cleanPhone = "92" + (s.phone || "").replace(/[^0-9]/g, "").replace(/^0/, "");

  const msg = `*FEE REMINDER — ${db.settings.hostelName}*\n\nSalam *${s.name}* (ID: ${s.id}, Room: ${s.room}),\nYour hostel fee for *${month}* is *${s.feeStatus.toUpperCase()}*.\n\n💰 *Payable:* Rs. ${total.toLocaleString()}\n📅 *Due Date:* 05 ${month}\n💳 *JazzCash/Easypaisa:* ${db.settings.jazzcash}\n\nStudent Portal: ${window.location.origin}/student?hostel=${TENANT_ID}`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
}

// 2. 👨‍👩‍👦 DIRECT PARENT/GUARDIAN WHATSAPP ALERT (Clicks right next to Student Name)
function sendGuardianAlert(studentId) {
  const db = getDB();
  const s = db.students.find(st => st.id === studentId);
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

// 3. 💾 CLOUD JSON BACKUP DOWNLOAD & RESTORE (Inside Settings)
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

// 4. 🎯 AUTO-INJECT BUTTONS NEXT TO EACH STUDENT & BACKUP INSIDE SETTINGS
function enhanceAdminUI() {
  // A) Har Student ke Row mein (openStudentVoucher button ke bilkul sath) Remind & Parent buttons lagana:
  document.querySelectorAll("button[onclick*='openStudentVoucher(']").forEach(voucherBtn => {
    if (voucherBtn.dataset.waInjected) return;
    const match = voucherBtn.getAttribute("onclick").match(/openStudentVoucher\(['"]([^'"]+)['"]\)/);
    if (!match) return;
    const studentId = match[1];
    voucherBtn.dataset.waInjected = "true";

    const remindBtn = document.createElement("button");
    remindBtn.type = "button";
    remindBtn.onclick = () => sendStudentFeeReminder(studentId);
    remindBtn.className = "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-bold transition ml-1";
    remindBtn.title = "Send WhatsApp Fee Reminder to Student";
    remindBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Remind`;

    const parentBtn = document.createElement("button");
    parentBtn.type = "button";
    parentBtn.onclick = () => sendGuardianAlert(studentId);
    parentBtn.className = "bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 px-2 py-1 rounded text-[11px] font-bold transition ml-1";
    parentBtn.title = "Send WhatsApp Alert to Parent/Guardian";
    parentBtn.innerHTML = `<i class="fa-solid fa-user-shield"></i> Parent`;

    voucherBtn.insertAdjacentElement("afterend", parentBtn);
    voucherBtn.insertAdjacentElement("afterend", remindBtn);
  });

  // B) Settings Section ke andar (wipeAllData button ke sath) Backup & Restore lagana:
  const wipeBtn = document.querySelector("button[onclick*='wipeAllData']");
  if (wipeBtn && !document.getElementById("settingsBackupBox")) {
    const backupBox = document.createElement("div");
    backupBox.id = "settingsBackupBox";
    backupBox.className = "mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3";
    backupBox.innerHTML = `
      <div>
        <h4 class="text-xs font-bold text-white"><i class="fa-solid fa-cloud-arrow-down text-indigo-400 mr-1"></i> Cloud Database Backup & Restore</h4>
        <p class="text-[11px] text-slate-400">Download a safe copy of all hostel records or restore from a file.</p>
      </div>
      <div class="flex gap-2">
        <button type="button" onclick="exportHostelBackupJSON()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition">
          <i class="fa-solid fa-download mr-1"></i> Download Backup (.json)
        </button>
        <label class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition">
          <i class="fa-solid fa-upload mr-1"></i> Restore Backup
          <input type="file" accept=".json" onchange="importHostelBackupJSON(event)" class="hidden" />
        </label>
      </div>
    `;
    wipeBtn.parentNode.insertAdjacentElement("beforebegin", backupBox);
  }
}

// Jab bhi Admin table render ho ya data update ho, buttons khud lag jayein:
window.addEventListener("DOMContentLoaded", () => {
  enhanceAdminUI();
  const observer = new MutationObserver(() => enhanceAdminUI());
  observer.observe(document.body, { childList: true, subtree: true });

  // Clean SaaS Footer at the very bottom
  if (!location.pathname.includes("master") && !document.getElementById("saasBrandingFooter")) {
    const footer = document.createElement("footer");
    footer.id = "saasBrandingFooter";
    footer.className = "text-center py-4 px-4 mt-12 border-t border-slate-800/80 text-[11px] text-slate-400";
    footer.innerHTML = `⚡ Powered by <strong class="text-indigo-400">${SAAS_BRAND_NAME}</strong> — <a href="https://wa.me/${SAAS_FOUNDER_WHATSAPP}" target="_blank" class="text-emerald-400 hover:underline font-bold">Get this Software for your Hostel ↗</a>`;
    document.body.appendChild(footer);
  }
});
