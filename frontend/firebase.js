// ══════════════════════════════════════════════════════════════════
//  firebase.js  —  E-logbook Kapal Patroli · Firebase Firestore
//  ✅ 100% GRATIS  —  TANPA Firebase Storage
//  📸 Foto disimpan sebagai Base64 langsung di dokumen Firestore
//  ⚠️  Batas foto: maks 5 foto × 1 MB/foto (total < 1 MB per doc)
//     Tips: foto dikompresi otomatis sebelum disimpan (maks 800px)
// ══════════════════════════════════════════════════════════════════
//
//  CARA SETUP (hanya butuh Firestore, TIDAK perlu Storage):
//  1. Buka https://console.firebase.google.com
//  2. Buat project  →  "elogbook-kapal-patroli"
//  3. Build → Firestore Database → Create database
//     Lokasi: asia-southeast1  |  Mode: test mode
//  4. ⚙️ Project Settings → Your apps → </> (Web)
//     Copy config → tempel di bagian FIREBASE CONFIG di bawah
//  ❌ Tidak perlu mengaktifkan Firebase Storage
//
// ══════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────────
//  🔑  FIREBASE CONFIG  —  isi dari Firebase Console
// ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDqEMu5wiAAF1PLikJxh_l_0zrVWDFAoMw",
  authDomain: "elogbook-kapal-patroli.firebaseapp.com",
  projectId: "elogbook-kapal-patroli",
  storageBucket: "elogbook-kapal-patroli.firebasestorage.app",
  messagingSenderId: "311035129694",
  appId: "1:311035129694:web:cb79af63db3958d8ce69cf"
};
// ──────────────────────────────────────────────
//  INISIALISASI  —  Firestore saja
// ──────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ──────────────────────────────────────────────
//  NAMA KOLEKSI
// ──────────────────────────────────────────────
const COL = {
  LOGBOOK : "logbook",
  KAPAL   : "kapal",
  AWAK    : "awak"
};

// ══════════════════════════════════════════════
//  HELPER — No. Referensi otomatis
// ══════════════════════════════════════════════
function generateNoRef() {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LBK-${yy}${mm}-${rand}`;
}

// ══════════════════════════════════════════════
//  📸  KONVERSI FOTO → BASE64
//  - Kompres + resize otomatis (maks 800px)
//  - Output: array string base64  "data:image/jpeg;base64,..."
//  - Gratis, berjalan 100% di browser, tanpa server
// ══════════════════════════════════════════════

/**
 * Kompres satu File gambar → base64 string.
 * @param {File}   file       — File dari <input type="file">
 * @param {number} maxPx      — panjang sisi terpanjang (default 800px)
 * @param {number} quality    — kualitas JPEG 0–1 (default 0.75)
 * @returns {Promise<string>} base64 data-URL
 */
function compressToBase64(file, maxPx = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width >= height) {
            height = Math.round((height / width)  * maxPx);
            width  = maxPx;
          } else {
            width  = Math.round((width  / height) * maxPx);
            height = maxPx;
          }
        }
        const canvas  = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = Math.round((base64.length * 0.75) / 1024);
        console.log(`[Foto] ${file.name} → ${width}×${height}px, ~${sizeKB} KB`);

        // Jika masih > 900 KB, kompres lebih agresif
        resolve(sizeKB > 900
          ? canvas.toDataURL("image/jpeg", 0.5)
          : base64
        );
      };
      img.onerror = () => reject(new Error(`Gagal memuat: ${file.name}`));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error(`Gagal membaca: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Konversi banyak file sekaligus (maks 5).
 * @param {FileList|File[]} fileList
 * @returns {Promise<string[]>} array base64
 */
async function fotoToBase64Array(fileList) {
  const files  = Array.from(fileList).slice(0, 5);
  const result = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      console.warn("[Foto] Bukan gambar, dilewati:", file.name);
      continue;
    }
    try {
      result.push(await compressToBase64(file));
    } catch (err) {
      console.error("[Foto] Gagal konversi:", err.message);
    }
  }
  return result;
}

// ══════════════════════════════════════════════
//  ████  LOGBOOK  ████
// ══════════════════════════════════════════════

/**
 * Simpan satu entri logbook.
 * Foto dikonversi ke Base64 di browser → disimpan di Firestore.
 *
 * @param {Object}   data      — data dari form
 * @param {FileList} fotoFiles — File[] dari <input type="file"> (opsional)
 * @returns {string} docId
 */
async function saveLogbook(data, fotoFiles = []) {
  const noRef   = generateNoRef();
  const fotoB64 = fotoFiles.length
    ? await fotoToBase64Array(fotoFiles)
    : (data.fotoBase64 || []);

  const payload = {
    noRef,
    kapal            : data.kapal            || "",
    nakhoda          : data.nakhoda          || "",
    abk              : Number(data.abk)      || 0,
    tanggal          : data.tanggal          || "",
    jamBerangkat     : data.jamBerangkat     || "",
    jamKembali       : data.jamKembali       || "",
    jenisAktivitas   : data.jenisAktivitas   || "",
    wilayah          : data.wilayah          || "",
    deskripsi        : data.deskripsi        || "",
    cuaca            : data.cuaca            || "",
    gelombang        : Number(data.gelombang)|| 0,
    angin            : Number(data.angin)    || 0,
    kecepatan        : Number(data.kecepatan)|| 0,
    jarak            : Number(data.jarak)    || 0,
    temuan           : data.temuan           || "",
    tindakan         : data.tindakan         || "",
    noKapalDiperiksa : data.noKapalDiperiksa || "",
    uraian           : data.uraian           || "",
    catatan          : data.catatan          || "",
    mesin            : data.mesin            || "",
    navigasi         : data.navigasi         || "",
    komunikasi       : data.komunikasi       || "",
    statusKapal      : data.statusKapal      || "",
    foto             : fotoB64,   // ← array base64, bukan URL
    createdAt        : serverTimestamp()
  };

  const docRef = await addDoc(collection(db, COL.LOGBOOK), payload);
  console.log(`[Firebase] Logbook → ${docRef.id} | ${noRef} | ${fotoB64.length} foto`);
  return docRef.id;
}

/** Semua logbook, terbaru dulu */
async function getAllLogbook() {
  const snap = await getDocs(
    query(collection(db, COL.LOGBOOK), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Logbook bulan berjalan */
async function getLogbookBulanIni() {
  const now      = new Date();
  const startStr = new Date(now.getFullYear(), now.getMonth(), 1)
                     .toISOString().split("T")[0];
  const endStr   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                     .toISOString().split("T")[0];
  const snap = await getDocs(query(
    collection(db, COL.LOGBOOK),
    where("tanggal", ">=", startStr),
    where("tanggal", "<=", endStr),
    orderBy("tanggal", "desc")
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** N logbook terbaru */
async function getRecentLogbook(n = 5) {
  const snap = await getDocs(query(
    collection(db, COL.LOGBOOK),
    orderBy("createdAt", "desc"),
    limit(n)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Filter logbook.
 * @param {{ kapal?, jenis?, dari?, sampai? }} opts
 */
async function filterLogbook({ kapal, jenis, dari, sampai } = {}) {
  const constraints = [orderBy("tanggal", "desc")];
  if (kapal)  constraints.unshift(where("kapal", "==", kapal));
  if (jenis)  constraints.unshift(where("jenisAktivitas", "==", jenis));
  if (dari)   constraints.unshift(where("tanggal", ">=", dari));
  if (sampai) constraints.unshift(where("tanggal", "<=", sampai));
  const snap = await getDocs(query(collection(db, COL.LOGBOOK), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Hapus logbook */
async function deleteLogbook(docId) {
  await deleteDoc(doc(db, COL.LOGBOOK, docId));
}

/**
 * Real-time listener untuk dashboard.
 * @returns {Function} unsubscribe
 */
function listenLogbook(callback, n = 10) {
  const q = query(
    collection(db, COL.LOGBOOK),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════
//  ████  DATA KAPAL  ████
// ══════════════════════════════════════════════

async function saveKapal(data) {
  const id = (data.nama || "").replace(/\s+/g, "_").toUpperCase();
  await setDoc(doc(db, COL.KAPAL, id), {
    nama         : data.nama         || "",
    callSign     : data.callSign     || "",
    kelas        : data.kelas        || "",
    panjang      : data.panjang      || "",
    konstruksi   : data.konstruksi   || "",
    gt           : data.gt           || "",
    tahunBuat    : Number(data.tahunBuat) || 0,
    kapasitasBBM : data.kapasitasBBM || "",
    airTawar     : data.airTawar     || "",
    jumlahCrew   : Number(data.jumlahCrew) || 0,
    tankiHarian  : data.tankiHarian  || "",
    meMerk       : data.meMerk       || "",
    meDaya       : data.meDaya       || "",
    meHpBBM      : data.meHpBBM      || "",
    meKecepatan  : data.meKecepatan  || "",
    aeMerk       : data.aeMerk       || "",
    aeDaya       : data.aeDaya       || "",
    aeHpBBM      : data.aeHpBBM      || "",
    aeKecepatan  : data.aeKecepatan  || "",
    imo          : data.imo          || "",
    status       : data.status       || "standby",
    updatedAt    : serverTimestamp()
  }, { merge: true });
  return id;
}

async function getAllKapal() {
  const snap = await getDocs(collection(db, COL.KAPAL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateStatusKapal(namaKapal, status) {
  const id = namaKapal.replace(/\s+/g, "_").toUpperCase();
  await updateDoc(doc(db, COL.KAPAL, id), { status, updatedAt: serverTimestamp() });
}

async function deleteKapal(namaKapal) {
  await deleteDoc(doc(db, COL.KAPAL, namaKapal.replace(/\s+/g, "_").toUpperCase()));
}

// ══════════════════════════════════════════════
//  ████  DATA AWAK  ████
// ══════════════════════════════════════════════

async function saveAwak(data) {
  const payload = {
    nama        : data.nama        || "",
    nip         : data.nip         || "",
    jabatan     : data.jabatan     || "",
    kapal       : data.kapal       || "",
    sertifikat  : data.sertifikat  || "",
    masaBerlaku : data.masaBerlaku || "",
    status      : "Aktif",
    createdAt   : serverTimestamp()
  };
  const id = (data.nip || "").replace(/\s+/g, "_");
  if (id) {
    await setDoc(doc(db, COL.AWAK, id), payload, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(db, COL.AWAK), payload);
  return ref.id;
}

async function getAllAwak() {
  const snap = await getDocs(query(collection(db, COL.AWAK), orderBy("nama")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteAwak(docId) {
  await deleteDoc(doc(db, COL.AWAK, docId));
}

// ══════════════════════════════════════════════
//  ████  STATISTIK DASHBOARD  ████
// ══════════════════════════════════════════════

async function getStatsDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const [semuaKapal, logBulanIni, snapHariIni] = await Promise.all([
    getAllKapal(),
    getLogbookBulanIni(),
    getDocs(query(collection(db, COL.LOGBOOK), where("tanggal", "==", today)))
  ]);

  const kapalAktifHariIni = new Set(
    snapHariIni.docs.map(d => d.data().kapal)
  ).size;
  const pelanggaran = logBulanIni.filter(l => l.temuan && l.temuan !== "").length;
  const perbaikan   = semuaKapal.filter(k => k.status === "maintenance").length;
  const rekapJenis  = {};
  for (const l of logBulanIni) {
    const j = l.jenisAktivitas || "Lainnya";
    rekapJenis[j] = (rekapJenis[j] || 0) + 1;
  }

  return {
    kapalAktifHariIni,
    totalAktivitasBulanIni : logBulanIni.length,
    pelanggaranBulanIni    : pelanggaran,
    kapalPerbaikan         : perbaikan,
    rekapJenis,
    semuaKapal
  };
}

// ══════════════════════════════════════════════
//  SEED DATA KAPAL AWAL  (jalankan sekali saja)
// ══════════════════════════════════════════════
async function seedKapalAwal() {
  const list = [
    { nama: "KP. MAKASSAR I",  callSign: "P-101", kelas: "Patroli",  status: "patrol"      },
    { nama: "KP. MAKASSAR II", callSign: "P-102", kelas: "Patroli",  status: "standby"     },
    { nama: "KP. SPICA",       callSign: "P-103", kelas: "Patroli",  status: "patrol"      },
    { nama: "KP. ANTASENA",    callSign: "P-104", kelas: "SAR",      status: "standby"     },
    { nama: "KP. TRISULA",     callSign: "P-105", kelas: "Patroli",  status: "maintenance" },
    { nama: "KP. KERAPU",      callSign: "P-106", kelas: "Inspeksi", status: "standby"     }
  ];
  for (const k of list) await saveKapal(k);
  console.log("[Firebase] Seed kapal selesai ✔");
}

// ══════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════
export {
  db,
  fotoToBase64Array,
  // Logbook
  saveLogbook, getAllLogbook, getLogbookBulanIni, getRecentLogbook,
  filterLogbook, deleteLogbook, listenLogbook,
  // Kapal
  saveKapal, getAllKapal, updateStatusKapal, deleteKapal,
  // Awak
  saveAwak, getAllAwak, deleteAwak,
  // Dashboard
  getStatsDashboard,
  // Seed
  seedKapalAwal
};