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
    const rows = data.map((l,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${l.noRef||"—"}</td>
        <td>${l.tanggal||"—"}</td>
        <td>${l.kapal||"—"}</td>
        <td>${l.nakhoda||"—"}</td>
        <td>${l.jenisAktivitas||"—"}</td>
        <td>${l.wilayah||"—"}</td>
        <td>${l.temuan||"—"}</td>
      </tr>`).join("");
  
    const win = window.open("","_blank");
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>${jenis}</title>
      <style>
        body { font-family: Arial; font-size: 12px; padding: 20px; }
        h2   { text-align: center; }
        table{ border-collapse: collapse; width: 100%; }
        th,td{ border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th   { background: #1a3a5c; color: #fff; }
        @media print { button { display: none; } }
      </style>
      </head><body>
      <h2>KSOP UTAMA MAKASSAR · KANTOR KESYAHBANDARAN</h2>
      <h3 style="text-align:center;">${jenis} — Periode: ${periode||"Semua"} | Kapal: ${kapal||"Semua"}</h3>
      <table>
        <thead><tr>
          <th>No</th><th>No.Ref</th><th>Tanggal</th><th>Kapal</th>
          <th>Nakhoda</th><th>Aktivitas</th><th>Wilayah</th><th>Temuan</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <br>
      <button onclick="window.print()">🖨️ Cetak</button>
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