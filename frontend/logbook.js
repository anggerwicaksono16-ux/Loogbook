// ══════════════════════════════════════════════════════════
//  logbook.js  —  E-logbook · Riwayat Logbook & Filter
// ══════════════════════════════════════════════════════════

let _allLogbook = [];  // cache lokal agar filter tidak re-fetch

/* ──────────────────────────────────────────────
   LOAD SEMUA LOGBOOK
────────────────────────────────────────────── */
async function loadLogbook() {
  const tbody = document.getElementById("tbl-logbook-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="text-center">⏳ Memuat data…</td></tr>`;

  try {
    _allLogbook = await window._fb.getAllLogbook();
    renderLogbookTable(_allLogbook);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-red">Gagal memuat: ${err.message}</td></tr>`;
  }
}

/* ──────────────────────────────────────────────
   RENDER TABEL
────────────────────────────────────────────── */
function renderLogbookTable(list) {
  const tbody = document.getElementById("tbl-logbook-body");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Tidak ada data yang cocok.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((l, i) => {
    const ada     = l.temuan && l.temuan !== "";
    const descPrv = (l.deskripsi || l.uraian || "—").slice(0, 50);
    const hasFoto = l.foto && l.foto.length > 0;

    return `
    <tr>
      <td class="mono text-xs">${l.noRef || "—"}</td>
      <td>${l.tanggal || "—"}</td>
      <td><b>${l.kapal || "—"}</b></td>
      <td>${l.nakhoda || "—"}</td>
      <td>
        <span class="badge badge-blue">${l.jenisAktivitas || "—"}</span>
      </td>
      <td>${l.wilayah || "—"}</td>
      <td class="text-xs desc-cell">${descPrv}${(l.deskripsi || l.uraian || "").length > 50 ? "…" : ""}</td>
      <td>
        <span class="badge ${ada ? "badge-red" : "badge-green"}">
          ${ada ? "Ada Temuan" : "Normal"}
        </span>
        ${hasFoto ? `<span title="${l.foto.length} foto" style="margin-left:4px;font-size:12px;">📷${l.foto.length}</span>` : ""}
      </td>
      <td>
        <button class="btn btn-outline btn-xs" onclick='openDetailLog(${safeJson(l)})'>👁 Detail</button>
        <button class="btn btn-outline btn-xs btn-danger" onclick="hapusLogbook('${l.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

/** Serialisasi aman untuk inline onclick */
function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

/* ──────────────────────────────────────────────
   FILTER
────────────────────────────────────────────── */
function filterLogbook() {
  const kapal  = document.getElementById("filter-kapal")?.value  || "";
  const jenis  = document.getElementById("filter-jenis")?.value  || "";
  const dari   = document.getElementById("filter-dari")?.value   || "";
  const sampai = document.getElementById("filter-sampai")?.value || "";

  let filtered = _allLogbook;

  if (kapal)  filtered = filtered.filter(l => l.kapal === kapal);
  if (jenis)  filtered = filtered.filter(l => l.jenisAktivitas === jenis);
  if (dari)   filtered = filtered.filter(l => l.tanggal >= dari);
  if (sampai) filtered = filtered.filter(l => l.tanggal <= sampai);

  renderLogbookTable(filtered);
}

/* ──────────────────────────────────────────────
   HAPUS LOGBOOK
────────────────────────────────────────────── */
async function hapusLogbook(docId) {
  if (!confirm("Hapus entri logbook ini?")) return;
  try {
    await window._fb.deleteLogbook(docId);
    showToast("✓ Logbook dihapus");
    loadLogbook();
  } catch (err) {
    showToast("✗ Gagal: " + err.message, "error");
  }
}