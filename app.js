import { db, auth } from "./firebase.js";
import { ref, set, push, get, child, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ========================== LOGIN ==========================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "home.html";
      })
      .catch(err => alert(err.message));
  };
}

// ========================== REGISTER ==========================
const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
  registerBtn.onclick = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Registrasi berhasil!");
        window.location.href = "index.html";
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

// ========================== ADD PRODUCT ==========================
// ======= ADD PRODUCT =======
const uploadBtn = document.getElementById("uploadBtn");
uploadBtn.onclick = async () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) return alert("Login dulu ya!");

  const nama = document.getElementById("nama").value.trim();
  const harga = document.getElementById("harga").value.trim();
  const kategori = document.getElementById("kategori").value;
  const file = document.getElementById("gambarFile").files[0];
  const wa = document.getElementById("wa").value.trim();
  const deskripsi = document.getElementById("deskripsi").value.trim();

  if (!nama || !harga) return alert("Nama dan harga wajib diisi!");
  if (!file) return alert("Silakan pilih foto produk!");

  // Upload ke Firebase Storage
  const storage = getStorage();
  const imgRef = storageRef(storage, `produk/${Date.now()}_${file.name}`);
  try {
    await uploadBytes(imgRef, file);
    const imgURL = await getDownloadURL(imgRef);

    // Simpan ke Realtime Database
    const productRef = push(dbRef(db, "products/"));
    await set(productRef, {
      uid: currentUser.uid,
      nama,
      harga,
      kategori,
      gambar: imgURL,
      wa,
      deskripsi,
      createdAt: Date.now()
    });

    alert("Produk berhasil ditambahkan!");
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Gagal upload produk: " + err.message);
  }
};
// ========================== DASHBOARD ==========================
const dashboardList = document.getElementById("dashboardList");
if (dashboardList) {
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const productRef = ref(db, "products/");
    onValue(productRef, snapshot => {
      const data = snapshot.val();
      dashboardList.innerHTML = "";
      if (data) {
        Object.keys(data).forEach(key => {
          if (data[key].uid === user.uid) {
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
      Object.keys(data).reverse().forEach(key => { // terbaru dulu
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
