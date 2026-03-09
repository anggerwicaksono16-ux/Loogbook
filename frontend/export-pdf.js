// ══════════════════════════════════════════════════════════
//  export-pdf.js  —  E-logbook · Export PDF dengan Foto
//  Menggantikan / memperluas fungsi printReport & exportPDF
//  yang ada di app.js
// ══════════════════════════════════════════════════════════

/* ──────────────────────────────────────────────────────────
   HELPER: Format tanggal ke "DD Bulan YYYY"
────────────────────────────────────────────────────────── */
function _formatTanggal(iso) {
  if (!iso) return "—";
  const bln = ["Januari","Februari","Maret","April","Mei","Juni",
                "Juli","Agustus","September","Oktober","November","Desember"];
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${bln[parseInt(m, 10) - 1]} ${y}`;
}

/* ──────────────────────────────────────────────────────────
   HELPER: Badge HTML inline untuk temuan
────────────────────────────────────────────────────────── */
function _badgeTemuan(temuan) {
  if (!temuan || temuan.trim() === "") {
    return `<span style="background:#d4edda;color:#155724;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Normal</span>`;
  }
  return `<span style="background:#f8d7da;color:#721c24;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Ada Temuan</span>`;
}

/* ──────────────────────────────────────────────────────────
   HELPER: Buat grid foto (base64) untuk satu entri logbook
────────────────────────────────────────────────────────── */
function _renderFotoGrid(fotoArr) {
  if (!fotoArr || !fotoArr.length) return "";
  const imgTags = fotoArr.map(b64 => {
    // Pastikan prefix data-URL ada
    const src = b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
    return `
      <div style="break-inside:avoid;display:inline-block;margin:4px;">
        <img src="${src}" alt="dokumentasi"
             style="width:180px;height:130px;object-fit:cover;
                    border-radius:6px;border:1px solid #ccc;display:block;">
      </div>`;
  }).join("");

  return `
    <div style="margin-top:8px;">
      <div style="font-size:10px;color:#555;font-weight:700;margin-bottom:4px;
                  text-transform:uppercase;letter-spacing:.5px;">
        📷 Dokumentasi (${fotoArr.length} foto)
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${imgTags}
      </div>
    </div>`;
}

/* ──────────────────────────────────────────────────────────
   MAIN: printReport  (menggantikan versi lama di app.js)
   Mendukung 3 mode tampilan:
     "ringkas"  → tabel ringkas tanpa foto (default lama)
     "detail"   → kartu detail per entri + foto
     "rekap"    → rekap per jenis aktivitas
────────────────────────────────────────────────────────── */
function printReport(data, jenis, periode, kapal, mode = "detail") {

  /* ── Rekap per jenis ── */
  const rekapJenis = {};
  data.forEach(l => {
    const k = l.jenisAktivitas || "Lainnya";
    rekapJenis[k] = (rekapJenis[k] || 0) + 1;
  });
  const totalEntri = data.length;
  const adaFoto    = data.some(l => l.foto && l.foto.length);

  /* ── Header dokumen ── */
  const periodeLabel = periode
    ? _formatTanggal(`${periode}-01`).replace(/^\d+ /, "")   // "Maret 2025"
    : "Semua Periode";
  const kapalLabel   = kapal || "Semua Kapal";
  const today        = _formatTanggal(new Date().toISOString().split("T")[0]);

  /* ── Baris tabel ringkas ── */
  const rowsRingkas = data.map((l, i) => `
    <tr style="${i % 2 === 0 ? "" : "background:#f8f9fa;"}">
      <td style="text-align:center;">${i + 1}</td>
      <td style="font-family:monospace;font-size:11px;">${l.noRef || "—"}</td>
      <td>${_formatTanggal(l.tanggal)}</td>
      <td><b>${l.kapal || "—"}</b></td>
      <td>${l.nakhoda || "—"}</td>
      <td>${l.jenisAktivitas || "—"}</td>
      <td>${l.wilayah || "—"}</td>
      <td>${_badgeTemuan(l.temuan)}</td>
    </tr>`).join("");

  /* ── Kartu detail per entri ── */
  const cardsDetail = data.map((l, i) => {
    const hasFoto = l.foto && l.foto.length > 0;
    return `
    <div style="break-inside:avoid;border:1px solid #dce3ea;border-radius:8px;
                margin-bottom:18px;overflow:hidden;page-break-inside:avoid;">

      <!-- Header kartu -->
      <div style="background:#1a3a5c;color:#fff;padding:10px 16px;
                  display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:15px;font-weight:700;">${l.kapal || "—"}</span>
          <span style="font-size:12px;opacity:.8;margin-left:10px;">${l.jenisAktivitas || "—"}</span>
        </div>
        <div style="font-size:12px;opacity:.8;">
          ${_formatTanggal(l.tanggal)}
          &nbsp;|&nbsp;
          ${(l.jamBerangkat || "--:--").slice(0,5)} – ${(l.jamKembali || "--:--").slice(0,5)}
        </div>
      </div>

      <!-- Body kartu -->
      <div style="padding:12px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr>
            <td style="padding:3px 8px;color:#555;width:130px;">No. Referensi</td>
            <td style="padding:3px 8px;font-family:monospace;">${l.noRef || "—"}</td>
            <td style="padding:3px 8px;color:#555;width:130px;">Nakhoda</td>
            <td style="padding:3px 8px;">${l.nakhoda || "—"}</td>
          </tr>
          <tr style="background:#f8f9fa;">
            <td style="padding:3px 8px;color:#555;">Wilayah Patroli</td>
            <td style="padding:3px 8px;">${l.wilayah || "—"}</td>
            <td style="padding:3px 8px;color:#555;">ABK</td>
            <td style="padding:3px 8px;">${l.abk || "—"}</td>
          </tr>
          <tr>
            <td style="padding:3px 8px;color:#555;">Cuaca</td>
            <td style="padding:3px 8px;">${l.cuaca || "—"}</td>
            <td style="padding:3px 8px;color:#555;">Gelombang</td>
            <td style="padding:3px 8px;">${l.gelombang || "—"}</td>
          </tr>
          <tr style="background:#f8f9fa;">
            <td style="padding:3px 8px;color:#555;">Angin</td>
            <td style="padding:3px 8px;">${l.angin || "—"}</td>
            <td style="padding:3px 8px;color:#555;">Kecepatan</td>
            <td style="padding:3px 8px;">${l.kecepatan || "—"} knot</td>
          </tr>
          <tr>
            <td style="padding:3px 8px;color:#555;">Jarak Tempuh</td>
            <td style="padding:3px 8px;">${l.jarak || "—"} nm</td>
            <td style="padding:3px 8px;color:#555;">Status Kapal</td>
            <td style="padding:3px 8px;">${l.statusKapal || "—"}</td>
          </tr>
          <tr style="background:#f8f9fa;">
            <td style="padding:3px 8px;color:#555;">Kondisi Mesin</td>
            <td style="padding:3px 8px;">${l.mesin || "—"}</td>
            <td style="padding:3px 8px;color:#555;">Navigasi</td>
            <td style="padding:3px 8px;">${l.navigasi || "—"}</td>
          </tr>
        </table>

        ${l.deskripsi || l.uraian ? `
        <div style="margin-top:10px;border-top:1px solid #eee;padding-top:8px;">
          <div style="font-size:10px;color:#555;font-weight:700;margin-bottom:3px;
                      text-transform:uppercase;letter-spacing:.5px;">Uraian Kegiatan</div>
          <div style="font-size:12px;line-height:1.6;">${l.deskripsi || l.uraian}</div>
        </div>` : ""}

        ${l.temuan ? `
        <div style="margin-top:10px;background:#fff3cd;border:1px solid #ffc107;
                    border-radius:6px;padding:8px 12px;">
          <div style="font-size:10px;color:#856404;font-weight:700;margin-bottom:3px;
                      text-transform:uppercase;letter-spacing:.5px;">⚠ Temuan & Tindakan</div>
          <div style="font-size:12px;"><b>Temuan:</b> ${l.temuan}</div>
          ${l.tindakan ? `<div style="font-size:12px;margin-top:4px;"><b>Tindakan:</b> ${l.tindakan}</div>` : ""}
        </div>` : `
        <div style="margin-top:10px;background:#d4edda;border:1px solid #28a745;
                    border-radius:6px;padding:6px 12px;font-size:12px;color:#155724;">
          ✓ Tidak ada temuan — aktivitas berjalan normal
        </div>`}

        ${hasFoto ? _renderFotoGrid(l.foto) : ""}

        ${l.catatan ? `
        <div style="margin-top:8px;font-size:11px;color:#666;font-style:italic;">
          📝 Catatan: ${l.catatan}
        </div>` : ""}
      </div>
    </div>`;
  }).join("");

  /* ── Bar rekap jenis ── */
  const maxRekap  = Math.max(...Object.values(rekapJenis), 1);
  const rekapRows = Object.entries(rekapJenis)
    .sort((a, b) => b[1] - a[1])
    .map(([jns, jml]) => {
      const pct = Math.round((jml / maxRekap) * 100);
      return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:150px;font-size:12px;color:#1a3a5c;font-weight:600;">${jns}</div>
        <div style="flex:1;background:#e9ecef;border-radius:4px;height:14px;overflow:hidden;">
          <div style="height:100%;background:#1a3a5c;width:${pct}%;border-radius:4px;"></div>
        </div>
        <div style="width:80px;text-align:right;font-size:12px;font-weight:700;">
          ${jml}x <span style="color:#888;font-weight:400;">(${Math.round((jml/totalEntri)*100)}%)</span>
        </div>
      </div>`;
    }).join("");

  /* ── Konten utama sesuai mode ── */
  let mainContent = "";
  if (mode === "ringkas") {
    mainContent = `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#1a3a5c;color:#fff;">
            <th style="padding:8px;text-align:center;width:30px;">No</th>
            <th style="padding:8px;">No. Ref</th>
            <th style="padding:8px;">Tanggal</th>
            <th style="padding:8px;">Kapal</th>
            <th style="padding:8px;">Nakhoda</th>
            <th style="padding:8px;">Aktivitas</th>
            <th style="padding:8px;">Wilayah</th>
            <th style="padding:8px;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsRingkas}</tbody>
      </table>`;
  } else {
    mainContent = cardsDetail;
  }

  /* ── Bangun HTML ── */
  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${jenis} — KSOP Makassar</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 13px;
      color: #222;
      background: #fff;
      padding: 0;
    }

    /* ── Kop Surat ── */
    .kop {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 20px 30px 16px;
      border-bottom: 3px solid #1a3a5c;
    }
    .kop-logo {
      width: 70px;
      height: 70px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-logo-placeholder {
      width: 70px;
      height: 70px;
      background: #1a3a5c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 28px;
      flex-shrink: 0;
    }
    .kop-text { flex: 1; }
    .kop-instansi {
      font-size: 10px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .kop-judul {
      font-size: 18px;
      font-weight: 700;
      color: #1a3a5c;
      line-height: 1.2;
    }
    .kop-sub {
      font-size: 11px;
      color: #555;
      margin-top: 2px;
    }
    .kop-right {
      text-align: right;
      font-size: 11px;
      color: #555;
      flex-shrink: 0;
    }
    .kop-right .doc-no {
      font-family: monospace;
      font-weight: 700;
      font-size: 12px;
      color: #1a3a5c;
    }

    /* ── Info bar ── */
    .info-bar {
      display: flex;
      gap: 0;
      background: #f0f4f8;
      border-bottom: 1px solid #dce3ea;
      padding: 0 30px;
    }
    .info-item {
      padding: 10px 20px 10px 0;
      margin-right: 20px;
      border-right: 1px solid #dce3ea;
      font-size: 11px;
    }
    .info-item:last-child { border-right: none; }
    .info-label { color: #666; text-transform: uppercase; letter-spacing: .4px; font-size: 9px; }
    .info-val { font-weight: 700; color: #1a3a5c; font-size: 13px; margin-top: 2px; }

    /* ── Rekap ── */
    .rekap-box {
      margin: 20px 30px;
      background: #f8fafc;
      border: 1px solid #dce3ea;
      border-radius: 8px;
      padding: 16px 20px;
    }
    .rekap-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a3a5c;
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-bottom: 12px;
    }

    /* ── Main content ── */
    .main { padding: 20px 30px; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #1a3a5c;
      text-transform: uppercase;
      letter-spacing: .6px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #1a3a5c;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 30px;
      padding: 16px 30px;
      border-top: 1px solid #dce3ea;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 11px;
      color: #555;
    }
    .ttd-box {
      text-align: center;
      min-width: 180px;
    }
    .ttd-line {
      margin-top: 50px;
      border-top: 1px solid #333;
      padding-top: 4px;
      font-weight: 700;
      color: #1a3a5c;
    }

    /* ── Print & Tombol ── */
    .print-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1a3a5c;
      color: #fff;
      padding: 10px 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .print-bar span { font-size: 13px; opacity: .85; }
    .print-btns { display: flex; gap: 8px; }
    .btn-print {
      background: #fff;
      color: #1a3a5c;
      border: none;
      padding: 7px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-mode {
      background: rgba(255,255,255,.15);
      color: #fff;
      border: 1px solid rgba(255,255,255,.4);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-mode.active {
      background: #fff;
      color: #1a3a5c;
      font-weight: 700;
    }

    @media print {
      .print-bar { display: none !important; }
      body { padding: 0; }
      img { max-width: 100% !important; }
    }
  </style>
</head>
<body>

<!-- ═══ Toolbar Aksi (tidak ikut cetak) ═══ -->
<div class="print-bar">
  <span>📄 Pratinjau Laporan — ${jenis}</span>
  <div class="print-btns">
    <button class="btn-mode ${mode === 'ringkas' ? 'active' : ''}"
            onclick="switchMode('ringkas')">📋 Tabel Ringkas</button>
    <button class="btn-mode ${mode === 'detail' ? 'active' : ''}"
            onclick="switchMode('detail')">📑 Detail + Foto</button>
    <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
  </div>
</div>

<!-- ═══ KOP SURAT ═══ -->
<div class="kop">
  <div class="kop-logo-placeholder">⚓</div>
  <div class="kop-text">
    <div class="kop-instansi">Kementerian Perhubungan — Direktorat Jenderal Perhubungan Laut</div>
    <div class="kop-judul">KSOP UTAMA MAKASSAR</div>
    <div class="kop-sub">Kantor Kesyahbandaran dan Otoritas Pelabuhan Utama Makassar</div>
    <div class="kop-sub" style="margin-top:2px;color:#888;">
      Jl. Hatta No. 4 Makassar · Telp. (0411) 317001 · E-Logbook Kapal Patroli
    </div>
  </div>
  <div class="kop-right">
    <div class="kop-instansi">Dicetak</div>
    <div style="font-weight:700;color:#1a3a5c;">${today}</div>
    <div style="margin-top:4px;" class="kop-instansi">Dokumen</div>
    <div class="doc-no">RPT-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}</div>
  </div>
</div>

<!-- ═══ INFO BAR ═══ -->
<div class="info-bar">
  <div class="info-item">
    <div class="info-label">Jenis Laporan</div>
    <div class="info-val">${jenis}</div>
  </div>
  <div class="info-item">
    <div class="info-label">Periode</div>
    <div class="info-val">${periodeLabel}</div>
  </div>
  <div class="info-item">
    <div class="info-label">Kapal</div>
    <div class="info-val">${kapalLabel}</div>
  </div>
  <div class="info-item">
    <div class="info-label">Total Entri</div>
    <div class="info-val">${totalEntri} aktivitas</div>
  </div>
  ${adaFoto ? `
  <div class="info-item">
    <div class="info-label">Dokumentasi</div>
    <div class="info-val" style="color:#1a7f40;">✓ Tersedia</div>
  </div>` : ""}
</div>

<!-- ═══ REKAP JENIS ═══ -->
${Object.keys(rekapJenis).length > 1 ? `
<div class="rekap-box">
  <div class="rekap-title">📊 Rekap Per Jenis Aktivitas</div>
  ${rekapRows}
</div>` : ""}

<!-- ═══ KONTEN UTAMA ═══ -->
<div class="main" id="main-content">
  <div class="section-title">
    ${mode === 'ringkas' ? '📋 Daftar Aktivitas' : '📑 Detail Aktivitas & Dokumentasi'}
  </div>
  ${mainContent}
</div>

<!-- ═══ FOOTER / TTD ═══ -->
<div class="footer">
  <div>
    <div>Dokumen ini digenerate secara otomatis oleh sistem E-Logbook KSOP Makassar.</div>
    <div style="margin-top:2px;color:#888;">Total ${totalEntri} entri · Dicetak: ${today}</div>
  </div>
  <div class="ttd-box">
    <div style="font-size:11px;color:#555;">Makassar, ${today}</div>
    <div style="font-size:11px;color:#555;margin-top:2px;">Kepala Bidang Keselamatan Berlayar</div>
    <div class="ttd-line">_______________________________</div>
    <div style="font-size:11px;color:#555;margin-top:2px;">NIP. .................................</div>
  </div>
</div>

<script>
  // ── Simpan data ke window agar bisa switch mode tanpa re-fetch ──
  window._reportData   = ${JSON.stringify(data)};
  window._reportJenis  = ${JSON.stringify(jenis)};
  window._reportPeriode = ${JSON.stringify(periode)};
  window._reportKapal  = ${JSON.stringify(kapal)};

  function switchMode(newMode) {
    // Reload window dengan mode baru
    // (data sudah ada di window._reportData)
    const origin = window.opener || window.parent;
    if (origin && origin.printReport) {
      window.close();
      origin.printReport(window._reportData, window._reportJenis,
                         window._reportPeriode, window._reportKapal, newMode);
    }
  }
</script>
</body>
</html>`;

  /* ── Buka jendela baru ── */
  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

/* ──────────────────────────────────────────────────────────
   EXPORT PDF (tombol di toolbar logbook)
   Mode default: "detail" — kartu lengkap + foto
────────────────────────────────────────────────────────── */
async function exportPDF() {
  showToast("⏳ Menyiapkan PDF…");
  try {
    const data = await window._fb.getAllLogbook();
    if (!data.length) { showToast("⚠ Belum ada data logbook", "warn"); return; }
    printReport(data, "Laporan Logbook Lengkap", "", "", "detail");
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

/* ──────────────────────────────────────────────────────────
   EXPORT PDF DARI TOMBOL LAPORAN (generateReport)
   Dipanggil dari app.js::generateReport() jika format PDF
────────────────────────────────────────────────────────── */
async function generateReport() {
  const jenis   = document.getElementById("lap-jenis")?.value   || "Laporan Aktivitas";
  const periode = document.getElementById("lap-periode")?.value || "";
  const kapal   = document.getElementById("lap-kapal")?.value   || "";
  const format  = document.getElementById("lap-format")?.value  || "PDF Detail";

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

    if (!filtered.length) {
      showToast("⚠ Tidak ada data untuk filter ini", "warn");
      return;
    }

    if (format === "Excel (CSV)") {
      exportToCSV(filtered, `laporan-${periode || "semua"}.csv`);
    } else if (format === "PDF Ringkas") {
      printReport(filtered, jenis, periode, kapal, "ringkas");
    } else {
      // Default: PDF Detail dengan foto
      printReport(filtered, jenis, periode, kapal, "detail");
    }
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}

/* ──────────────────────────────────────────────────────────
   EXPORT PDF SATU ENTRI (dari modal detail)
   Contoh pemakaian di index.html:
     <button onclick="exportPDFSatuEntri(currentLog)">Export PDF</button>
────────────────────────────────────────────────────────── */
function exportPDFSatuEntri(log) {
  if (!log) return;
  printReport([log], "Laporan Aktivitas", log.tanggal?.slice(0, 7) || "", log.kapal || "", "detail");
}
window.exportPDFSatuEntri = exportPDFSatuEntri;
