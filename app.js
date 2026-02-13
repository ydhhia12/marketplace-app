import { db } from "./firebase.js";
import { ref, push, get, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =======================
// REGISTER (REALTIMEDB)
// =======================
// =======================
// REGISTER (REALTIMEDB & AUTO LOGIN)
// =======================
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Isi email & password!");

    const usersRef = ref(db, "users");
    get(usersRef).then(snapshot => {
      let exists = false;

      snapshot.forEach(child => {
        if (child.val().email === email) exists = true;
      });

      if (exists) {
        alert("Email sudah terdaftar!");
        return;
      }

      // Push data ke Realtime Database
      push(usersRef, {
        email,
        password, // plain text (bisa nanti di-hash)
        createdAt: Date.now()
      }).then(newUserRef => {
        // Ambil data user baru
        get(newUserRef).then(userSnap => {
          const user = { ...userSnap.val(), key: newUserRef.key };
          // Simpan user ke localStorage => otomatis login
          localStorage.setItem("currentUser", JSON.stringify(user));
          alert("Akun berhasil dibuat! Langsung login...");
          window.location.href = "home.html"; // langsung ke home
        });
      });
    });
  };
}

// =======================
// LOGIN (REALTIMEDB)
// =======================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Isi email & password!");

    const usersRef = ref(db, "users");
    get(usersRef).then(snapshot => {
      let foundUser = null;

      snapshot.forEach(child => {
        const data = child.val();
        if (data.email === email && data.password === password) {
          foundUser = { ...data, key: child.key };
        }
      });

      if (foundUser) {
        // Simpan user di localStorage biar tetap login
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        alert("Login berhasil!");
        window.location.href = "home.html";
      } else {
        alert("Email atau password salah!");
      }
    });
  };
}

// =======================
// CEK LOGIN
// =======================
function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

// =======================
// LOGOUT
// =======================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  };
}

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
    const user = getCurrentUser();
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
      push(ref(db, "products"), { nama, harga, kategori, deskripsi, gambar: gambar || "", uid: user.key, createdAt: Date.now() })
        .then(() => { alert("Barang berhasil diupload!"); window.location.href = "dashboard.html"; });
    }
  };
}

// =======================
// TAMPILKAN PRODUK (HOME & DASHBOARD)
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
          <a href="detail.html?id=${child.key}"><button>Lihat Detail</button></a>
        </div>
      `;
    });
  });
}

function loadUserProducts() {
  const dashboardList = document.getElementById("dashboardList");
  if (!dashboardList) return;

  const user = getCurrentUser();
  if (!user) return;

  onValue(ref(db, "products"), snapshot => {
    dashboardList.innerHTML = "";
    if (!snapshot.exists()) return dashboardList.innerHTML = "<p>Belum ada produk.</p>";

    let found = false;
    snapshot.forEach(child => {
      const data = child.val();
      if (data.uid === user.key) {
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
// DELETE & EDIT PRODUK
// =======================
window.deleteProduct = id => {
  if (!confirm("Yakin ingin hapus produk?")) return;

  const user = getCurrentUser();
  if (!user) return;

  get(ref(db, "products/" + id)).then(snapshot => {
    const data = snapshot.val();
    if (data && data.uid === user.key) remove(ref(db, "products/" + id)).then(() => alert("Produk berhasil dihapus!"));
    else alert("Kamu tidak bisa menghapus produk ini!");
  });
};

window.editProduct = id => {
  const user = getCurrentUser();
  if (!user) return;

  get(ref(db, "products/" + id)).then(snapshot => {
    const data = snapshot.val();
    if (!data || data.uid !== user.key) return alert("Kamu tidak bisa edit produk ini!");
    window.location.href = `tambah.html?editId=${id}`;
  });
};

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
      <a href="https://wa.me/62XXXXXXXXXX?text=${pesanWA}" target="_blank"><button>BELI SEKARANG</button></a>
    `;
  });
}
