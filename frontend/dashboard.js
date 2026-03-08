// ══════════════════════════════════════════════════════════
//  dashboard.js  —  E-logbook · Dashboard & Statistik
// ══════════════════════════════════════════════════════════

const JENIS_ICON = {
  "Patroli Rutin"     : "🚢",
  "Pemeriksaan Kapal" : "🔍",
  "Standby"           : "⚓",
  "Bunker"            : "⛽",
  "Pengawalan"        : "🛡️",
  "SAR"               : "🆘",
  "Penegakan Hukum"   : "⚖️",
};

/* ──────────────────────────────────────────────
   REFRESH DASHBOARD UTAMA
────────────────────────────────────────────── */
async function refreshDashboard() {
  const btn = document.querySelector("[onclick='refreshDashboard()']");
  if (btn) btn.textContent = "⏳ Memuat…";

  try {
    const [stats, recent] = await Promise.all([
      window._fb.getStatsDashboard(),
      window._fb.getRecentLogbook(8)
    ]);

    // — Stat cards —
    animateCount("stat-aktif",        stats.kapalAktifHariIni);
    animateCount("stat-total",        stats.totalAktivitasBulanIni);
    animateCount("stat-pelanggaran",  stats.pelanggaranBulanIni);
    animateCount("stat-perbaikan",    stats.kapalPerbaikan);

    // — Timeline —
    renderTimeline(recent);

    // — Status kapal mini —
    renderShipStatusMini(stats.semuaKapal);

    // — Bar chart —
    renderBarChart(stats.rekapJenis);

    // — Tabel logbook terakhir —
    renderRecentTable(recent);

  } catch (err) {
    console.error("[Dashboard]", err);
  } finally {
    if (btn) btn.textContent = "↻ Refresh";
  }
}

/* ──────────────────────────────────────────────
   ANIMASI ANGKA
────────────────────────────────────────────── */
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start    = 0;
  const duration = 600;
  const step     = Math.ceil(target / (duration / 16));
  let   current  = start;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 16);
}

/* ──────────────────────────────────────────────
   TIMELINE AKTIVITAS TERKINI
────────────────────────────────────────────── */
function renderTimeline(logList) {
  const wrap = document.getElementById("timeline-dashboard");
  if (!wrap) return;

  if (!logList.length) {
    wrap.innerHTML = `<div class="empty-state sm">Belum ada aktivitas tercatat.</div>`;
    return;
  }

  wrap.innerHTML = logList.slice(0, 6).map(l => {
    const icon = JENIS_ICON[l.jenisAktivitas] || "📋";
    const jam  = l.jamBerangkat ? l.jamBerangkat.slice(0,5) : "--:--";
    const ada  = l.temuan && l.temuan !== "";
    return `
    <div class="timeline-item">
      <div class="timeline-dot ${ada ? "dot-red" : "dot-cyan"}"></div>
      <div class="timeline-content">
        <div class="timeline-title">${icon} ${l.jenisAktivitas || "Aktivitas"}</div>
        <div class="timeline-sub">${l.kapal || "—"} · ${l.wilayah || "—"}</div>
        <div class="timeline-time">${l.tanggal || ""} ${jam}</div>
        ${ada ? `<span class="badge badge-red badge-xs">⚠ ${l.temuan.slice(0,30)}…</span>` : ""}
      </div>
    </div>`;
  }).join("");
}

/* ──────────────────────────────────────────────
   STATUS KAPAL MINI (sidebar dashboard)
────────────────────────────────────────────── */
const STATUS_STYLE = {
  patrol      : { dot: "dot-green",  label: "Patroli"     },
  standby     : { dot: "dot-cyan",   label: "Standby"     },
  maintenance : { dot: "dot-red",    label: "Maintenance" },
  docking     : { dot: "dot-gold",   label: "Docking"     },
};

function renderShipStatusMini(kapalList) {
  const wrap = document.getElementById("ship-status-mini");
  if (!wrap) return;

  if (!kapalList.length) {
    wrap.innerHTML = `<div class="empty-state sm">Belum ada data kapal.</div>`;
    return;
  }

  wrap.innerHTML = kapalList.map(k => {
    const st = STATUS_STYLE[k.status] || { dot: "dot-cyan", label: k.status };
    return `
    <div class="ship-mini-row">
      <div class="ship-mini-dot ${st.dot}"></div>
      <div class="ship-mini-name">${k.nama || "—"}</div>
      <div class="ship-mini-status">${st.label}</div>
    </div>`;
  }).join("");
}

/* ──────────────────────────────────────────────
   BAR CHART — JENIS AKTIVITAS
────────────────────────────────────────────── */
const BAR_COLORS = ["#00c6c6","#f0c040","#4ecb71","#e05252","#7c9fd4","#e0884f","#b07ce8"];

function renderBarChart(rekapJenis) {
  const wrap = document.getElementById("bar-chart");
  if (!wrap) return;

  const entries = Object.entries(rekapJenis);
  if (!entries.length) {
    wrap.innerHTML = `<div class="empty-state sm">Belum ada data bulan ini.</div>`;
    return;
  }

  const maxVal = Math.max(...entries.map(e => e[1]));

  wrap.innerHTML = `
  <div class="bar-chart-inner">
    ${entries.map(([label, val], i) => {
      const pct   = Math.round((val / maxVal) * 100);
      const color = BAR_COLORS[i % BAR_COLORS.length];
      return `
      <div class="bar-group">
        <div class="bar-col-wrap">
          <div class="bar-val">${val}</div>
          <div class="bar-col" style="height:${pct}%;background:${color};"></div>
        </div>
        <div class="bar-label">${label.replace(" ", "\n")}</div>
      </div>`;
    }).join("")}
  </div>`;
}

/* ──────────────────────────────────────────────
   TABEL LOGBOOK TERAKHIR (di dashboard)
────────────────────────────────────────────── */
function renderRecentTable(logList) {
  const tbody = document.getElementById("tbl-recent");
  if (!tbody) return;

  if (!logList.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">Belum ada data.</td></tr>`;
    return;
  }

  tbody.innerHTML = logList.slice(0, 5).map(l => {
    const ada = l.temuan && l.temuan !== "";
    return `
    <tr onclick="openDetailLog(${JSON.stringify(l).replace(/"/g,"&quot;")})" class="row-clickable">
      <td><b>${l.kapal || "—"}</b></td>
      <td>${l.jenisAktivitas || "—"}</td>
      <td class="mono">${l.tanggal || "—"} ${(l.jamBerangkat || "").slice(0,5)}</td>
      <td>
        <span class="badge ${ada ? "badge-red" : "badge-green"}">
          ${ada ? "Ada Temuan" : "Normal"}
        </span>
      </td>
    </tr>`;
  }).join("");
}

/* ──────────────────────────────────────────────
   REAL-TIME LISTENER (opsional — aktifkan jika mau live)
────────────────────────────────────────────── */
// Uncomment baris berikut untuk mengaktifkan update otomatis:
// window.addEventListener("firebase-ready", () => {
//   window._fb.listenLogbook((items) => {
//     renderTimeline(items);
//     renderRecentTable(items);
//   }, 8);
// });