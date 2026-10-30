// ============================================================================
// 📸 STUDENT PHOTO & CNIC (FRONT/BACK) KYC ENGINE + ADMIN VIEWER
// Paste at the very bottom of db.js
// ============================================================================
window.kycTempUploads = { photo: "", cnicFront: "", cnicBack: "" };

// Smart Image Compressor (Compresses camera photos to ~30KB for fast Cloud Sync)
window.handleKYCFileUpload = function(inputEl, key, previewId) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const maxW = key === "photo" ? 320 : 600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
      window.kycTempUploads[key] = compressedDataUrl;

      const prev = document.getElementById(previewId);
      if (prev) {
        prev.src = compressedDataUrl;
        prev.classList.remove("hidden");
        prev.style.setProperty("display", "block", "important");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// View Applicant or Resident Photo + CNIC Front & Back in Modal
window.openKYCDocumentsModal = function(recordId) {
  injectUniversalModal();
  const db = getDB();
  const rec = (db.applications || []).find(a => String(a.id) === String(recordId)) ||
              (db.students || []).find(s => String(s.id) === String(recordId));
  if (!rec) return alert("Record not found!");

  document.getElementById("uniModalTitle").innerText = `KYC Identity Documents — ${rec.name} (${rec.id})`;
  document.getElementById("uniPrintArea").innerHTML = `
    <div class="space-y-5 text-xs max-w-3xl mx-auto p-2">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div class="flex items-center gap-3.5">
          ${rec.photo
            ? `<img src="${rec.photo}" class="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-900 shadow-sm" />`
            : `<div class="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center font-bold text-zinc-500">No Photo</div>`
          }
          <div>
            <span class="text-[10px] font-extrabold uppercase text-emerald-700 block">Verified Resident KYC File</span>
            <h3 class="text-lg font-extrabold text-zinc-900">${rec.name}</h3>
            <p class="text-zinc-600 font-mono">ID: ${rec.id} • CNIC: ${rec.cnic || '—'} • Phone: ${rec.phone || '—'}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="bg-zinc-900 text-white px-3 py-1 rounded-lg font-bold">Room ${rec.room || '—'}</span>
          <p class="text-[11px] text-zinc-500 mt-1">Guardian: ${rec.guardian || '—'}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-zinc-300 rounded-xl p-3 bg-zinc-50 space-y-2 text-center">
          <span class="text-[11px] font-bold uppercase text-zinc-700 block"><i class="fa-solid fa-id-card text-emerald-700 mr-1"></i> CNIC / B-Form (Front Side)</span>
          ${rec.cnicFront
            ? `<img src="${rec.cnicFront}" class="w-full h-52 object-contain rounded-lg border border-zinc-200 bg-white mx-auto" />`
            : `<div class="h-52 flex items-center justify-center text-zinc-400 bg-white rounded-lg border border-dashed border-zinc-300">No CNIC Front Uploaded</div>`
          }
        </div>
        <div class="border border-zinc-300 rounded-xl p-3 bg-zinc-50 space-y-2 text-center">
          <span class="text-[11px] font-bold uppercase text-zinc-700 block"><i class="fa-solid fa-id-card-clip text-emerald-700 mr-1"></i> CNIC / B-Form (Back Side)</span>
          ${rec.cnicBack
            ? `<img src="${rec.cnicBack}" class="w-full h-52 object-contain rounded-lg border border-zinc-200 bg-white mx-auto" />`
            : `<div class="h-52 flex items-center justify-center text-zinc-400 bg-white rounded-lg border border-dashed border-zinc-300">No CNIC Back Uploaded</div>`
          }
        </div>
      </div>
    </div>
  `;
  showUniModal(`KYC_Docs_${rec.id}.pdf`, "portrait");
};

// Upgrade QR ID Card to Show Real Student Passport Photo!
const _origOpenQRCard = window.openStudentQRCard;
window.openStudentQRCard = function(studentId) {
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
        <h3 class="font-extrabold text-base uppercase tracking-wider">${db.settings.hostelName}</h3>
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
};

// Auto-Transfer KYC Photos when Admin Approves Application + Inject "🪪 KYC Docs" buttons in Admin Tables
window.addEventListener("DOMContentLoaded", () => {
  // Wrap confirmApproveAndAllot so photo, cnicFront, cnicBack carry over to enrolled student
  if (typeof window.confirmApproveAndAllot === "function") {
    const origApprove = window.confirmApproveAndAllot;
    window.confirmApproveAndAllot = function(e) {
      const appId = document.getElementById("allotAppId")?.value;
      const dbBefore = getDB();
      const app = (dbBefore.applications || []).find(a => String(a.id) === String(appId));
      origApprove(e);
      if (app && (app.photo || app.cnicFront || app.cnicBack)) {
        const dbAfter = getDB();
        const newestStu = (dbAfter.students || [])[0];
        if (newestStu && newestStu.name === app.name) {
          newestStu.photo = app.photo || "";
          newestStu.cnicFront = app.cnicFront || "";
          newestStu.cnicBack = app.cnicBack || "";
          saveDB(dbAfter);
          if (typeof renderAdminAll === "function") renderAdminAll();
        }
      }
    };
  }

  // Observe Admin Tables & Inject "🪪 CNIC/Photo" View Button automatically
  const kycObserver = new MutationObserver(() => {
    // 1. In Applications Table
    document.querySelectorAll("button[onclick*='openApproveModal(']").forEach(btn => {
      if (btn.dataset.kycInjected) return;
      const m = btn.getAttribute("onclick").match(/'([^']+)'/);
      if (!m) return;
      btn.dataset.kycInjected = "true";
      const docBtn = document.createElement("button");
      docBtn.type = "button";
      docBtn.className = "bg-zinc-900 hover:bg-zinc-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition mr-1 cursor-pointer";
      docBtn.innerHTML = `<i class="fa-solid fa-id-card text-emerald-400 mr-1"></i> Photo & CNIC`;
      docBtn.onclick = () => openKYCDocumentsModal(m[1]);
      btn.insertAdjacentElement("beforebegin", docBtn);
    });

    // 2. In Active Students Table
    document.querySelectorAll("button[onclick*='openStudentQRCard(']").forEach(btn => {
      if (btn.dataset.kycInjected) return;
      const m = btn.getAttribute("onclick").match(/'([^']+)'/);
      if (!m) return;
      btn.dataset.kycInjected = "true";
      const docBtn = document.createElement("button");
      docBtn.type = "button";
      docBtn.className = "bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 px-2 py-1 rounded text-[11px] font-semibold cursor-pointer";
      docBtn.title = "View Student Photo & CNIC Front/Back";
      docBtn.innerHTML = `<i class="fa-solid fa-id-card text-emerald-700"></i> CNIC`;
      docBtn.onclick = () => openKYCDocumentsModal(m[1]);
      btn.insertAdjacentElement("afterend", docBtn);
    });
  });
  kycObserver.observe(document.body, { childList: true, subtree: true });
});
