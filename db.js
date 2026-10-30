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
        <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition">
          Unlock Master HQ →
        </button>
      </form>

      <div class="pt-3 border-t border-zinc-100 flex justify-between text-xs text-zinc-500 font-medium">
        <a href="index.html" class="hover:text-zinc-900">← Public Site</a>
        <a href="admin.html" class="hover:text-zinc-900">Active Admin →</a>
      </div>
    </div>
  </div>

  <!-- 📱 MOBILE SIDEBAR BACKDROP OVERLAY -->
  <div id="masterSidebarBackdrop" onclick="toggleMasterMobileMenu()" class="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-40 hidden lg:hidden"></div>

  <!-- 🖥️ FULL-SCREEN MASTER WORKSPACE -->
  <div class="flex h-dvh w-screen overflow-hidden">

    <!-- 🧭 LEFT SIDEBAR NAVIGATION -->
    <aside id="masterSidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-300 flex flex-col justify-between shrink-0 select-none h-full transform -translate-x-full lg:translate-x-0 lg:static transition-transform duration-200 ease-in-out">
      <div>
        <div class="h-16 px-5 flex items-center justify-between border-b border-zinc-800">
          <div class="flex items-center gap-2.5 truncate">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div class="truncate">
              <h1 class="text-sm font-bold text-white truncate">HostelCloud HQ</h1>
              <span class="text-[10px] text-emerald-400 font-semibold block">● Multi-Tenant Master</span>
            </div>
          </div>
          <button onclick="toggleMasterMobileMenu()" class="lg:hidden text-zinc-400 hover:text-white text-lg px-1">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-3 space-y-1.5 text-xs font-semibold">
          <p class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">SaaS Administration</p>

          <button onclick="switchMasterTab('tenants')" id="mnav-tenants" class="mnav w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-zinc-800 text-white font-bold transition">
            <span class="flex items-center gap-2.5"><i class="fa-solid fa-building-shield w-4 text-center text-emerald-400"></i> Active Hostel Clients</span>
            <span id="badgeTotalTenants" class="bg-emerald-500 text-zinc-950 font-extrabold px-1.5 py-0.2 rounded text-[10px]">0</span>
          </button>

          <button onclick="switchMasterTab('generator')" id="mnav-generator" class="mnav w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition">
            <span class="flex items-center gap-2.5"><i class="fa-solid fa-wand-magic-sparkles w-4 text-center"></i> 1-Click Client Onboarding</span>
          </button>
        </div>
      </div>

      <div class="p-3 border-t border-zinc-800 bg-zinc-950/50 space-y-2 text-xs">
        <button onclick="loadAllCloudTenants()" class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-lg font-semibold transition">
          <i class="fa-solid fa-rotate mr-1"></i> Refresh Cloud Data
        </button>
        <button onclick="logoutMaster()" class="w-full flex items-center justify-center gap-1.5 text-rose-400 hover:bg-rose-500/10 py-2 rounded-lg font-bold transition">
          <i class="fa-solid fa-lock text-xs"></i> Lock Master HQ
        </button>
      </div>
    </aside>

    <!-- 🖥️ RIGHT MAIN VIEWPORT -->
    <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-zinc-100">

      <!-- Top Header -->
      <header class="h-14 sm:h-16 bg-white border-b border-zinc-200 px-3.5 sm:px-6 flex items-center justify-between shrink-0 w-full gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <button onclick="toggleMasterMobileMenu()" class="lg:hidden w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-bars text-sm"></i>
          </button>
          <div class="min-w-0">
            <h2 id="masterViewTitle" class="text-sm sm:text-base font-extrabold text-zinc-900 truncate">Multi-Tenant Hostel Directory & License Control</h2>
            <p class="text-[11px] text-zinc-500 truncate">Monitor all client hostels, suspend/activate licenses, or onboard new clients</p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs shrink-0">
          <button onclick="switchMasterTab('generator')" class="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-lg font-bold transition shadow-2xs">
            <i class="fa-solid fa-plus sm:mr-1"></i> <span class="hidden sm:inline">Onboard New Hostel</span>
          </button>
        </div>
      </header>

      <!-- Main Area -->
      <main class="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-24 lg:pb-6 w-full custom-scroll space-y-6">

        <!-- 4-Card Global Ribbon -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
            <span class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase block">Total Hostel Clients</span>
            <strong id="kpiTotalClients" class="text-lg sm:text-2xl font-extrabold text-zinc-900 block mt-0.5">0</strong>
            <span class="text-[10px] text-emerald-700 font-bold">Cloud Firestore Tenants</span>
          </div>
          <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
            <span class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase block">Active Licenses</span>
            <strong id="kpiActiveClients" class="text-lg sm:text-2xl font-extrabold text-emerald-700 block mt-0.5">0</strong>
            <span class="text-[10px] text-zinc-500">Operational Portals</span>
          </div>
          <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
            <span class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase block">Suspended Locks</span>
            <strong id="kpiSuspendedClients" class="text-lg sm:text-2xl font-extrabold text-rose-600 block mt-0.5">0</strong>
            <span class="text-[10px] text-rose-600 font-semibold">Kill-Switch Engaged</span>
          </div>
          <div class="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs">
            <span class="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase block">Total Residents Managed</span>
            <strong id="kpiGlobalStudents" class="text-lg sm:text-2xl font-extrabold text-zinc-900 block mt-0.5">0</strong>
            <span class="text-[10px] text-zinc-500">Across All Hostels</span>
          </div>
        </section>

        <!-- VIEW 1: ACTIVE CLIENTS -->
        <div id="masterView-tenants" class="space-y-4 w-full">
          <div class="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden w-full">
            <div class="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-bold text-zinc-900">Enrolled Hostel Clients (Collection: <code class="text-emerald-700 font-mono">hostel_system</code>)</h3>
                <p class="text-xs text-zinc-500">Manage tenant subscriptions, inspect/change credentials, or open client portals.</p>
              </div>
              <input id="searchTenantInput" oninput="renderTenantsTable()" type="text" placeholder="Search hostel name or tenant ID..." class="bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2 text-xs w-full sm:w-64 outline-none focus:border-zinc-900" />
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-zinc-50 text-zinc-500 uppercase border-b border-zinc-200 font-bold">
                  <tr>
                    <th class="p-3.5">Hostel Name & Tenant ID</th>
                    <th class="p-3.5">Contact / Account</th>
                    <th class="p-3.5">Usage Stats</th>
                    <th class="p-3.5">Assigned Passwords</th>
                    <th class="p-3.5">License Status</th>
                    <th class="p-3.5 text-right">Master SaaS Actions</th>
                  </tr>
                </thead>
                <tbody id="tenantsTableBody" class="divide-y divide-zinc-200">
                  <tr><td colspan="6" class="p-8 text-center text-zinc-400">Loading cloud tenants from Firebase...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- VIEW 2: ONBOARDING GENERATOR -->
        <div id="masterView-generator" class="hidden space-y-6 w-full">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

            <div class="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div class="border-b border-zinc-100 pb-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Instant Provisioning</span>
                <h3 class="text-base font-extrabold text-zinc-900 mt-0.5">Create & Onboard New Hostel</h3>
              </div>

              <form onsubmit="createNewHostelClient(event)" class="space-y-3.5 text-xs">
                <div>
                  <label class="block font-bold text-zinc-700 mb-1">Official Hostel Name *</label>
                  <input id="newHostelName" type="text" required oninput="autoSuggestTenantId()" placeholder="e.g., Al-Madina Boys Hostel Multan" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 font-semibold outline-none focus:border-zinc-900" />
                </div>

                <div>
                  <label class="block font-bold text-zinc-700 mb-1">Unique Tenant ID (URL Slug) *</label>
                  <input id="newTenantId" type="text" required placeholder="e.g., almadina_multan" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-emerald-800 font-mono font-bold outline-none focus:border-zinc-900" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-zinc-700 mb-1">Owner WhatsApp Number *</label>
                    <input id="newOwnerPhone" type="text" required placeholder="03001234567" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 outline-none focus:border-zinc-900" />
                  </div>
                  <div>
                    <label class="block font-bold text-zinc-700 mb-1">JazzCash / Bank Account</label>
                    <input id="newJazzCash" type="text" placeholder="0300-1234567" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 outline-none focus:border-zinc-900" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-zinc-700 mb-1">Set Admin Password *</label>
                    <input id="newAdminPass" type="text" required placeholder="Enter Admin Password" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 font-mono font-bold" />
                  </div>
                  <div>
                    <label class="block font-bold text-zinc-700 mb-1">Set Warden Password *</label>
                    <input id="newWardenPass" type="text" required placeholder="Enter Warden Password" class="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-zinc-900 font-mono font-bold" />
                  </div>
                </div>

                <button type="submit" class="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-bold uppercase tracking-wider transition shadow-sm">
                  <i class="fa-solid fa-bolt text-emerald-400 mr-1.5"></i> Provision Database & Generate Links
                </button>
              </form>
            </div>

            <div class="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Client Package</span>
                    <h3 id="genBoxTitle" class="text-base font-extrabold text-zinc-900 mt-0.5">Ready-to-Share Links</h3>
                  </div>
                  <span id="genTenantBadge" class="bg-zinc-100 text-zinc-700 font-mono text-[11px] font-bold px-2.5 py-1 rounded">No Client Selected</span>
                </div>

                <div id="generatedLinksContainer" class="space-y-2.5 text-xs">
                  <div class="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-center text-zinc-400">
                    Create a new client or click <strong>"🔗 Links"</strong> from the table to view links.
                  </div>
                </div>
              </div>

              <div id="generatedActionsBar" class="hidden pt-3 border-t border-zinc-100 flex flex-col sm:flex-row gap-2.5 text-xs">
                <button type="button" onclick="copyCompleteWelcomePackage()" class="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 px-4 rounded-xl font-bold transition">
                  <i class="fa-solid fa-copy mr-1.5"></i> Copy Message
                </button>
                <button type="button" onclick="sendWelcomePackageWhatsApp()" class="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2.5 px-4 rounded-xl font-bold transition">
                  <i class="fa-brands fa-whatsapp mr-1.5"></i> Send WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      <!-- 📱 MOBILE BAR -->
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 grid grid-cols-3 z-30 shadow-lg">
        <button onclick="switchMasterTab('tenants')" id="mbnav-tenants" class="flex flex-col items-center justify-center gap-1 text-emerald-700 font-extrabold text-[11px]">
          <i class="fa-solid fa-building-shield text-base"></i>
          <span>Clients</span>
        </button>
        <button onclick="switchMasterTab('generator')" id="mbnav-generator" class="flex flex-col items-center justify-center gap-1 text-zinc-500 font-semibold text-[11px]">
          <i class="fa-solid fa-wand-magic-sparkles text-base"></i>
          <span>New Client</span>
        </button>
        <button onclick="loadAllCloudTenants()" class="flex flex-col items-center justify-center gap-1 text-zinc-500 font-semibold text-[11px]">
          <i class="fa-solid fa-rotate text-base"></i>
          <span>Sync</span>
        </button>
      </nav>

    </div>

  </div>

  <script>
    const MASTER_PIN = "4426";
    let allTenantsCache = [];
    let selectedClientPackage = null;

    function toggleMasterMobileMenu() {
      const sb = document.getElementById("masterSidebar");
      const bd = document.getElementById("masterSidebarBackdrop");
      if (sb.classList.contains("-translate-x-full")) {
        sb.classList.remove("-translate-x-full");
        bd.classList.remove("hidden");
      } else {
        sb.classList.add("-translate-x-full");
        bd.classList.add("hidden");
      }
    }

    function hideLoginGate() {
      const gate =
