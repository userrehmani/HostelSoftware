<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Master SaaS HQ — Multi-Tenant Cloud Control Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <script src="db.js"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 0; }
    #saasBrandingFooter, #globalLiveNoticeBanner { display: none !important; }
    .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 99px; }
  </style>
</head>
<body class="antialiased h-dvh w-screen overflow-hidden select-none sm:select-auto">

  <!-- 🔒 MASTER FOUNDER PIN GATE -->
  <div id="masterLoginGate" class="fixed inset-0 bg-zinc-900/95 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
      <div class="flex items-center gap-3 border-b border-zinc-100 pb-4">
        <div class="w-11 h-11 rounded-xl bg-zinc-900 text-emerald-400 flex items-center justify-center text-lg font-bold shrink-0">
          <i class="fa-solid fa-crown"></i>
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-extrabold text-zinc-900 truncate">Master SaaS HQ</h2>
          <p class="text-xs text-zinc-500">Multi-Tenant Cloud Licensing Control</p>
        </div>
      </div>

      <form onsubmit="verifyMasterPin(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-zinc-700 mb-1.5">Founder Security PIN (4426)</label>
          <input id="masterPinInput" type="password" required placeholder="Enter PIN (4426)" autofocus class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-3 text-sm text-zinc-900 font-mono tracking-widest text-center font-extrabold focus:border-zinc-900 focus:bg-white outline-none" />
        </div>
        <button type="subm
