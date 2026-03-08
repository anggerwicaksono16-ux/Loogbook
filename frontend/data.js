/* ============================================================
   data.js — State Management + Firebase Firestore
   ============================================================ */

/* ── State (in-memory, disinkron dari Firestore) ── */
let logbookData = [];
let awakData    = [];

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