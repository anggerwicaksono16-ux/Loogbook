// ══════════════════════════════════════════════════════════════════
//  main.js  —  Entry point tunggal E-logbook Kapal Patroli
//  Import Firebase dulu → semua fungsi tersedia → jalankan app
//  ✅ Tidak ada masalah timing / window._fb undefined
// ══════════════════════════════════════════════════════════════════

import {
  fotoToBase64Array,
  saveLogbook    as fbSaveLogbook,
  getAllLogbook,
  getLogbookBulanIni,
  getRecentLogbook,
  deleteLogbook  as fbDeleteLogbook,
  listenLogbook,
  saveKapal      as fbSaveKapal,
  getAllKapal,
  updateStatusKapal,
  deleteKapal    as fbDeleteKapal,
  saveAwak       as fbSaveAwak,
  getAllAwak,
  deleteAwak     as fbDeleteAwak,
  getStatsDashboard,
  seedKapalAwal
} from "./firebase.js";

// ══════════════════════════════════════════════
//  JAM & TANGGAL LIVE
// ══════════════════════════════════════════════
function updateClock() {
  const now  = new Date();
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const mons = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"];
  const pad  = n => String(n).padStart(2,"0");
  const el   = document.getElementById("clock");
  const de   = document.getElementById("dateDisplay");
  if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  if (de) de.textContent = `${days[now.getDay()]} , ${now.getDate()} ${mons[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  if (!toast) return;
  msgEl.textContent = msg;
  toast.className   = `toast toast-${type} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}
window.showToast = showToast;

// ══════════════════════════════════════════════
//  NAVIGASI
// ══════════════════════════════════════════════
window.showPage = function(name, tabEl) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");
  if (tabEl) tabEl.classList.add("active");

  if (name === "dashboard") refreshDashboard();
  if (name === "logbook")   loadLogbook();
  if (name === "kapal")     renderKapal();
  if (name === "awak")      renderAwak();
  if (name === "laporan")   renderRekapBulanan();
};

// ══════════════════════════════════════════════
//  ████  DASHBOARD  ████
// ══════════════════════════════════════════════
const JENIS_ICON = {
  "Patroli Rutin":"🚢","Pemeriksaan Kapal":"🔍","Standby":"⚓",
  "Bunker":"⛽","Pengawalan":"🛡️","SAR":"🆘","Penegakan Hukum":"⚖️"
};
const BAR_COLORS = ["#00c6c6","#f0c040","#4ecb71","#e05252","#7c9fd4","#e0884f","#b07ce8"];
const STATUS_STYLE = {
  patrol     :{ dot:"dot-green", label:"Patroli"      },
  standby    :{ dot:"dot-cyan",  label:"Standby"      },
  maintenance:{ dot:"dot-red",   label:"Maintenance"  },
  docking    :{ dot:"dot-gold",  label:"Docking"      }
};

window.refreshDashboard = async function() {
  const btn = document.querySelector("[onclick=\"refreshDashboard()\"]");
  if (btn) btn.textContent = "⏳ Memuat…";
  try {
    const [stats, recent] = await Promise.all([
      getStatsDashboard(),
      getRecentLogbook(8)
    ]);
    animateCount("stat-aktif",       stats.kapalAktifHariIni);
    animateCount("stat-total",       stats.totalAktivitasBulanIni);
    animateCount("stat-pelanggaran", stats.pelanggaranBulanIni);
    animateCount("stat-perbaikan",   stats.kapalPerbaikan);
    renderTimeline(recent);
    renderShipStatusMini(stats.semuaKapal);
    renderBarChart(stats.rekapJenis);
    renderRecentTable(recent);
  } catch (err) {
    console.error("[Dashboard]", err);
    showToast("✗ Gagal memuat dashboard: " + err.message, "error");
  } finally {
    if (btn) btn.textContent = "↻ Refresh";
  }
};

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step  = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    cur += step;
    if (cur >= target) { cur = target; clearInterval(timer); }
    el.textContent = cur;
  }, 20);
}

function renderTimeline(list) {
  const wrap = document.getElementById("timeline-dashboard");
  if (!wrap) return;
  if (!list.length) { wrap.innerHTML = `<div class="empty-state sm">Belum ada aktivitas.</div>`; return; }
  wrap.innerHTML = list.slice(0,6).map(l => {
    const icon = JENIS_ICON[l.jenisAktivitas] || "📋";
    const jam  = (l.jamBerangkat||"--:--").slice(0,5);
    const ada  = l.temuan && l.temuan !== "";
    return `
    <div class="timeline-item">
      <div class="timeline-dot ${ada?"dot-red":"dot-cyan"}"></div>
      <div class="timeline-content">
        <div class="timeline-title">${icon} ${l.jenisAktivitas||"Aktivitas"}</div>
        <div class="timeline-sub">${l.kapal||"—"} · ${l.wilayah||"—"}</div>
        <div class="timeline-time">${l.tanggal||""} ${jam}</div>
        ${ada?`<span class="badge badge-red badge-xs">⚠ ${l.temuan.slice(0,30)}</span>`:""}
      </div>
    </div>`;
  }).join("");
}

function renderShipStatusMini(kapalList) {
  const wrap = document.getElementById("ship-status-mini");
  if (!wrap) return;
  if (!kapalList.length) { wrap.innerHTML = `<div class="empty-state sm">Belum ada kapal.</div>`; return; }
  wrap.innerHTML = kapalList.map(k => {
    const st = STATUS_STYLE[k.status] || { dot:"dot-cyan", label: k.status||"—" };
    return `
    <div class="ship-mini-row">
      <div class="ship-mini-dot ${st.dot}"></div>
      <div class="ship-mini-name">${k.nama||"—"}</div>
      <div class="ship-mini-status">${st.label}</div>
    </div>`;
  }).join("");
}

function renderBarChart(rekap) {
  const wrap = document.getElementById("bar-chart");
  if (!wrap) return;
  const entries = Object.entries(rekap);
  if (!entries.length) { wrap.innerHTML = `<div class="empty-state sm">Belum ada data bulan ini.</div>`; return; }
  const maxVal = Math.max(...entries.map(e=>e[1]));
  wrap.innerHTML = `<div class="bar-chart-inner">${
    entries.map(([label,val],i) => {
      const pct = Math.round((val/maxVal)*100);
      return `
      <div class="bar-group">
        <div class="bar-col-wrap">
          <div class="bar-val">${val}</div>
          <div class="bar-col" style="height:${pct}%;background:${BAR_COLORS[i%BAR_COLORS.length]};"></div>
        </div>
        <div class="bar-label">${label}</div>
      </div>`;
    }).join("")
  }</div>`;
}

function renderRecentTable(list) {
  const tbody = document.getElementById("tbl-recent");
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="4" class="text-center">Belum ada data.</td></tr>`; return; }
  tbody.innerHTML = list.slice(0,5).map(l => {
    const ada = l.temuan && l.temuan !== "";
    const safeL = encodeURIComponent(JSON.stringify(l));
    return `
    <tr onclick="openDetailLogEncoded('${safeL}')" class="row-clickable">
      <td><b>${l.kapal||"—"}</b></td>
      <td>${l.jenisAktivitas||"—"}</td>
      <td class="mono">${l.tanggal||"—"} ${(l.jamBerangkat||"").slice(0,5)}</td>
      <td><span class="badge ${ada?"badge-red":"badge-green"}">${ada?"Ada Temuan":"Normal"}</span></td>
    </tr>`;
  }).join("");
}

// ══════════════════════════════════════════════
//  ████  LOGBOOK  ████
// ══════════════════════════════════════════════
let _allLogbook = [];

window.loadLogbook = async function() {
  const tbody = document.getElementById("tbl-logbook-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="text-center">⏳ Memuat…</td></tr>`;
  try {
    _allLogbook = await getAllLogbook();
    renderLogbookTable(_allLogbook);
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-red">Gagal: ${err.message}</td></tr>`;
  }
};

function renderLogbookTable(list) {
  const tbody = document.getElementById("tbl-logbook-body");
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Tidak ada data.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(l => {
    const ada     = l.temuan && l.temuan !== "";
    const desc    = (l.deskripsi||l.uraian||"—").slice(0,50);
    const hasFoto = l.foto && l.foto.length > 0;
    const safeL   = encodeURIComponent(JSON.stringify(l));
    return `
    <tr>
      <td class="mono text-xs">${l.noRef||"—"}</td>
      <td>${l.tanggal||"—"}</td>
      <td><b>${l.kapal||"—"}</b></td>
      <td>${l.nakhoda||"—"}</td>
      <td><span class="badge badge-blue">${l.jenisAktivitas||"—"}</span></td>
      <td>${l.wilayah||"—"}</td>
      <td class="text-xs desc-cell">${desc}${(l.deskripsi||l.uraian||"").length>50?"…":""}</td>
      <td>
        <span class="badge ${ada?"badge-red":"badge-green"}">${ada?"Ada Temuan":"Normal"}</span>
        ${hasFoto?`<span title="${l.foto.length} foto" style="margin-left:4px;font-size:12px;">📷${l.foto.length}</span>`:""}
      </td>
      <td>
        <button class="btn btn-outline btn-xs" onclick="openDetailLogEncoded('${safeL}')">👁 Detail</button>
        <button class="btn btn-outline btn-xs btn-danger" onclick="hapusLogbook('${l.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

window.filterLogbook = function() {
  const kapal  = document.getElementById("filter-kapal")?.value  || "";
  const jenis  = document.getElementById("filter-jenis")?.value  || "";
  const dari   = document.getElementById("filter-dari")?.value   || "";
  const sampai = document.getElementById("filter-sampai")?.value || "";
  let f = _allLogbook;
  if (kapal)  f = f.filter(l => l.kapal === kapal);
  if (jenis)  f = f.filter(l => l.jenisAktivitas === jenis);
  if (dari)   f = f.filter(l => l.tanggal >= dari);
  if (sampai) f = f.filter(l => l.tanggal <= sampai);
  renderLogbookTable(f);
};

window.hapusLogbook = async function(docId) {
  if (!confirm("Hapus entri logbook ini?")) return;
  try {
    await fbDeleteLogbook(docId);
    showToast("✓ Logbook dihapus");
    loadLogbook();
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

// ══════════════════════════════════════════════
//  MODAL DETAIL LOG
// ══════════════════════════════════════════════
window.openDetailLogEncoded = function(encoded) {
  try { openDetailLog(JSON.parse(decodeURIComponent(encoded))); }
  catch(e) { console.error(e); }
};

window.openDetailLog = function(log) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val||"—"; };
  set("dl-kapal",        log.kapal);
  set("dl-tanggal-jenis",`${log.tanggal||"—"} · ${log.jenisAktivitas||"—"}`);
  set("dl-waktu",        `${log.jamBerangkat||"—"} – ${log.jamKembali||"—"}`);
  set("dl-lokasi",       log.wilayah);
  set("dl-nakhoda",      log.nakhoda);
  set("dl-deskripsi",    log.deskripsi||log.uraian);
  set("dl-temuan",       log.temuan ? `${log.temuan} → ${log.tindakan||"—"}` : "Tidak ada temuan");

  const fotoWrap = document.getElementById("dl-foto");
  const lblEl    = document.getElementById("dl-dok-label");
  if (fotoWrap) {
    if (log.foto && log.foto.length) {
      fotoWrap.innerHTML = log.foto.map(b64 =>
        `<img src="${b64}" alt="foto" style="width:100%;border-radius:6px;margin-bottom:8px;">`
      ).join("");
      if (lblEl) lblEl.textContent = `DOKUMENTASI (${log.foto.length} foto)`;
    } else {
      fotoWrap.innerHTML = `<div style="color:#666;font-size:13px;padding:12px;">Tidak ada foto</div>`;
      if (lblEl) lblEl.textContent = "DOKUMENTASI";
    }
  }
  document.getElementById("modal-detail").classList.add("open");
};

window.closeDetailLog = function() {
  document.getElementById("modal-detail").classList.remove("open");
};

// ══════════════════════════════════════════════
//  FORM INPUT LOGBOOK
// ══════════════════════════════════════════════
let _fotoFiles = [];

function generateNoRefDisplay() {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth()+1).padStart(2,"0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const el   = document.getElementById("form-noref");
  if (el) el.textContent = `No. Ref: LBK-${yy}${mm}-${rand}`;
}

window.handleFotoUpload = function(input) {
  _fotoFiles = Array.from(input.files).slice(0,5);
  const wrap  = document.getElementById("foto-preview");
  const count = document.getElementById("foto-count");
  if (!wrap) return;
  wrap.innerHTML = "";
  _fotoFiles.forEach((f,i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement("div");
      div.className = "foto-thumb";
      div.innerHTML = `<img src="${e.target.result}"><button class="foto-remove" onclick="removeFoto(${i})">✕</button>`;
      wrap.appendChild(div);
    };
    reader.readAsDataURL(f);
  });
  if (count) count.textContent = _fotoFiles.length ? `${_fotoFiles.length} foto dipilih (maks 5)` : "";
};

window.removeFoto = function(idx) {
  _fotoFiles.splice(idx,1);
  const dt = new DataTransfer();
  _fotoFiles.forEach(f => dt.items.add(f));
  const input = document.getElementById("f-foto");
  if (input) { input.files = dt.files; window.handleFotoUpload(input); }
};

window.saveLogbook = async function() {
  const kapal   = document.getElementById("f-kapal")?.value;
  const nakhoda = document.getElementById("f-nakhoda")?.value;
  const tanggal = document.getElementById("f-tanggal")?.value;
  const jenis   = document.getElementById("f-jenis")?.value;
  const wilayah = document.getElementById("f-wilayah")?.value;

  if (!kapal || !nakhoda || !tanggal || !jenis || !wilayah) {
    showToast("⚠️ Lengkapi field yang wajib diisi (*)", "warn"); return;
  }

  const btn = document.querySelector(".btn-gold");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Menyimpan…"; }

  try {
    const data = {
      kapal, nakhoda, tanggal,
      abk          : document.getElementById("f-abk")?.value,
      jamBerangkat : document.getElementById("f-jam-berangkat")?.value,
      jamKembali   : document.getElementById("f-jam-kembali")?.value,
      jenisAktivitas: jenis,
      wilayah,
      deskripsi    : document.getElementById("f-deskripsi")?.value,
      cuaca        : document.getElementById("f-cuaca")?.value,
      gelombang    : document.getElementById("f-gelombang")?.value,
      angin        : document.getElementById("f-angin")?.value,
      kecepatan    : document.getElementById("f-kecepatan")?.value,
      jarak        : document.getElementById("f-jarak")?.value,
      temuan       : document.getElementById("f-temuan")?.value,
      tindakan     : document.getElementById("f-tindakan")?.value,
      noKapalDiperiksa: document.getElementById("f-no-kapal")?.value,
      uraian       : document.getElementById("f-uraian")?.value,
      catatan      : document.getElementById("f-catatan")?.value,
      mesin        : document.getElementById("f-mesin")?.value,
      navigasi     : document.getElementById("f-navigasi")?.value,
      komunikasi   : document.getElementById("f-komunikasi")?.value,
      statusKapal  : document.getElementById("f-status-kapal")?.value,
    };
    await fbSaveLogbook(data, _fotoFiles);
    showToast("✓ Logbook berhasil disimpan!");
    resetForm();
    generateNoRefDisplay();
  } catch(err) {
    console.error("[saveLogbook]", err);
    showToast("✗ Gagal menyimpan: " + err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "💾 Simpan Logbook"; }
  }
};

window.resetForm = function() {
  ["f-kapal","f-nakhoda","f-abk","f-tanggal","f-jam-berangkat","f-jam-kembali",
   "f-jenis","f-wilayah","f-deskripsi","f-gelombang","f-angin",
   "f-kecepatan","f-jarak","f-temuan","f-tindakan","f-no-kapal",
   "f-uraian","f-catatan"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.tagName === "SELECT" ? (el.selectedIndex = 0) : (el.value = "");
  });
  _fotoFiles = [];
  const wrap  = document.getElementById("foto-preview");
  const count = document.getElementById("foto-count");
  const input = document.getElementById("f-foto");
  if (wrap)  wrap.innerHTML = "";
  if (count) count.textContent = "";
  if (input) input.value = "";
};

// ══════════════════════════════════════════════
//  ████  DATA KAPAL  ████
// ══════════════════════════════════════════════
const STATUS_LABEL = {
  patrol     :{ label:"Patroli",    cls:"badge-green" },
  standby    :{ label:"Standby",    cls:"badge-blue"  },
  maintenance:{ label:"Maintenance",cls:"badge-red"   },
  docking    :{ label:"Docking",    cls:"badge-gold"  }
};

window.renderKapal = async function() {
  const grid = document.getElementById("ship-grid-container");
  if (!grid) return;
  grid.innerHTML = `<div class="loading-text">Memuat data kapal…</div>`;
  try {
    const list = await getAllKapal();
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">Belum ada kapal. Klik <b>+ Tambah Kapal</b>.</div>`;
      return;
    }
    grid.innerHTML = list.map(k => {
      const st = STATUS_LABEL[k.status] || { label: k.status||"—", cls:"badge-blue" };
      return `
      <div class="ship-card">
        <div class="ship-card-header">
          <div class="ship-card-name">${k.nama||"—"}</div>
          <span class="badge ${st.cls}">${st.label}</span>
        </div>
        <div class="ship-card-body">
          <div class="ship-info-row"><span>Call Sign</span><b>${k.callSign||"—"}</b></div>
          <div class="ship-info-row"><span>Kelas</span><b>${k.kelas||"—"}</b></div>
          <div class="ship-info-row"><span>GT</span><b>${k.gt||"—"}</b></div>
          <div class="ship-info-row"><span>Panjang</span><b>${k.panjang||"—"}</b></div>
          <div class="ship-info-row"><span>Tahun</span><b>${k.tahunBuat||"—"}</b></div>
          <div class="ship-info-row"><span>Crew</span><b>${k.jumlahCrew||"—"} orang</b></div>
          <div class="ship-info-row"><span>IMO</span><b>${k.imo||"—"}</b></div>
          <div class="ship-info-row"><span>Main Engine</span><b>${k.meMerk||"—"}</b></div>
        </div>
        <div class="ship-card-footer">
          <button class="btn btn-outline btn-sm" onclick="openModalKapalEdit('${k.id}')">✏️ Edit</button>
          <button class="btn btn-outline btn-sm btn-danger" onclick="hapusKapal('${k.id}','${(k.nama||'').replace(/'/g,"\\'")}')">🗑️ Hapus</button>
        </div>
      </div>`;
    }).join("");
  } catch(err) {
    grid.innerHTML = `<div class="empty-state error">Gagal: ${err.message}</div>`;
  }
};

let _editKapalId = null;
let _kapalCache  = [];

window.openModalKapal = function() {
  _editKapalId = null;
  document.getElementById("modal-kapal-title").textContent = "Tambah Kapal Baru";
  ["mk-nama","mk-callsign","mk-ukuran","mk-konstruksi","mk-gt","mk-tahun",
   "mk-bbm","mk-air","mk-crew","mk-tanki","mk-me-merk","mk-me-daya",
   "mk-me-hpbbm","mk-me-kecepatan","mk-ae-merk","mk-ae-daya",
   "mk-ae-hpbbm","mk-ae-kecepatan","mk-imo"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  document.getElementById("mk-kelas").selectedIndex  = 0;
  document.getElementById("mk-status").selectedIndex = 0;
  document.getElementById("modal-kapal").classList.add("open");
};

window.openModalKapalEdit = async function(docId) {
  _editKapalId = docId;
  if (!_kapalCache.length) _kapalCache = await getAllKapal();
  const k = _kapalCache.find(x => x.id === docId);
  if (!k) return;
  document.getElementById("modal-kapal-title").textContent = "Edit Data Kapal";
  const sv = (id,val) => { const el=document.getElementById(id); if(el) el.value=val||""; };
  sv("mk-nama",k.nama); sv("mk-callsign",k.callSign); sv("mk-ukuran",k.panjang);
  sv("mk-konstruksi",k.konstruksi); sv("mk-gt",k.gt); sv("mk-tahun",k.tahunBuat);
  sv("mk-bbm",k.kapasitasBBM); sv("mk-air",k.airTawar); sv("mk-crew",k.jumlahCrew);
  sv("mk-tanki",k.tankiHarian); sv("mk-me-merk",k.meMerk); sv("mk-me-daya",k.meDaya);
  sv("mk-me-hpbbm",k.meHpBBM); sv("mk-me-kecepatan",k.meKecepatan);
  sv("mk-ae-merk",k.aeMerk); sv("mk-ae-daya",k.aeDaya);
  sv("mk-ae-hpbbm",k.aeHpBBM); sv("mk-ae-kecepatan",k.aeKecepatan);
  sv("mk-imo",k.imo); sv("mk-kelas",k.kelas); sv("mk-status",k.status);
  document.getElementById("modal-kapal").classList.add("open");
};

window.closeModalKapal = function() {
  document.getElementById("modal-kapal").classList.remove("open");
  _editKapalId = null;
};

window.saveKapal = async function() {
  const nama = document.getElementById("mk-nama")?.value?.trim();
  if (!nama) { showToast("⚠️ Nama kapal wajib diisi","warn"); return; }
  const data = {
    nama,
    callSign   : document.getElementById("mk-callsign")?.value,
    kelas      : document.getElementById("mk-kelas")?.value,
    panjang    : document.getElementById("mk-ukuran")?.value,
    konstruksi : document.getElementById("mk-konstruksi")?.value,
    gt         : document.getElementById("mk-gt")?.value,
    tahunBuat  : document.getElementById("mk-tahun")?.value,
    kapasitasBBM: document.getElementById("mk-bbm")?.value,
    airTawar   : document.getElementById("mk-air")?.value,
    jumlahCrew : document.getElementById("mk-crew")?.value,
    tankiHarian: document.getElementById("mk-tanki")?.value,
    meMerk     : document.getElementById("mk-me-merk")?.value,
    meDaya     : document.getElementById("mk-me-daya")?.value,
    meHpBBM    : document.getElementById("mk-me-hpbbm")?.value,
    meKecepatan: document.getElementById("mk-me-kecepatan")?.value,
    aeMerk     : document.getElementById("mk-ae-merk")?.value,
    aeDaya     : document.getElementById("mk-ae-daya")?.value,
    aeHpBBM    : document.getElementById("mk-ae-hpbbm")?.value,
    aeKecepatan: document.getElementById("mk-ae-kecepatan")?.value,
    imo        : document.getElementById("mk-imo")?.value,
    status     : document.getElementById("mk-status")?.value,
  };
  try {
    await fbSaveKapal(data);
    showToast("✓ Data kapal disimpan!");
    _kapalCache = [];
    closeModalKapal();
    renderKapal();
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

window.hapusKapal = async function(docId, nama) {
  if (!confirm(`Hapus kapal "${nama}"?`)) return;
  try {
    await fbDeleteKapal(nama);
    showToast("✓ Kapal dihapus");
    _kapalCache = [];
    renderKapal();
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

// ══════════════════════════════════════════════
//  ████  AWAK KAPAL  ████
// ══════════════════════════════════════════════
window.renderAwak = async function() {
  const tbody = document.getElementById("tbl-awak");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">⏳ Memuat…</td></tr>`;
  try {
    const list = await getAllAwak();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">Belum ada data personel.</td></tr>`;
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    tbody.innerHTML = list.map(a => {
      const expired = a.masaBerlaku && a.masaBerlaku < now;
      return `
      <tr>
        <td class="mono">${a.nip||"—"}</td>
        <td><b>${a.nama||"—"}</b></td>
        <td>${a.jabatan||"—"}</td>
        <td>${a.sertifikat||"—"}</td>
        <td>${a.kapal||"—"}</td>
        <td class="${expired?"text-red":""}">${a.masaBerlaku||"—"}${expired?" ⚠️":""}</td>
        <td>
          <span class="badge ${a.status==="Aktif"?"badge-green":"badge-red"}">${a.status||"Aktif"}</span>
          <button class="btn btn-outline btn-xs" onclick="hapusAwak('${a.id}','${(a.nama||'').replace(/'/g,"\\'")}')">🗑️</button>
        </td>
      </tr>`;
    }).join("");
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red">Gagal: ${err.message}</td></tr>`;
  }
};

window.saveAwak = async function() {
  const nama = document.getElementById("m-nama")?.value?.trim();
  if (!nama) { showToast("⚠️ Nama wajib diisi","warn"); return; }
  const data = {
    nama,
    nip        : document.getElementById("m-nip")?.value,
    jabatan    : document.getElementById("m-jabatan")?.value,
    kapal      : document.getElementById("m-kapal")?.value,
    sertifikat : document.getElementById("m-sertifikat")?.value,
    masaBerlaku: document.getElementById("m-berlaku")?.value,
  };
  try {
    await fbSaveAwak(data);
    showToast("✓ Personel disimpan!");
    document.getElementById("modal-awak").classList.remove("open");
    ["m-nama","m-nip","m-sertifikat","m-berlaku"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value="";
    });
    renderAwak();
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

window.hapusAwak = async function(docId, nama) {
  if (!confirm(`Hapus personel "${nama}"?`)) return;
  try {
    await fbDeleteAwak(docId);
    showToast("✓ Personel dihapus");
    renderAwak();
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

// ══════════════════════════════════════════════
//  ████  LAPORAN  ████
// ══════════════════════════════════════════════
window.renderRekapBulanan = async function() {
  const wrap = document.getElementById("rekap-bulanan");
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-text">Memuat rekap…</div>`;
  try {
    const stats   = await getStatsDashboard();
    const entries = Object.entries(stats.rekapJenis);
    if (!entries.length) { wrap.innerHTML=`<div class="empty-state">Belum ada aktivitas bulan ini.</div>`; return; }
    const total = entries.reduce((s,e)=>s+e[1],0);
    wrap.innerHTML = entries.map(([jenis,jumlah]) => {
      const pct = Math.round((jumlah/total)*100);
      return `
      <div class="rekap-row">
        <div class="rekap-label">${jenis}</div>
        <div class="rekap-bar-wrap"><div class="rekap-bar" style="width:${pct}%"></div></div>
        <div class="rekap-val">${jumlah}x <span class="rekap-pct">(${pct}%)</span></div>
      </div>`;
    }).join("");
  } catch(err) { wrap.innerHTML=`<div class="empty-state error">${err.message}</div>`; }
};

window.generateReport = async function() {
  const jenis   = document.getElementById("lap-jenis")?.value;
  const periode = document.getElementById("lap-periode")?.value;
  const kapal   = document.getElementById("lap-kapal")?.value;
  const format  = document.getElementById("lap-format")?.value;
  showToast(`⏳ Membuat ${jenis}…`);
  try {
    let list = await getAllLogbook();
    if (kapal) list = list.filter(l => l.kapal === kapal);
    if (periode) {
      const [y,m] = periode.split("-");
      list = list.filter(l => l.tanggal >= `${y}-${m}-01` && l.tanggal <= `${y}-${m}-31`);
    }
    if (format === "Excel (CSV)") exportToCSV(list, `laporan-${periode||"semua"}.csv`);
    else printReport(list, jenis, periode, kapal);
  } catch(err) { showToast("✗ " + err.message, "error"); }
};

function exportToCSV(data, filename) {
  const headers = ["No.Ref","Tanggal","Kapal","Nakhoda","Jenis","Wilayah","Temuan","Status Kapal"];
  const rows    = data.map(l =>
    [l.noRef,l.tanggal,l.kapal,l.nakhoda,l.jenisAktivitas,l.wilayah,l.temuan||"-",l.statusKapal]
    .map(v=>`"${(v||"").replace(/"/g,'""')}"`).join(",")
  );
  const csv  = [headers.join(","),...rows].join("\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
  showToast("✓ CSV berhasil diunduh");
}

function printReport(data, jenis, periode, kapal) {
  const rows = data.map((l,i)=>`
    <tr><td>${i+1}</td><td>${l.noRef||"—"}</td><td>${l.tanggal||"—"}</td>
    <td>${l.kapal||"—"}</td><td>${l.nakhoda||"—"}</td>
    <td>${l.jenisAktivitas||"—"}</td><td>${l.wilayah||"—"}</td>
    <td>${l.temuan||"—"}</td></tr>`).join("");
  const win = window.open("","_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${jenis}</title>
    <style>body{font-family:Arial;font-size:12px;padding:20px}h2{text-align:center}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px}
    th{background:#1a3a5c;color:#fff}@media print{button{display:none}}</style></head><body>
    <h2>KSOP UTAMA MAKASSAR · KANTOR KESYAHBANDARAN</h2>
    <h3 style="text-align:center">${jenis} — Periode: ${periode||"Semua"} | Kapal: ${kapal||"Semua"}</h3>
    <table><thead><tr><th>No</th><th>No.Ref</th><th>Tanggal</th><th>Kapal</th>
    <th>Nakhoda</th><th>Aktivitas</th><th>Wilayah</th><th>Temuan</th></tr></thead>
    <tbody>${rows}</tbody></table><br>
    <button onclick="window.print()">🖨️ Cetak</button></body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════
//  EXPORT MENU
// ══════════════════════════════════════════════
window.toggleExportMenu = function(e) {
  e.stopPropagation();
  document.getElementById("export-menu").classList.toggle("open");
};
document.addEventListener("click", () => {
  document.getElementById("export-menu")?.classList.remove("open");
});
window.exportCSV = async function() {
  exportToCSV(await getAllLogbook(), "logbook-export.csv");
};
window.exportPDF = async function() {
  printReport(await getAllLogbook(), "Laporan Lengkap","","");
};

// ══════════════════════════════════════════════
//  SEED (untuk setup awal — panggil dari console)
// ══════════════════════════════════════════════
window.seedKapalAwal = seedKapalAwal;

// ══════════════════════════════════════════════
//  INIT — jalankan saat DOM siap
// ══════════════════════════════════════════════
generateNoRefDisplay();

// Set tanggal hari ini di form
const tglInput = document.getElementById("f-tanggal");
if (tglInput) tglInput.value = new Date().toISOString().split("T")[0];

// Load dashboard awal
refreshDashboard();

console.log("[E-logbook] ✅ Semua modul siap, Firebase terhubung.");
