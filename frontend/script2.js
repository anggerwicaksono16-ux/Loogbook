// ============================================================
//  script2.js — Firebase Auth untuk E-Logbook KSOP Makassar
//  Metode  : Email/Password + Google Sign-In
//  Redirect: index.html
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
//  KONFIGURASI FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyDqEMu5wiAAF1PLikJxh_l_0zrVWDFAoMw",
  authDomain:        "elogbook-kapal-patroli.firebaseapp.com",
  projectId:         "elogbook-kapal-patroli",
  storageBucket:     "elogbook-kapal-patroli.firebasestorage.app",
  messagingSenderId: "311035129694",
  appId:             "1:311035129694:web:cb79af63db3958d8ce69cf",
};

// ============================================================
//  KONFIGURASI APLIKASI
// ============================================================
const REDIRECT_URL = "index.html";

// ============================================================
//  INISIALISASI
// ============================================================
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.addScope("profile");
provider.addScope("email");

// ============================================================
//  CEK SESI
//  - Sudah login + di halaman login    → redirect ke index.html
//  - Belum login + bukan halaman login → redirect ke login.html
//  - Sudah login + di dashboard        → isi info user di header
// ============================================================
onAuthStateChanged(auth, (user) => {
  const isLoginPage = window.location.pathname.includes("login");
  const isDashboard = !isLoginPage;

  // ── Cek sesi Admin lokal (tanpa Firebase) ──
  const isAdminLocal = sessionStorage.getItem("user_role") === "Admin" &&
                       sessionStorage.getItem("user_uid")  === "admin-local";

  if (user && isLoginPage) {
    // Operator sudah login Firebase, masih di halaman login → masuk dashboard
    window.location.replace(REDIRECT_URL);

  } else if (isLoginPage && isAdminLocal) {
    // Admin lokal sudah login, masih di halaman login → masuk dashboard
    window.location.replace(REDIRECT_URL);

  } else if (!user && isDashboard && !isAdminLocal) {
    // Bukan Firebase user DAN bukan Admin lokal → lempar ke login
    window.location.replace("login.html");

  } else if (user && isDashboard) {
    // Operator Firebase login, di dashboard → isi info user di header
    const nameEl  = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const avEl    = document.getElementById("userAvatar");

    const displayName = user.displayName || user.email?.split("@")[0] || "Pengguna";
    if (nameEl)  nameEl.textContent  = displayName;
    if (emailEl) emailEl.textContent = user.email || "—";
    if (avEl && user.photoURL) {
      avEl.innerHTML = '<img src="' + user.photoURL + '" alt="avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">';
    }

    // Simpan ke sessionStorage sebagai backup
    sessionStorage.setItem("user_uid",   user.uid          || "");
    sessionStorage.setItem("user_name",  user.displayName  || "");
    sessionStorage.setItem("user_email", user.email        || "");
    sessionStorage.setItem("user_photo", user.photoURL     || "");
    sessionStorage.setItem("user_role",  "Operator");
  }
  // Jika isAdminLocal && isDashboard → biarkan, halaman sudah handle via sessionStorage
});

// ============================================================
//  LOGIN EMAIL & PASSWORD
//  Dipanggil dari login.html → doLogin()
// ============================================================
window.doLoginFirebase = async function (email, password) {
  const rememberMe = document.getElementById("rem")?.checked ?? false;

  try {
    // Persistence: Local = tetap login; Session = hanya tab ini
    const persistence = rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence;

    await setPersistence(auth, persistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    handleLoginSuccess(userCredential.user);

  } catch (error) {
    handleLoginError(error);
  }
};

// ============================================================
//  LOGIN GOOGLE
//  Terhubung ke tombol #btn-google di login.html
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const btnGoogle = document.getElementById("btn-google");
  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      try {
        showLoading("Menghubungkan ke Google…");
        const result = await signInWithPopup(auth, provider);
        handleLoginSuccess(result.user);
      } catch (error) {
        handleLoginError(error);
      }
    });
  }
});

// ============================================================
//  HANDLER: LOGIN BERHASIL
// ============================================================
function handleLoginSuccess(user) {
  const pbar     = document.getElementById("pbar");
  const btnTxt   = document.getElementById("btnTxt");
  const toast    = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");

  if (pbar)   pbar.style.width = "100%";
  if (btnTxt) btnTxt.textContent = "Berhasil! ✓";

  const displayName = user.displayName || user.email || "Pengguna";
  if (toastMsg) toastMsg.textContent = `Selamat datang, ${displayName}! Mengalihkan…`;
  if (toast)    toast.classList.add("show");

  // Simpan info user untuk dipakai di halaman lain
  sessionStorage.setItem("user_uid",   user.uid          || "");
  sessionStorage.setItem("user_name",  user.displayName  || "");
  sessionStorage.setItem("user_email", user.email        || "");
  sessionStorage.setItem("user_photo", user.photoURL     || "");

  setTimeout(() => {
    window.location.replace(REDIRECT_URL);
  }, 1500);
}

// ============================================================
//  HANDLER: LOGIN GAGAL
// ============================================================
function handleLoginError(error) {
  const errEl  = document.getElementById("err-msg");
  const pbar   = document.getElementById("pbar");
  const btnTxt = document.getElementById("btnTxt");

  if (pbar)   pbar.style.width = "0%";
  if (btnTxt) btnTxt.textContent = "Masuk ke Dashboard";

  const message = getErrorMessage(error.code);

  if (errEl) {
    errEl.textContent = "⚠ " + message;
    errEl.classList.add("show");
    setTimeout(() => errEl.classList.remove("show"), 5000);
  }

  console.error("[Auth Error]", error.code, "—", error.message);
}

// ============================================================
//  HELPER: Tampilkan loading state
// ============================================================
function showLoading(text = "Memproses…") {
  const btnTxt = document.getElementById("btnTxt");
  const pbar   = document.getElementById("pbar");
  if (btnTxt) btnTxt.textContent = text;
  if (pbar)   pbar.style.width = "70%";
}

// ============================================================
//  HELPER: Pesan error Firebase → Bahasa Indonesia
// ============================================================
function getErrorMessage(code) {
  const messages = {
    "auth/invalid-email":              "Format email tidak valid.",
    "auth/user-not-found":             "Akun dengan email ini tidak ditemukan.",
    "auth/wrong-password":             "Kata sandi salah. Silakan coba lagi.",
    "auth/invalid-credential":         "Email atau kata sandi salah.",
    "auth/user-disabled":              "Akun ini telah dinonaktifkan. Hubungi admin.",
    "auth/too-many-requests":          "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    "auth/network-request-failed":     "Koneksi gagal. Periksa jaringan internet Anda.",
    "auth/popup-closed-by-user":       "Login Google dibatalkan.",
    "auth/popup-blocked":              "Popup diblokir browser. Izinkan popup lalu coba lagi.",
    "auth/cancelled-popup-request":    "Permintaan login dibatalkan.",
    "auth/account-exists-with-different-credential":
                                       "Email sudah terdaftar dengan metode login lain.",
    "auth/operation-not-allowed":      "Metode login ini belum diaktifkan di Firebase.",
    "auth/internal-error":             "Terjadi kesalahan server. Coba lagi.",
  };
  return messages[code] ?? "Terjadi kesalahan. Silakan coba lagi.";
}

// ============================================================
//  FUNGSI LOGOUT
//  Gunakan di index.html / dashboard:
//
//  <script type="module">
//    import { logoutUser } from './script2.js';
//    document.getElementById('btnLogout').onclick = logoutUser;
//  </script>
// ============================================================
export async function logoutUser() {
  try {
    await signOut(auth);
    sessionStorage.clear();
    window.location.replace("login.html");
  } catch (error) {
    console.error("[Logout Error]", error);
  }
}
