// ══════════════════════════════════════════════════════════
//  app.js  —  E-logbook Kapal Patroli · Logika Utama
//  Mengelola: form input logbook, data kapal, awak, laporan
// ══════════════════════════════════════════════════════════

/* ──────────────────────────────────────────────
   NAVIGASI
────────────────────────────────────────────── */
function showPage(name, tabEl) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");
  if (tabEl) tabEl.classList.add("active");

  // Muat data saat halaman dibuka
  if (name === "dashboard") refreshDashboard();
  if (name === "logbook")   loadLogbook();
  if (name === "kapal")     renderKapal();
  if (name === "awak")      renderAwak();
  if (name === "laporan")   renderRekapBulanan();
}

/* ──────────────────────────────────────────────
   JAM & TANGGAL LIVE
────────────────────────────────────────────── */
function updateClock() {
  const now  = new Date();
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const mons = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"];

  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");

  const el = document.getElementById("clock");
  const de = document.getElementById("dateDisplay");
  if (el) el.textContent = `${hh}:${mm}:${ss}`;
  if (de) de.textContent = `${days[now.getDay()]} , ${now.getDate()} ${mons[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ──────────────────────────────────────────────
   TOAST NOTIFIKASI
────────────────────────────────────────────── */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  if (!toast) return;
  msgEl.textContent = msg;
  toast.className   = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ──────────────────────────────────────────────
   FORM INPUT — NO. REF AUTO
────────────────────────────────────────────── */
function generateNoRefDisplay() {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth()+1).padStart(2,"0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ref  = `LBK-${yy}${mm}-${rand}`;
  const el   = document.getElementById("form-noref");
  if (el) el.textContent = `No. Ref: ${ref}`;
}

/* ──────────────────────────────────────────────
   FOTO — PREVIEW & UPLOAD HANDLER
────────────────────────────────────────────── */
let _fotoFiles = [];

function handleFotoUpload(input) {
  _fotoFiles = Array.from(input.files).slice(0, 5);
  const wrap  = document.getElementById("foto-preview");
  const count = document.getElementById("foto-count");
  if (!wrap) return;

  wrap.innerHTML = "";
  _fotoFiles.forEach((f, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement("div");
      div.className = "foto-thumb";
      div.innerHTML = `
        <img src="${e.target.result}" alt="foto-${i+1}">
        <button class="foto-remove" onclick="removeFoto(${i})">✕</button>`;
      wrap.appendChild(div);
    };
    reader.readAsDataURL(f);
  });

  if (count) count.textContent =
    _fotoFiles.length > 0
      ? `${_fotoFiles.length} foto dipilih (maks 5)`
      : "";
}

function removeFoto(idx) {
  _fotoFiles.splice(idx, 1);
  const dt = new DataTransfer();
  _fotoFiles.forEach(f => dt.items.add(f));
  const input = document.getElementById("f-foto");
  if (input) input.files = dt.files;
  handleFotoUpload(input);
}

/* ──────────────────────────────────────────────
   SIMPAN LOGBOOK
────────────────────────────────────────────── */
async function saveLogbook() {
  // Validasi wajib
  const kapal = document.getElementById("f-kapal")?.value;
  const nakhoda = document.getElementById("f-nakhoda")?.value;
  const tanggal = document.getElementById("f-tanggal")?.value;
  const jenis   = document.getElementById("f-jenis")?.value;
  const wilayah = document.getElementById("f-wilayah")?.value;

  if (!kapal || !nakhoda || !tanggal || !jenis || !wilayah) {
    showToast("⚠️ Lengkapi field yang wajib diisi (*)", "warn");
    return;
  }

  const btn = document.querySelector(".btn-gold");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Menyimpan..."; }

  try {
    const data = {
      kapal,
      nakhoda,
      abk          : document.getElementById("f-abk")?.value,
      tanggal,
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

    await window._fb.saveLogbook(data, _fotoFiles);
    showToast("✓ Logbook berhasil disimpan!");
    resetForm();
    generateNoRefDisplay();

  } catch (err) {
    console.error("[saveLogbook]", err);
    showToast("✗ Gagal menyimpan: " + err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "💾 Simpan Logbook"; }
  }
}

/* ──────────────────────────────────────────────
   RESET FORM
────────────────────────────────────────────── */
function resetForm() {
  const ids = [
    "f-kapal","f-nakhoda","f-abk","f-tanggal","f-jam-berangkat","f-jam-kembali",
    "f-jenis","f-wilayah","f-deskripsi","f-cuaca","f-gelombang","f-angin",
    "f-kecepatan","f-jarak","f-temuan","f-tindakan","f-no-kapal",
    "f-uraian","f-catatan","f-mesin","f-navigasi","f-komunikasi","f-status-kapal"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.tagName === "SELECT" ? (el.selectedIndex = 0) : (el.value = "");
  });
  _fotoFiles = [];
  const wrap  = document.getElementById("foto-preview");
  const count = document.getElementById("foto-count");
  const input = document.getElementById("f-foto");
  if (wrap)  wrap.innerHTML  = "";
  if (count) count.textContent = "";
  if (input) input.value = "";
}

/* ──────────────────────────────────────────────
   DATA KAPAL — RENDER GRID
────────────────────────────────────────────── */
const STATUS_LABEL = {
  patrol      : { label: "Patroli",     cls: "badge-green" },
  standby     : { label: "Standby",     cls: "badge-blue"  },
  maintenance : { label: "Maintenance", cls: "badge-red"   },
  docking     : { label: "Docking",     cls: "badge-gold"  }
};

async function renderKapal() {
  const grid = document.getElementById("ship-grid-container");
  if (!grid) return;
  grid.innerHTML = `<div class="loading-text">Memuat data kapal…</div>`;

  try {
    const kapalList = await window._fb.getAllKapal();
    if (!kapalList.length) {
      grid.innerHTML = `<div class="empty-state">Belum ada data kapal.<br>Klik <b>+ Tambah Kapal</b> untuk menambahkan.</div>`;
      return;
    }

    grid.innerHTML = kapalList.map(k => {
      const st = STATUS_LABEL[k.status] || { label: k.status, cls: "badge-blue" };
      return `
      <div class="ship-card" data-id="${k.id}">
        <div class="ship-card-header">
          <div class="ship-card-name">${k.nama || "—"}</div>
          <span class="badge ${st.cls}">${st.label}</span>
        </div>
        <div class="ship-card-body">
          <div class="ship-info-row"><span>Call Sign</span><b>${k.callSign || "—"}</b></div>
          <div class="ship-info-row"><span>Kelas</span><b>${k.kelas || "—"}</b></div>
          <div class="ship-info-row"><span>GT</span><b>${k.gt || "—"}</b></div>
          <div class="ship-info-row"><span>Panjang</span><b>${k.panjang || "—"}</b></div>
          <div class="ship-info-row"><span>Tahun</span><b>${k.tahunBuat || "—"}</b></div>
          <div class="ship-info-row"><span>Crew</span><b>${k.jumlahCrew || "—"} orang</b></div>
          <div class="ship-info-row"><span>IMO</span><b>${k.imo || "—"}</b></div>
          <div class="ship-info-row"><span>Main Engine</span><b>${k.meMerk || "—"}</b></div>
          <div class="ship-info-row"><span>Daya ME</span><b>${k.meDaya || "—"}</b></div>
        </div>
        <div class="ship-card-footer">
          <button class="btn btn-outline btn-sm" onclick="openModalKapalEdit('${k.id}')">✏️ Edit</button>
          <button class="btn btn-outline btn-sm btn-danger" onclick="hapusKapal('${k.id}','${k.nama}')">🗑️ Hapus</button>
        </div>
      </div>`;
    }).join("");
  } catch (err) {
    grid.innerHTML = `<div class="empty-state error">Gagal memuat: ${err.message}</div>`;
  }
}

/* ──────────────────────────────────────────────
   MODAL KAPAL — BUKA / TUTUP
────────────────────────────────────────────── */
let _editKapalId = null;

function openModalKapal() {
  _editKapalId = null;
  document.getElementById("modal-kapal-title").textContent = "Tambah Kapal Baru";
  // kosongkan field
  ["mk-nama","mk-callsign","mk-ukuran","mk-konstruksi","mk-gt","mk-tahun",
   "mk-bbm","mk-air","mk-crew","mk-tanki","mk-me-merk","mk-me-daya",
   "mk-me-hpbbm","mk-me-kecepatan","mk-ae-merk","mk-ae-daya",
   "mk-ae-hpbbm","mk-ae-kecepatan","mk-imo"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("mk-kelas").selectedIndex  = 0;
  document.getElementById("mk-status").selectedIndex = 0;
  document.getElementById("modal-kapal").classList.add("open");
}

async function openModalKapalEdit(docId) {
  _editKapalId = docId;
  const list = await window._fb.getAllKapal();
  const k    = list.find(x => x.id === docId);
  if (!k) return;

  document.getElementById("modal-kapal-title").textContent = "Edit Data Kapal";
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  setVal("mk-nama",         k.nama);
  setVal("mk-callsign",     k.callSign);
  setVal("mk-ukuran",       k.panjang);
  setVal("mk-konstruksi",   k.konstruksi);
  setVal("mk-gt",           k.gt);
  setVal("mk-tahun",        k.tahunBuat);
  setVal("mk-bbm",          k.kapasitasBBM);
  setVal("mk-air",          k.airTawar);
  setVal("mk-crew",         k.jumlahCrew);
  setVal("mk-tanki",        k.tankiHarian);
  setVal("mk-me-merk",      k.meMerk);
  setVal("mk-me-daya",      k.meDaya);
  setVal("mk-me-hpbbm",     k.meHpBBM);
  setVal("mk-me-kecepatan", k.meKecepatan);
  setVal("mk-ae-merk",      k.aeMerk);
  setVal("mk-ae-daya",      k.aeDaya);
  setVal("mk-ae-hpbbm",     k.aeHpBBM);
  setVal("mk-ae-kecepatan", k.aeKecepatan);
  setVal("mk-imo",          k.imo);
  setVal("mk-kelas",        k.kelas);
  setVal("mk-status",       k.status);
  document.getElementById("modal-kapal").classList.add("open");
}

function closeModalKapal() {
  document.getElementById("modal-kapal").classList.remove("open");
  _editKapalId = null;
}

async function saveKapal() {
  const nama = document.getElementById("mk-nama")?.value?.trim();
  if (!nama) { showToast("⚠️ Nama kapal wajib diisi", "warn"); return; }

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
    await window._fb.saveKapal(data);
    showToast("✓ Data kapal disimpan!");
    closeModalKapal();
    renderKapal();
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

async function hapusKapal(docId, nama) {
  if (!confirm(`Hapus kapal "${nama}"?`)) return;
  try {
    await window._fb.deleteKapal(nama);
    showToast("✓ Kapal dihapus");
    renderKapal();
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

/* ──────────────────────────────────────────────
   DATA AWAK — RENDER TABEL
────────────────────────────────────────────── */
async function renderAwak() {
  const tbody = document.getElementById("tbl-awak");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">Memuat…</td></tr>`;

  try {
    const awakList = await window._fb.getAllAwak();
    if (!awakList.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">Belum ada data personel.</td></tr>`;
      return;
    }

    const now = new Date().toISOString().split("T")[0];
    tbody.innerHTML = awakList.map(a => {
      const expired = a.masaBerlaku && a.masaBerlaku < now;
      return `
      <tr>
        <td class="mono">${a.nip || "—"}</td>
        <td><b>${a.nama || "—"}</b></td>
        <td>${a.jabatan || "—"}</td>
        <td>${a.sertifikat || "—"}</td>
        <td>${a.kapal || "—"}</td>
        <td class="${expired ? "text-red" : ""}">${a.masaBerlaku || "—"}${expired ? " ⚠️" : ""}</td>
        <td>
          <span class="badge ${a.status === "Aktif" ? "badge-green" : "badge-red"}">${a.status || "Aktif"}</span>
          <button class="btn btn-outline btn-xs" onclick="hapusAwak('${a.id}','${a.nama}')">🗑️</button>
        </td>
      </tr>`;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red">Gagal: ${err.message}</td></tr>`;
  }
}

async function saveAwak() {
  const nama = document.getElementById("m-nama")?.value?.trim();
  if (!nama) { showToast("⚠️ Nama wajib diisi", "warn"); return; }

  const data = {
    nama,
    nip         : document.getElementById("m-nip")?.value,
    jabatan     : document.getElementById("m-jabatan")?.value,
    kapal       : document.getElementById("m-kapal")?.value,
    sertifikat  : document.getElementById("m-sertifikat")?.value,
    masaBerlaku : document.getElementById("m-berlaku")?.value,
  };

  try {
    await window._fb.saveAwak(data);
    showToast("✓ Personel disimpan!");
    document.getElementById("modal-awak").classList.remove("open");
    // reset modal awak
    ["m-nama","m-nip","m-sertifikat","m-berlaku"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    renderAwak();
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

async function hapusAwak(docId, nama) {
  if (!confirm(`Hapus personel "${nama}"?`)) return;
  try {
    await window._fb.deleteAwak(docId);
    showToast("✓ Personel dihapus");
    renderAwak();
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

/* ──────────────────────────────────────────────
   LAPORAN — REKAP BULANAN
────────────────────────────────────────────── */
async function renderRekapBulanan() {
  const wrap = document.getElementById("rekap-bulanan");
  if (!wrap) return;
  wrap.innerHTML = `<div class="loading-text">Memuat rekap…</div>`;

  try {
    const stats = await window._fb.getStatsDashboard();
    const rekap = stats.rekapJenis;

    if (!Object.keys(rekap).length) {
      wrap.innerHTML = `<div class="empty-state">Belum ada aktivitas bulan ini.</div>`;
      return;
    }

    const total = Object.values(rekap).reduce((a,b) => a+b, 0);
    wrap.innerHTML = Object.entries(rekap).map(([jenis, jumlah]) => {
      const pct = Math.round((jumlah / total) * 100);
      return `
      <div class="rekap-row">
        <div class="rekap-label">${jenis}</div>
        <div class="rekap-bar-wrap">
          <div class="rekap-bar" style="width:${pct}%"></div>
        </div>
        <div class="rekap-val">${jumlah}x <span class="rekap-pct">(${pct}%)</span></div>
      </div>`;
    }).join("");
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state error">${err.message}</div>`;
  }
}

async function generateReport() {
  const jenis   = document.getElementById("lap-jenis")?.value;
  const periode = document.getElementById("lap-periode")?.value;
  const kapal   = document.getElementById("lap-kapal")?.value;
  const format  = document.getElementById("lap-format")?.value;

  showToast(`⏳ Membuat ${jenis}…`);

  try {
    const list = await window._fb.getAllLogbook();
    let filtered = list;

    if (kapal) filtered = filtered.filter(l => l.kapal === kapal);
    if (periode) {
      const [y, m] = periode.split("-");
      const start  = `${y}-${m}-01`;
      const end    = `${y}-${m}-31`;
      filtered = filtered.filter(l => l.tanggal >= start && l.tanggal <= end);
    }

    if (format === "Excel (CSV)") {
      exportToCSV(filtered, `laporan-${periode || "semua"}.csv`);
    } else {
      printReport(filtered, jenis, periode, kapal);
    }
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

function exportToCSV(data, filename) {
  const headers = ["No.Ref","Tanggal","Kapal","Nakhoda","Jenis","Wilayah","Temuan","Status Kapal"];
  const rows    = data.map(l => [
    l.noRef, l.tanggal, l.kapal, l.nakhoda,
    l.jenisAktivitas, l.wilayah, l.temuan || "-", l.statusKapal
  ].map(v => `"${(v||"").replace(/"/g,'""')}"`).join(","));

  const csv  = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✓ File CSV berhasil diunduh");
}

function printReport(data, jenis, periode, kapal) {
  // Helper: buat thumbnail foto dari array base64
  function fotoCell(fotoArr) {
    if (!fotoArr || !fotoArr.length) {
      return `<span style="color:#aaa;font-size:11px;">—</span>`;
    }
    // Tampilkan maks 3 thumbnail dalam sel tabel
    const thumbs = fotoArr.slice(0, 3).map(b64 => {
      const src = b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
      return `<img src="${src}" alt="foto"
                   style="width:64px;height:48px;object-fit:cover;
                          border-radius:4px;border:1px solid #ccc;
                          display:inline-block;margin:2px;">`;
    }).join("");
    const sisa = fotoArr.length > 3
      ? `<div style="font-size:10px;color:#555;margin-top:2px;text-align:center;">+${fotoArr.length - 3} lagi</div>`
      : "";
    return `<div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center;">${thumbs}</div>${sisa}`;
  }

  // Helper: badge temuan
  function badgeTemuan(temuan) {
    if (!temuan || temuan.trim() === "") {
      return `<span style="background:#d4edda;color:#155724;padding:2px 7px;
                           border-radius:10px;font-size:10px;font-weight:600;">Normal</span>`;
    }
    return `<span style="background:#f8d7da;color:#721c24;padding:2px 7px;
                         border-radius:10px;font-size:10px;font-weight:600;">Ada Temuan</span>`;
  }

  const rows = data.map((l, i) => `
    <tr style="${i % 2 === 0 ? "" : "background:#f8f9fa;"}">
      <td style="text-align:center;width:30px;">${i + 1}</td>
      <td style="font-family:monospace;font-size:11px;white-space:nowrap;">${l.noRef || "—"}</td>
      <td style="white-space:nowrap;">${l.tanggal || "—"}</td>
      <td><b>${l.kapal || "—"}</b></td>
      <td>${l.nakhoda || "—"}</td>
      <td>${l.jenisAktivitas || "—"}</td>
      <td>${l.wilayah || "—"}</td>
      <td>${badgeTemuan(l.temuan)}</td>
      <td style="min-width:220px;">${fotoCell(l.foto)}</td>
    </tr>`).join("");

  const today = new Date().toLocaleDateString("id-ID", {day:"numeric",month:"long",year:"numeric"});

  const win = window.open("", "_blank");
  if (!win) { alert("Popup diblokir browser. Izinkan popup lalu coba lagi."); return; }
  win.document.write(`
    <!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <title>${jenis} — KSOP Makassar</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #222; background: #fff; }

      /* ── Toolbar cetak ── */
      .toolbar {
        position: sticky; top: 0; z-index: 100;
        background: #1a3a5c; color: #fff;
        padding: 10px 24px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .toolbar span { font-size: 13px; opacity: .85; }
      .btn-print {
        background: #fff; color: #1a3a5c; border: none;
        padding: 7px 20px; border-radius: 6px;
        font-size: 13px; font-weight: 700; cursor: pointer;
      }

      /* ── Kop surat ── */
      .kop {
        display: flex; align-items: center; gap: 16px;
        padding: 18px 24px 14px;
        border-bottom: 3px solid #1a3a5c;
      }
      .kop-ico {
        width: 60px; height: 60px; background: #1a3a5c; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 24px; flex-shrink: 0;
      }
      .kop-txt { flex: 1; }
      .kop-inst { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
      .kop-title { font-size: 17px; font-weight: 700; color: #1a3a5c; line-height: 1.2; }
      .kop-sub { font-size: 11px; color: #777; margin-top: 2px; }
      .kop-right { text-align: right; font-size: 11px; color: #666; flex-shrink: 0; }
      .kop-right b { color: #1a3a5c; font-size: 12px; }

      /* ── Sub-header laporan ── */
      .lap-meta {
        background: #f0f4f8; border-bottom: 1px solid #dce3ea;
        padding: 10px 24px;
        display: flex; gap: 24px; align-items: center;
        font-size: 12px;
      }
      .lap-meta-item { display: flex; flex-direction: column; }
      .lap-meta-item span { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: .4px; }
      .lap-meta-item b { color: #1a3a5c; font-size: 13px; }

      /* ── Tabel ── */
      .wrap { padding: 18px 24px; }
      .tbl-title {
        font-size: 11px; font-weight: 700; color: #1a3a5c;
        text-transform: uppercase; letter-spacing: .6px;
        border-bottom: 2px solid #1a3a5c; padding-bottom: 6px;
        margin-bottom: 14px;
      }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d0dae4; padding: 7px 9px; vertical-align: top; text-align: left; }
      th { background: #1a3a5c; color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }
      tr:hover { background: #f0f7ff; }

      /* ── Footer ── */
      .footer {
        margin-top: 24px; padding: 14px 24px;
        border-top: 1px solid #dce3ea;
        display: flex; justify-content: space-between; align-items: flex-end;
        font-size: 11px; color: #666;
      }
      .ttd { text-align: center; min-width: 180px; }
      .ttd-line { margin-top: 50px; border-top: 1px solid #333; padding-top: 4px; font-weight: 700; color: #1a3a5c; }

      @media print {
        .toolbar { display: none !important; }
        img { max-width: 100% !important; }
        tr { page-break-inside: avoid; }
      }
    </style>
    </head><body>

    <!-- Toolbar -->
    <div class="toolbar">
      <span>📄 Pratinjau — ${jenis}</span>
      <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
    </div>

    <!-- Kop surat -->
    <div class="kop">
      <div class="kop-ico">⚓</div>
      <div class="kop-txt">
        <div class="kop-inst">Kementerian Perhubungan — Direktorat Jenderal Perhubungan Laut</div>
        <div class="kop-title">KSOP UTAMA MAKASSAR</div>
        <div class="kop-sub">Kantor Kesyahbandaran dan Otoritas Pelabuhan Utama Makassar</div>
        <div class="kop-sub" style="color:#bbb;margin-top:1px;">Jl. Hatta No. 4 Makassar · Telp. (0411) 317001</div>
      </div>
      <div class="kop-right">
        <div class="kop-inst">Dicetak pada</div>
        <b>${today}</b><br>
        <div class="kop-inst" style="margin-top:6px;">No. Dokumen</div>
        <b>RPT-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,"0")}</b>
      </div>
    </div>

    <!-- Meta laporan -->
    <div class="lap-meta">
      <div class="lap-meta-item"><span>Jenis Laporan</span><b>${jenis}</b></div>
      <div class="lap-meta-item"><span>Periode</span><b>${periode || "Semua Periode"}</b></div>
      <div class="lap-meta-item"><span>Kapal</span><b>${kapal || "Semua Kapal"}</b></div>
      <div class="lap-meta-item"><span>Total Entri</span><b>${data.length} aktivitas</b></div>
      ${data.some(l => l.foto && l.foto.length)
        ? `<div class="lap-meta-item"><span>Dokumentasi</span><b style="color:#1a7f40;">✓ Tersedia</b></div>`
        : ""}
    </div>

    <!-- Tabel -->
    <div class="wrap">
      <div class="tbl-title">📋 Daftar Aktivitas &amp; Dokumentasi</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>No. Ref</th>
            <th>Tanggal</th>
            <th>Kapal</th>
            <th>Nakhoda</th>
            <th>Aktivitas</th>
            <th>Wilayah</th>
            <th>Temuan</th>
            <th>📷 Dokumentasi</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Footer TTD -->
    <div class="footer">
      <div>
        <div>Dokumen digenerate otomatis oleh sistem E-Logbook KSOP Makassar.</div>
        <div style="color:#aaa;margin-top:2px;">Total ${data.length} entri · Dicetak: ${today}</div>
      </div>
      <div class="ttd">
        <div>Makassar, ${today}</div>
        <div style="margin-top:2px;">Kepala Bidang Keselamatan Berlayar</div>
        <div class="ttd-line">___________________________</div>
        <div style="margin-top:2px;font-size:11px;color:#555;">NIP. .................................</div>
      </div>
    </div>

    </body></html>`);
  win.document.close();
}

/* ──────────────────────────────────────────────
   EXPORT MENU TOGGLE
────────────────────────────────────────────── */
function toggleExportMenu(e) {
  e.stopPropagation();
  document.getElementById("export-menu").classList.toggle("open");
}
document.addEventListener("click", () => {
  const m = document.getElementById("export-menu");
  if (m) m.classList.remove("open");
});

async function exportCSV() {
  const data = await window._fb.getAllLogbook();
  exportToCSV(data, "logbook-export.csv");
}

async function exportPDF() {
  const data = await window._fb.getAllLogbook();
  printReport(data, "Laporan Lengkap", "", "");
}

/* ──────────────────────────────────────────────
   DETAIL LOG MODAL
────────────────────────────────────────────── */
function openDetailLog(log) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "—"; };
  set("dl-kapal",        log.kapal);
  set("dl-tanggal-jenis", `${log.tanggal || "—"} · ${log.jenisAktivitas || "—"}`);
  set("dl-waktu",         `${log.jamBerangkat || "—"} – ${log.jamKembali || "—"}`);
  set("dl-lokasi",        log.wilayah);
  set("dl-nakhoda",       log.nakhoda);
  set("dl-deskripsi",     log.deskripsi || log.uraian);
  set("dl-temuan",        log.temuan ? `${log.temuan} → ${log.tindakan || "—"}` : "Tidak ada temuan");

  // Foto (base64)
  const fotoWrap = document.getElementById("dl-foto");
  const lblEl    = document.getElementById("dl-dok-label");
  if (fotoWrap) {
    if (log.foto && log.foto.length) {
      fotoWrap.innerHTML = log.foto.map(b64 =>
        `<img src="${b64}" alt="foto" style="width:100%;border-radius:6px;margin-bottom:8px;">`
      ).join("");
      if (lblEl) lblEl.textContent = `DOKUMENTASI (${log.foto.length} foto)`;
    } else {
      fotoWrap.innerHTML = `<div style="color:#666;font-size:13px;">Tidak ada foto</div>`;
      if (lblEl) lblEl.textContent = "DOKUMENTASI";
    }
  }

  document.getElementById("modal-detail").classList.add("open");
}

function closeDetailLog() {
  document.getElementById("modal-detail").classList.remove("open");
}

/* ──────────────────────────────────────────────
   INISIALISASI
────────────────────────────────────────────── */
window.addEventListener("firebase-ready", () => {
  console.log("[App] Firebase siap ✔");
  generateNoRefDisplay();
  refreshDashboard();

  // Set tanggal hari ini di form
  const tgl = document.getElementById("f-tanggal");
  if (tgl) tgl.value = new Date().toISOString().split("T")[0];
});

// Fallback jika firebase-ready sudah terjadi sebelum listener terpasang
if (window._fb) {
  generateNoRefDisplay();
  refreshDashboard();
}
