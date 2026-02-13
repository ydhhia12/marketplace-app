import { db, auth } from "./firebase.js";
import { ref, push, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ========================== REGISTER ==========================
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const registerBtn = document.getElementById("registerBtn");
registerBtn.onclick = () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Email dan password wajib diisi!");
  if (password.length < 6) return alert("Password minimal 6 karakter!");

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Registrasi berhasil! Silakan login.");
      window.location.href = "index.html";
    })
    .catch(err => alert("Gagal registrasi: " + err.message));
};

// ========================== LOGIN ==========================
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return alert("Email dan password wajib diisi!");

    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        localStorage.setItem("currentUser", JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email
        }));
        window.location.href = "home.html";
      })
      .catch(err => alert("Login gagal: " + err.message));
  };
}

// ========================== LOGOUT ==========================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth).then(() => {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  };
}

// ========================== CEK LOGIN ==========================
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  if (!user && (path.includes("dashboard") || path.includes("home") || path.includes("tambah"))) {
    window.location.href = "index.html"; // redirect ke login kalau belum login
  }
});

// ========================== ADD PRODUCT ==========================
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.onclick = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return alert("Login dulu ya!");

    const nama = document.getElementById("nama").value.trim();
    const harga = document.getElementById("harga").value.trim();
    const kategori = document.getElementById("kategori").value;
    const gambar = document.getElementById("gambar").value.trim();
    const wa = document.getElementById("wa").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();

    if (!nama || !harga) return alert("Nama dan harga wajib diisi!");

    const productRef = push(ref(db, "products/"));
    set(productRef, {
      uid: currentUser.uid,
      nama,
      harga,
      kategori,
      gambar,
      wa,
      deskripsi,
      createdAt: Date.now()
    })
    .then(() => {
      alert("Produk berhasil ditambahkan!");
      window.location.href = "dashboard.html";
    })
    .catch(err => alert("Gagal upload produk: " + err.message));
  };
}

// ========================== DASHBOARD ==========================
const dashboardList = document.getElementById("dashboardList");
if (dashboardList) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) window.location.href = "index.html";

  const productRef = ref(db, "products/");
  onValue(productRef, snapshot => {
    const data = snapshot.val();
    dashboardList.innerHTML = "";
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key].uid === currentUser.uid) {
          dashboardList.innerHTML += `
            <div class="productCard">
              <h4>${data[key].nama}</h4>
              <p>Rp ${data[key].harga}</p>
              <button onclick="window.location.href='edit.html?id=${key}'">Edit</button>
              <button onclick="deleteProduct('${key}')">Hapus</button>
              <button onclick="window.location.href='detail.html?id=${key}'">Detail</button>
            </div>
          `;
        }
      });
    } else {
      dashboardList.innerHTML = "<p>Belum ada produk</p>";
    }
  });
}

// ========================== DELETE PRODUCT ==========================
window.deleteProduct = (id) => {
  const confirmDel = confirm("Yakin ingin hapus produk?");
  if (!confirmDel) return;

  const productRef = ref(db, "products/" + id);
  set(productRef, null).then(() => alert("Produk berhasil dihapus"));
};

// ========================== MARKETPLACE ==========================
const productList = document.getElementById("productList");
if (productList) {
  const productRef = ref(db, "products/");
  onValue(productRef, snapshot => {
    const data = snapshot.val();
    productList.innerHTML = "";
    if (data) {
      Object.keys(data).reverse().forEach(key => {
        const item = data[key];
        productList.innerHTML += `
          <div class="productCard">
            <h4>${item.nama}</h4>
            <p>Rp ${item.harga}</p>
            <button onclick="window.location.href='detail.html?id=${key}'">Lihat</button>
          </div>
        `;
      });
    } else {
      productList.innerHTML = "<p>Belum ada produk</p>";
    }
  });
}

// ========================== EDIT PRODUCT ==========================
const saveEdit = document.getElementById("saveEdit");
if (saveEdit) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const productRef = ref(db, "products/" + id);

  get(productRef).then(snapshot => {
    const data = snapshot.val();
    document.getElementById("nama").value = data.nama;
    document.getElementById("harga").value = data.harga;
    document.getElementById("kategori").value = data.kategori;
    document.getElementById("gambar").value = data.gambar;
    document.getElementById("wa").value = data.wa;
    document.getElementById("deskripsi").value = data.deskripsi;
  });

  saveEdit.onclick = () => {
    update(productRef, {
      nama: document.getElementById("nama").value,
      harga: document.getElementById("harga").value,
      kategori: document.getElementById("kategori").value,
      gambar: document.getElementById("gambar").value,
      wa: document.getElementById("wa").value,
      deskripsi: document.getElementById("deskripsi").value
    }).then(() => {
      alert("Produk berhasil diupdate!");
      window.location.href = "dashboard.html";
    });
  };
}
