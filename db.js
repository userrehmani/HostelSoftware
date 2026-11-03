// ============================================================================
// 💎 UPGRADED VIP VOUCHER WITH SECURITY DEPOSIT INCLUDED IN TABLE & TOTAL
// Paste at the very bottom of db.js
// ============================================================================
window.openStudentVoucher = function(studentId) {
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
              <tr style="border-bottom: 1px solid #f4f4f5;"><td style="padding: 5px 8px;">04. Refundable Security Deposit ${s.securityPaid ? '(Paid)' : '(1st Month)'}</td><td style="padding: 5px 8px; text-align: right; font-weight: 700;">Rs. ${secDue.toLocaleString()}</td></tr>
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
};
