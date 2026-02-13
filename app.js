import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  ref,
  push,
  onValue,
  get,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =======================
// LOGIN
// =======================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Isi email & password!");

    signInWithEmailAndPassword(auth, email, password)
      .then(() => window.location.href = "home.html")
      .catch(err => alert(err.message));
  };
}

// =======================
// REGISTER
// =======================
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Isi email & password!");

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Akun berhasil dibuat!");
        window.location.href = "index.html";
      })
      .catch(err => alert(err.message));
  };
}

// =======================
// LOGOUT
// =======================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = "index.html");
}

// =======================
// CEK LOGIN
// =======================
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  if (path.includes("home.html") || path.includes("dashboard.html") || path.includes("tambah.html")) {
    if (!user) window.location.href = "index.html";
    else {
      loadProducts();
      loadUserProducts();
    }
  }
});

// =======================
// FORMAT RUPIAH
// =======================
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID").format(angka);
}

// =======================
// UPLOAD / EDIT BARANG
// =======================
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.onclick = () => {
    const user = auth.currentUser;
    if (!user) return alert("Kamu harus login dulu!");

    const nama = document.getElementById("nama").value.trim();
    const harga = document.getElementById("harga").value.trim();
    const kategori = document.getElementById("kategori").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();
    const gambar = document.getElementById("gambar").value.trim();
    const editId = uploadBtn.dataset.editId;

    if (!nama || !harga) return alert("Isi nama & harga!");

    if (editId) {
      update(ref(db, "products/" + editId), { nama, harga, kategori, deskripsi, gambar: gambar || "" })
        .then(() => { alert("Produk berhasil diupdate!"); window.location.href = "dashboard.html"; })
        .catch(err => alert(err.message));
    } else {
      push(ref(db, "products"), { nama, harga, kategori, deskripsi, gambar: gambar || "", uid: user.uid, createdAt: Date.now() })
        .then(() => { alert("Barang berhasil diupload!"); window.location.href = "dashboard.html"; });
    }
  };
}

// =======================
// TAMPILKAN SEMUA PRODUK (HOME)
// =======================
function loadProducts() {
  const productList = document.getElementById("productList");
  if (!productList) return;

  onValue(ref(db, "products"), snapshot => {
    productList.innerHTML = "";
    if (!snapshot.exists()) return productList.innerHTML = "<p>Belum ada produk.</p>";

    snapshot.forEach(child => {
      const data = child.val();
      productList.innerHTML += `
        <div class="product-card">
          <img src="${data.gambar || 'https://via.placeholder.com/150'}" width="120">
          <h3>${data.nama}</h3>
          <p>💰 Rp ${formatRupiah(data.harga)}</p>
          <a href="detail.html?id=${child.key}">
            <button>Lihat Detail</button>
          </a>
        </div>
      `;
    });
  });
}

// =======================
// DASHBOARD: PRODUK USER
// =======================
function loadUserProducts() {
  const dashboardList = document.getElementById("dashboardList");
  if (!dashboardList) return;

  const user = auth.currentUser;
  if (!user) return;

  onValue(ref(db, "products"), snapshot => {
    dashboardList.innerHTML = "";
    if (!snapshot.exists()) return dashboardList.innerHTML = "<p>Belum ada produk.</p>";

    let found = false;
    snapshot.forEach(child => {
      const data = child.val();
      if (data.uid === user.uid) {
        found = true;
        dashboardList.innerHTML += `
          <div class="product-card">
            <img src="${data.gambar || 'https://via.placeholder.com/150'}" width="120">
            <h3>${data.nama}</h3>
            <p>💰 Rp ${formatRupiah(data.harga)}</p>
            <p>📦 ${data.kategori || "-"}</p>
            <p>${data.deskripsi || ""}</p>
            <a href="detail.html?id=${child.key}"><button>Lihat Detail</button></a>
            <button onclick="editProduct('${child.key}')">Edit</button>
            <button onclick="deleteProduct('${child.key}')">Hapus</button>
          </div>
        `;
      }
    });
    if (!found) dashboardList.innerHTML = "<p>Belum ada produk milikmu.</p>";
  });
}

// =======================
// DELETE PRODUK
// =======================
window.deleteProduct = id => {
  if (!confirm("Yakin ingin hapus produk?")) return;
  const user = auth.currentUser;
  if (!user) return;

  get(ref(db, "products/" + id)).then(snapshot => {
    const data = snapshot.val();
    if (data && data.uid === user.uid) remove(ref(db, "products/" + id)).then(() => alert("Produk berhasil dihapus!"));
    else alert("Kamu tidak bisa menghapus produk ini!");
  });
}

// =======================
// EDIT PRODUK (ke form tambah.html)
// =======================
window.editProduct = id => {
  const user = auth.currentUser;
  if (!user) return;

  get(ref(db, "products/" + id)).then(snapshot => {
    const data = snapshot.val();
    if (!data || data.uid !== user.uid) return alert("Kamu tidak bisa edit produk ini!");

    window.location.href = `tambah.html?editId=${id}`;
  });
}

// =======================
// DETAIL PRODUK
// =======================
const detailDiv = document.getElementById("detail");
if (detailDiv) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return detailDiv.innerHTML = "<p>Produk tidak ditemukan</p>";

  get(ref(db, "products/" + id)).then(snapshot => {
    if (!snapshot.exists()) return detailDiv.innerHTML = "<p>Produk tidak ditemukan</p>";

    const data = snapshot.val();
    const pesanWA = encodeURIComponent(`Halo, saya mau beli produk ini:\n\n${data.nama}\nHarga: Rp ${formatRupiah(data.harga)}`);
    detailDiv.innerHTML = `
      <img src="${data.gambar || 'https://via.placeholder.com/300'}" style="width:100%;border-radius:10px;">
      <h2>${data.nama}</h2>
      <h3>Rp ${formatRupiah(data.harga)}</h3>
      <p>${data.deskripsi || ""}</p>
      <a href="https://wa.me/62XXXXXXXXXX?text=${pesanWA}" target="_blank">
        <button>BELI SEKARANG</button>
      </a>
    `;
  });
}
