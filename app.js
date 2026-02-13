import { db, auth } from "./firebase.js";
import { ref, set, push, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ========================== REGISTER ==========================
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return alert("Email dan password wajib diisi!");

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Registrasi berhasil! Silakan login.");
        window.location.href = "index.html";
      })
      .catch(err => alert(err.message));
  };
}

// ========================== LOGIN ==========================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return alert("Email dan password wajib diisi!");

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "home.html";
      })
      .catch(err => alert(err.message));
  };
}

// ========================== LOGOUT ==========================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  };
}

// ========================== UPLOAD PRODUK ==========================
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("gambarFile");
const previewImg = document.getElementById("previewImg");

if (fileInput && previewImg) {
  // Preview gambar
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      previewImg.src = URL.createObjectURL(file);
      previewImg.style.display = "block";
    } else {
      previewImg.style.display = "none";
    }
  });
}

if (uploadBtn) {
  uploadBtn.onclick = async () => {
    const nama = document.getElementById("nama").value.trim();
    const harga = document.getElementById("harga").value.trim();
    const kategori = document.getElementById("kategori").value;
    const file = fileInput.files[0];
    const wa = document.getElementById("wa").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();

    if (!nama || !harga) return alert("Nama dan harga wajib diisi!");
    if (!file) return alert("Silakan pilih foto produk!");
    
    // Cek format JPG / JPEG
    if (!file.name.toLowerCase().endsWith(".jpg") && !file.name.toLowerCase().endsWith(".jpeg")) {
      return alert("Hanya bisa upload file JPG/JPEG!");
    }

    if (wa && !/^\d+$/.test(wa)) return alert("Nomor WA hanya boleh angka!");

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Sedang upload...";

    try {
      const storage = getStorage();
      const imgRef = storageRef(storage, `produk/${Date.now()}_${file.name}`);
      await uploadBytes(imgRef, file);
      const imgURL = await getDownloadURL(imgRef);

      const productRef = push(ref(db, "products/"));
      await set(productRef, {
        uid: "guest",
        nama,
        harga,
        kategori,
        gambar: imgURL,
        wa,
        deskripsi,
        createdAt: Date.now()
      });

      alert("Produk berhasil ditambahkan!");
      window.location.href = "home.html";
    } catch (err) {
      alert("Gagal upload produk: " + err.message);
      console.error(err);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload Barang";
    }
  };
}


// ========================== DASHBOARD ==========================
const dashboardList = document.getElementById("dashboardList");
if (dashboardList) {
  const productRef = ref(db, "products/");
  onValue(productRef, snapshot => {
    const data = snapshot.val() || {};
    dashboardList.innerHTML = "";
    if (Object.keys(data).length === 0) {
      dashboardList.innerHTML = "<p>Belum ada produk</p>";
      return;
    }
    Object.keys(data).reverse().forEach(key => {
      const item = data[key];
      dashboardList.innerHTML += `
        <div class="productCard">
          <img src="${item.gambar}" alt="${item.nama}" class="productImg"/>
          <h4>${item.nama}</h4>
          <p>Rp ${item.harga}</p>
          <button onclick="window.location.href='edit.html?id=${key}'">Edit</button>
          <button onclick="deleteProduct('${key}')">Hapus</button>
          <button onclick="window.location.href='detail.html?id=${key}'">Detail</button>
        </div>
      `;
    });
  });
}

// ========================== DELETE PRODUK ==========================
window.deleteProduct = (id) => {
  const confirmDel = confirm("Yakin ingin hapus produk?");
  if (!confirmDel) return;

  const productRef = ref(db, "products/" + id);
  set(productRef, null)
    .then(() => alert("Produk berhasil dihapus"))
    .catch(err => alert("Gagal hapus: " + err.message));
};

// ========================== MARKETPLACE + SEARCH ==========================
const productList = document.getElementById("productList");
const searchInput = document.getElementById("search");
let allProducts = {};

if (productList) {
  onValue(ref(db, "products/"), snapshot => {
    allProducts = snapshot.val() || {};
    displayProducts(allProducts);
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = {};
      Object.keys(allProducts).forEach(key => {
        if (allProducts[key].nama.toLowerCase().includes(query)) {
          filtered[key] = allProducts[key];
        }
      });
      displayProducts(filtered);
    });
  }
}

function displayProducts(data) {
  if (!productList) return;
  productList.innerHTML = "";
  if (Object.keys(data).length === 0) {
    productList.innerHTML = "<p>Produk tidak ditemukan</p>";
    return;
  }
  Object.keys(data).reverse().forEach(key => {
    const item = data[key];
    productList.innerHTML += `
      <div class="productCard">
        <img src="${item.gambar}" alt="${item.nama}" class="productImg"/>
        <h4>${item.nama}</h4>
        <p>Rp ${item.harga}</p>
        <button onclick="window.location.href='detail.html?id=${key}'">Lihat</button>
      </div>
    `;
  });
}

// ========================== EDIT PRODUK ==========================
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
    document.getElementById("wa").value = data.wa;
    document.getElementById("deskripsi").value = data.deskripsi;
    document.getElementById("oldGambar").value = data.gambar;
  });

  saveEdit.onclick = async () => {
    const file = document.getElementById("gambarFile").files[0];
    let gambarURL = document.getElementById("oldGambar").value;

    if (file) {
      const storage = getStorage();
      const imgRef = storageRef(storage, `produk/${Date.now()}_${file.name}`);
      await uploadBytes(imgRef, file);
      gambarURL = await getDownloadURL(imgRef);
    }

    update(productRef, {
      nama: document.getElementById("nama").value,
      harga: document.getElementById("harga").value,
      kategori: document.getElementById("kategori").value,
      gambar: gambarURL,
      wa: document.getElementById("wa").value,
      deskripsi: document.getElementById("deskripsi").value
    }).then(() => {
      alert("Produk berhasil diupdate!");
      window.location.href = "dashboard.html";
    });
  };
}