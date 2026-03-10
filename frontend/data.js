/* ============================================================
   data.js — State Management + Firebase Firestore
   ============================================================ */

/* ── State (in-memory, disinkron dari Firestore) ── */
let logbookData = [];

/* ── Seed: Data Awak Kapal ── */
let awakData = [
  { nama: 'Capt. Ahmad Fauzi, ANT-II',    jabatan: 'Nakhoda', nip: '19780312 200312 1 002', kapal: 'KP. MAKASSAR I',  sertifikat: 'ANT-II',  berlaku: '2026-08-01', status: 'Aktif' },
  { nama: 'Capt. Budi Santoso, ANT-III',  jabatan: 'Nakhoda', nip: '19821105 200501 1 003', kapal: 'KP. MAKASSAR II', sertifikat: 'ANT-III', berlaku: '2025-12-31', status: 'Aktif' },
  { nama: 'Capt. Hendra Wijaya, ANT-II',  jabatan: 'Nakhoda', nip: '19750820 199903 1 001', kapal: 'KP. SPICA',       sertifikat: 'ANT-II',  berlaku: '2027-03-15', status: 'Aktif' },
  { nama: 'Capt. Rizky Pratama, ANT-III', jabatan: 'Nakhoda', nip: '19900614 201503 1 004', kapal: 'KP. ANTASENA',    sertifikat: 'ANT-III', berlaku: '2026-06-30', status: 'Aktif' },
  { nama: 'Capt. Syarifuddin, ANT-II',    jabatan: 'Nakhoda', nip: '19830227 200604 1 005', kapal: 'KP. TRISULA',     sertifikat: 'ANT-II',  berlaku: '2026-11-20', status: 'Aktif' },
];

/* ── Seed: Data Kapal (tetap di lokal, bisa dimigrasi) ── */
const kapalData = [
  { nama: 'KP. MAKASSAR I',  tipe: 'Kapal Patroli Kelas A', tahun: 2018, imo: 'IMO-8814532', panjang: '28.5 m', gt: '98 GT',  kecepatan: '25 knot', mesin: 'MAN 2×1200 HP',        bbm: '8,000 liter', abkMaks: 12, status: 'patrol'      },
  { nama: 'KP. MAKASSAR II', tipe: 'Kapal Patroli Kelas A', tahun: 2019, imo: 'IMO-9021445', panjang: '28.5 m', gt: '98 GT',  kecepatan: '25 knot', mesin: 'MAN 2×1200 HP',        bbm: '8,000 liter', abkMaks: 12, status: 'patrol'      },
  { nama: 'KP. SPICA',       tipe: 'Kapal Patroli Kelas B', tahun: 2016, imo: 'IMO-7762219', panjang: '18.2 m', gt: '35 GT',  kecepatan: '20 knot', mesin: 'Yanmar 2×450 HP',      bbm: '3,500 liter', abkMaks: 8,  status: 'standby'    },
  { nama: 'KP. ANTASENA',    tipe: 'Kapal Patroli Kelas B', tahun: 2020, imo: 'IMO-9234781', panjang: '22.0 m', gt: '55 GT',  kecepatan: '22 knot', mesin: 'Caterpillar 2×850 HP', bbm: '5,000 liter', abkMaks: 10, status: 'patrol'      },
  { nama: 'KP. TRISULA',     tipe: 'Kapal Patroli Kelas B', tahun: 2015, imo: 'IMO-7512330', panjang: '18.0 m', gt: '32 GT',  kecepatan: '18 knot', mesin: 'Mitsubishi 2×380 HP',  bbm: '3,000 liter', abkMaks: 8,  status: 'standby'    },
  { nama: 'KP. KERAPU',      tipe: 'Kapal Patroli Kelas C', tahun: 2014, imo: 'IMO-7100445', panjang: '14.5 m', gt: '18 GT',  kecepatan: '16 knot', mesin: 'Volvo Penta 2×250 HP', bbm: '1,800 liter', abkMaks: 6,  status: 'maintenance'},
];

/* ── Counter for auto-ref ── */
let refCounter = 0;

/* ── Helper: generate No. Ref ── */
function generateNoRef() {
  const d  = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const el = document.getElementById('form-noref');
  if (el) el.textContent = `No. Ref: LBK-${dd}${mm}-${String(refCounter + 1).padStart(3, '0')}`;
}

/* ── Helper: next ID ── */
function nextLogId(tanggal) {
  refCounter++;
  const d  = new Date(tanggal);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `LBK-${dd}${mm}-${String(refCounter).padStart(3, '0')}`;
}

/* ── Loading Overlay ── */
function showLoading(pesan = 'Memuat data dari Firebase…') {
  let el = document.getElementById('fb-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fb-loading';
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(10,22,40,0.75);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      z-index:9999;color:#fff;font-family:'DM Sans',sans-serif;gap:14px;
    `;
    el.innerHTML = `
      <div style="width:44px;height:44px;border:3px solid #00c8e040;border-top-color:#00c8e0;border-radius:50%;animation:spin .8s linear infinite;"></div>
      <div id="fb-loading-msg" style="font-size:14px;color:#a0b8cc;">${pesan}</div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  } else {
    document.getElementById('fb-loading-msg').textContent = pesan;
    el.style.display = 'flex';
  }
}

function hideLoading() {
  const el = document.getElementById('fb-loading');
  if (el) el.style.display = 'none';
}
/* ══════════════════════════════════════════════════════════
   FUNGSI: getAllLogbook()
   Mengembalikan seluruh data logbook dari memory (logbookData)
   yang sudah disinkron dari Firestore oleh app.js / main.js
   ══════════════════════════════════════════════════════════ */
function getAllLogbook() {
  return Promise.resolve([...logbookData]);
}

/* ══════════════════════════════════════════════════════════
   KONDISI YANG DIANGGAP "DALAM PERBAIKAN"
   Berdasarkan field kondisi mesin & status kapal di form logbook
   ══════════════════════════════════════════════════════════ */
// Semua nilai kondisi yang dianggap "ada gangguan / butuh perbaikan"
const _RUSAK_MESIN      = ["Ada Gangguan Minor", "Perlu Perbaikan", "Tidak Beroperasi"];
const _RUSAK_NAVIGASI   = ["Ada Gangguan Minor", "Perlu Perbaikan"];
const _RUSAK_KOMUNIKASI = ["Ada Gangguan",       "Tidak Berfungsi"];
const _STATUS_RUSAK     = ["Dalam Perawatan",    "Docking"];

/**
 * Cek apakah satu entri logbook menandakan kapal sedang bermasalah/perbaikan.
 */
function _isEntryPerbaikan(entry) {
  const mesin      = entry.mesin       || entry.kondisiMesin       || "";
  const navigasi   = entry.navigasi    || entry.kondisiNav         || "";
  const komunikasi = entry.komunikasi  || entry.kondisiKom         || "";
  const status     = entry.statusKapal || entry.statusKapalSetelah || "";

  return (
    _RUSAK_MESIN.includes(mesin)           ||
    _RUSAK_NAVIGASI.includes(navigasi)     ||
    _RUSAK_KOMUNIKASI.includes(komunikasi) ||
    _STATUS_RUSAK.includes(status)
  );
}

/**
 * Dari semua logbook, ambil entri TERBARU per kapal,
 * lalu kembalikan nama-nama kapal yang sedang dalam perbaikan.
 * Fallback ke kapalData jika belum ada logbook.
 */
function getKapalSedangPerbaikan() {
  if (!logbookData.length) {
    // Fallback: cek status dari data kapal statis
    return kapalData
      .filter(k => k.status === 'maintenance' || k.status === 'docking')
      .map(k => k.nama);
  }

  // Ambil entri terbaru per kapal
  const latest = {};
  logbookData.forEach(entry => {
    const nama = entry.kapal || entry.namaKapal || "";
    if (!nama) return;
    const tgl = new Date(entry.tanggal || 0).getTime();
    if (!latest[nama] || tgl > latest[nama].tgl) {
      latest[nama] = { entry, tgl };
    }
  });

  // Filter kapal yang kondisinya rusak / perbaikan
  return Object.entries(latest)
    .filter(([, { entry }]) => _isEntryPerbaikan(entry))
    .map(([nama]) => nama);
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: populateKapalDropdowns()
   Mengisi semua <select> dropdown nama kapal di seluruh
   halaman berdasarkan array kapalData (termasuk kapal baru
   yang sudah ditambahkan via modal).
   ══════════════════════════════════════════════════════════ */
function populateKapalDropdowns() {
  // ID semua select yang perlu diisi nama kapal
  const dropdownIds = [
    'f-kapal',        // Form Input Aktivitas
    'filter-kapal',   // Filter Riwayat Logbook
    'lap-kapal',      // Laporan
    'm-kapal',        // Modal Tambah Awak
  ];

  dropdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    // Simpan nilai yang sedang dipilih agar tidak reset
    const selectedVal = el.value;

    // Hapus semua opsi kecuali opsi pertama (placeholder / "Semua Kapal")
    while (el.options.length > 1) el.remove(1);

    // Isi ulang dari kapalData
    kapalData.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.nama;
      opt.textContent = k.nama;
      el.appendChild(opt);
    });

    // Kembalikan pilihan sebelumnya jika masih ada
    if (selectedVal) el.value = selectedVal;
  });
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: saveKapal()
   Menyimpan data kapal baru dari modal ke kapalData,
   lalu refresh semua dropdown dan kartu kapal.
   ══════════════════════════════════════════════════════════ */
function saveKapal() {
  const nama = (document.getElementById('mk-nama')?.value || '').trim();
  if (!nama) {
    alert('Nama kapal tidak boleh kosong.');
    return;
  }

  // Cek duplikasi nama
  const sudahAda = kapalData.some(k => k.nama.toLowerCase() === nama.toLowerCase());
  if (sudahAda) {
    alert(`Kapal "${nama}" sudah ada dalam daftar.`);
    return;
  }

  // Buat objek kapal baru
  const kapalBaru = {
    nama,
    callsign    : document.getElementById('mk-callsign')?.value   || '',
    tipe        : `Kapal ${document.getElementById('mk-kelas')?.value || 'Patroli'}`,
    tahun       : parseInt(document.getElementById('mk-tahun')?.value) || new Date().getFullYear(),
    imo         : document.getElementById('mk-imo')?.value         || '',
    panjang     : document.getElementById('mk-ukuran')?.value      || '',
    gt          : document.getElementById('mk-gt')?.value          || '',
    konstruksi  : document.getElementById('mk-konstruksi')?.value  || '',
    kecepatan   : document.getElementById('mk-me-kecepatan')?.value || '',
    mesin       : `${document.getElementById('mk-me-merk')?.value || ''} ${document.getElementById('mk-me-daya')?.value || ''}`.trim(),
    bbm         : document.getElementById('mk-bbm')?.value         || '',
    abkMaks     : parseInt(document.getElementById('mk-crew')?.value) || 0,
    status      : document.getElementById('mk-status')?.value      || 'standby',
  };

  // Tambahkan ke array lokal
  kapalData.push(kapalBaru);

  // Refresh semua dropdown kapal di halaman
  populateKapalDropdowns();

  // Jika ada fungsi renderKapal (dari app.js), panggil untuk update kartu
  if (typeof window.renderKapal === 'function') window.renderKapal();
  if (typeof window.refreshDashboard === 'function') window.refreshDashboard();

  // Tutup modal & reset field
  closeModalKapal();

  // Toast notifikasi
  if (typeof showToast === 'function') showToast(`✓ Kapal "${nama}" berhasil ditambahkan`);
}

/* ── Helper: tutup modal kapal ── */
function closeModalKapal() {
  const modal = document.getElementById('modal-kapal');
  if (modal) modal.classList.remove('open');

  // Reset semua field modal
  ['mk-nama','mk-callsign','mk-imo','mk-ukuran','mk-konstruksi','mk-gt','mk-tahun',
   'mk-bbm','mk-air','mk-crew','mk-tanki','mk-me-merk','mk-me-daya','mk-me-hpbbm',
   'mk-me-kecepatan','mk-ae-merk','mk-ae-daya','mk-ae-hpbbm','mk-ae-kecepatan']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ── Helper: buka modal kapal ── */
function openModalKapal(namaKapal) {
  const modal = document.getElementById('modal-kapal');
  if (!modal) return;

  if (namaKapal) {
    // Mode edit — isi field dari data yang ada
    const k = kapalData.find(x => x.nama === namaKapal);
    if (k) {
      document.getElementById('mk-nama').value  = k.nama   || '';
      document.getElementById('mk-imo').value   = k.imo    || '';
      document.getElementById('mk-tahun').value = k.tahun  || '';
      document.getElementById('mk-gt').value    = k.gt     || '';
      document.getElementById('mk-bbm').value   = k.bbm    || '';
      document.getElementById('mk-crew').value  = k.abkMaks|| '';
    }
    document.getElementById('modal-kapal-title').textContent = `Edit Kapal: ${namaKapal}`;
  } else {
    document.getElementById('modal-kapal-title').textContent = 'Tambah Kapal Baru';
  }

  modal.classList.add('open');
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: populateNakhodaDropdown()
   Mengisi select#f-nakhoda dari awakData (jabatan = Nakhoda).
   Pola identik dengan populateKapalDropdowns().
   ══════════════════════════════════════════════════════════ */
function populateNakhodaDropdown() {
  const el = document.getElementById('f-nakhoda');
  if (!el) return;
  const current = el.value;

  function _isi(list) {
    while (el.options.length > 1) el.remove(1);
    list
      .filter(a => a.jabatan === 'Nakhoda')
      .forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.nama || '';
        opt.textContent = a.nama || '';
        el.appendChild(opt);
      });
    if (current) el.value = current;
  }

  // Ambil dari Firebase jika tersedia, fallback ke awakData lokal
  if (typeof window.getAllAwak === 'function') {
    window.getAllAwak()
      .then(fbList => {
        const namaFb = fbList.map(a => (a.nama||'').toLowerCase());
        const lokal  = awakData.filter(a => !namaFb.includes(a.nama.toLowerCase()));
        _isi([...fbList, ...lokal]);
      })
      .catch(() => _isi(awakData));
  } else {
    _isi(awakData);
  }
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: onJabatanChange()
   Hint visual saat jabatan Nakhoda dipilih di modal awak.
   ══════════════════════════════════════════════════════════ */
function onJabatanChange(sel) {
  const isNakhoda = sel.value === 'Nakhoda';
  const namaEl    = document.getElementById('m-nama');
  const sertEl    = document.getElementById('m-sertifikat');

  if (isNakhoda) {
    if (namaEl) namaEl.placeholder = 'Capt. Nama Lengkap, ANT-II';
    if (sertEl) sertEl.placeholder = 'ANT-I / ANT-II / ANT-III';

    let banner = document.getElementById('nakhoda-info-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'nakhoda-info-banner';
      banner.style.cssText = [
        'grid-column:1/-1',
        'background:rgba(0,200,224,0.08)',
        'border:1px solid rgba(0,200,224,0.3)',
        'border-radius:8px',
        'padding:8px 14px',
        'font-size:12px',
        'color:#00c8e0',
        'margin-top:4px',
      ].join(';');
      banner.innerHTML = '⚓ Nama ini akan otomatis muncul di dropdown <b>Nakhoda</b> pada Form Input Aktivitas.';
      sel.closest('.form-grid-2').appendChild(banner);
    }
    banner.style.display = 'block';
  } else {
    const banner = document.getElementById('nakhoda-info-banner');
    if (banner) banner.style.display = 'none';
    if (namaEl) namaEl.placeholder = 'Nama personel';
    if (sertEl) sertEl.placeholder = 'Contoh: ANT-II, ATT-III';
  }
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: _getDetailGangguan(entry)
   Kembalikan string detail masalah dari satu entri logbook,
   atau null jika semua kondisi normal.
   ══════════════════════════════════════════════════════════ */
function _getDetailGangguan(entry) {
  const mesin      = entry.mesin       || entry.kondisiMesin       || "";
  const navigasi   = entry.navigasi    || entry.kondisiNav         || "";
  const komunikasi = entry.komunikasi  || entry.kondisiKom         || "";
  const status     = entry.statusKapal || entry.statusKapalSetelah || "";

  const masalah = [];
  if (_RUSAK_MESIN.includes(mesin))           masalah.push("Mesin: "      + mesin);
  if (_RUSAK_NAVIGASI.includes(navigasi))     masalah.push("Navigasi: "   + navigasi);
  if (_RUSAK_KOMUNIKASI.includes(komunikasi)) masalah.push("Komunikasi: " + komunikasi);
  if (_STATUS_RUSAK.includes(status))         masalah.push("Status: "     + status);

  return masalah.length ? masalah.join(" · ") : null;
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: _statusDariEntry(entry, statusAsli)
   Tentukan status kapal ('patrol'|'standby'|'maintenance'|'docking')
   berdasarkan kondisi yang diinputkan di form logbook.
   ══════════════════════════════════════════════════════════ */
function _statusDariEntry(entry, statusAsli) {
  const mesin      = entry.mesin       || entry.kondisiMesin       || "";
  const navigasi   = entry.navigasi    || entry.kondisiNav         || "";
  const komunikasi = entry.komunikasi  || entry.kondisiKom         || "";
  const statusPost = entry.statusKapal || entry.statusKapalSetelah || "";

  // Status setelah aktivitas yang eksplisit → prioritas utama
  if (statusPost === "Docking")          return "docking";
  if (statusPost === "Dalam Perawatan")  return "maintenance";

  // Ada kondisi gangguan di mesin / navigasi / komunikasi → maintenance
  const adaGangguan =
    _RUSAK_MESIN.includes(mesin)           ||
    _RUSAK_NAVIGASI.includes(navigasi)     ||
    _RUSAK_KOMUNIKASI.includes(komunikasi);

  if (adaGangguan)                       return "maintenance";
  if (statusPost === "Standby di Dermaga") return "standby";
  if (statusPost === "Siap Bertugas")      return "patrol";

  // Fallback: pertahankan status asal dari kapalData
  return statusAsli || "standby";
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: getStatusKapalDashboard()
   Kembalikan array semua kapal dengan status DINAMIS
   yang sudah di-override dari entri logbook terbaru.
   Digunakan oleh dashboard.js untuk renderShipStatusMini().
   ══════════════════════════════════════════════════════════ */
function getStatusKapalDashboard() {
  // Bangun map: nama kapal → entri logbook paling baru
  const latest = {};
  logbookData.forEach(entry => {
    const nama = entry.kapal || entry.namaKapal || "";
    if (!nama) return;
    const tgl = new Date(entry.tanggal || 0).getTime();
    if (!latest[nama] || tgl > latest[nama].tgl) {
      latest[nama] = { entry, tgl };
    }
  });

  return kapalData.map(k => {
    const rec = latest[k.nama];
    if (rec) {
      const statusDinamis = _statusDariEntry(rec.entry, k.status);
      const keterangan    = _getDetailGangguan(rec.entry);
      return {
        nama          : k.nama,
        tipe          : k.tipe,
        status        : statusDinamis,
        keterangan    : keterangan || "",
        tanggalUpdate : rec.entry.tanggal || "",
      };
    }
    // Kapal belum punya logbook → pakai status statis
    return {
      nama          : k.nama,
      tipe          : k.tipe,
      status        : k.status,
      keterangan    : "",
      tanggalUpdate : "",
    };
  });
}

/* ══════════════════════════════════════════════════════════
   FUNGSI: pushLogbookEntry(entry)
   Dipanggil dari app.js / main.js setelah simpan logbook
   agar logbookData lokal terupdate, lalu trigger re-render
   status kapal di dashboard secara instan.
   ══════════════════════════════════════════════════════════ */
function pushLogbookEntry(entry) {
  if (!entry) return;
  logbookData.push(entry);

  // Trigger refresh komponen dashboard yang bergantung pada kondisi kapal
  if (typeof window._refreshStatusKapal === 'function') {
    window._refreshStatusKapal();
  }
}

// Expose ke window agar bisa diakses dari dashboard.js
// ⚠️ Gunakan ||= agar TIDAK menimpa fungsi Firebase dari main.js
if (typeof window !== 'undefined') {
  // Selalu expose — fungsi unik milik data.js
  window._getAllLogbook           = getAllLogbook;
  window._getKapalPerbaikan      = getKapalSedangPerbaikan;
  window.getStatusKapalDashboard = getStatusKapalDashboard;
  window.pushLogbookEntry        = pushLogbookEntry;
  window.onJabatanChange         = onJabatanChange;
  window.openModalKapal          = openModalKapal;
  window.closeModalKapal         = closeModalKapal;
  window.kapalData               = kapalData;
  window.awakData                = awakData;
  window.logbookData             = logbookData;

  // ✅ Hanya set jika main.js BELUM mendefinisikan versi Firebase-nya
  if (typeof window.saveKapal !== 'function') {
    window.saveKapal = saveKapal;
  }
  if (typeof window.populateKapalDropdowns !== 'function') {
    window.populateKapalDropdowns = populateKapalDropdowns;
  }
  if (typeof window.populateNakhodaDropdown !== 'function') {
    window.populateNakhodaDropdown = populateNakhodaDropdown;
  }

  // Isi semua dropdown saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      populateKapalDropdowns();
      populateNakhodaDropdown();
    });
  } else {
    populateKapalDropdowns();
    populateNakhodaDropdown();
  }
}
