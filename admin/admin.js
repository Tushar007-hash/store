const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n).toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catName = slug => (CATEGORIES.find(c => c.slug === slug) || { name: slug }).name;
const adminImg = (u, w, h) => u && u.includes("res.cloudinary.com") && u.includes("/upload/") ? u.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`) : u;
const ts = () => firebase.firestore.FieldValue.serverTimestamp();

if (!firebaseReady()) {
  document.body.insertAdjacentHTML("afterbegin",
    '<div class="setup-warn"><b>Firebase is not set up yet.</b> Open <code>js/firebase-config.js</code> and paste your keys. Steps are in <code>SETUP.md</code>.</div>');
} else if (document.body.dataset.page === "login") initLogin();
else initDashboard();

/* ---------- Login ---------- */
function initLogin() {
  auth.onAuthStateChanged(u => { if (u) location.replace("dashboard.html"); });
  $("login-form").onsubmit = async e => {
    e.preventDefault();
    $("err").textContent = ""; $("go").disabled = true;
    try { await auth.signInWithEmailAndPassword($("email").value.trim(), $("password").value); }
    catch (er) {
      const bad = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"];
      $("err").textContent = bad.includes(er.code) ? "Wrong email or password." :
        er.code === "auth/too-many-requests" ? "Too many attempts. Please wait a few minutes and try again." :
        er.code === "auth/network-request-failed" ? "Network problem. Check your internet connection." : "Could not sign in: " + er.message;
      $("go").disabled = false;
    }
  };
}

/* ---------- Dashboard ---------- */
let editingId = null, formImages = [];

function initDashboard() {
  $("f-cat").innerHTML = CATEGORIES.map(c => `<option value="${c.slug}">${esc(c.name)}</option>`).join("");
  auth.onAuthStateChanged(u => {
    if (!u) return location.replace("login.html");
    $("who").textContent = u.email;
    refresh();
  });
  $("logout").onclick = () => auth.signOut();
  $("q").oninput = renderRows;
  $("add-btn").onclick = () => openForm();
  $("cancel").onclick = $("cancel-x").onclick = () => $("dlg").close();
  $("pform").onsubmit = saveProduct;
  $("f-files").onchange = uploadFiles;
  $("add-url").onclick = () => {
    const u = $("f-url").value.trim();
    if (!/^https?:\/\//i.test(u)) return ($("up-status").textContent = "Enter a full image URL starting with https://");
    formImages.push(u); $("f-url").value = ""; $("up-status").textContent = ""; renderImgs();
  };
}

async function refresh() {
  try { PRODUCTS = await fetchProducts(); $("notice").innerHTML = ""; }
  catch (e) {
    PRODUCTS = [];
    $("notice").innerHTML = `<div class="setup-warn">Could not load products: ${esc(e.message)}<br>Check that Firestore is created and your rules are published (see SETUP.md).</div>`;
  }
  renderStats(); renderRows();
}

function renderStats() {
  const out = PRODUCTS.filter(p => p.stock < 1).length, low = PRODUCTS.filter(p => p.stock > 0 && p.stock <= 5).length;
  $("stats").innerHTML = [["Products", PRODUCTS.length], ["Low stock (5 or fewer)", low], ["Sold out", out]]
    .map(([t, n]) => `<div><b>${n}</b><span>${t}</span></div>`).join("");
}

function renderRows() {
  const q = $("q").value.trim().toLowerCase();
  const list = PRODUCTS.filter(p => !q || p.name.toLowerCase().includes(q));
  if (!PRODUCTS.length) {
    $("rows").innerHTML = `<tr><td colspan="6" class="empty-row">No products yet. Click “Add product”, or
      <button class="link-btn" id="seed">add ${SAMPLE_PRODUCTS.length} sample products</button> to try things out.</td></tr>`;
    $("seed").onclick = seedSamples; return;
  }
  $("rows").innerHTML = list.map(p => `<tr>
    <td>${p.images[0] ? `<img class="th" src="${esc(adminImg(p.images[0], 80, 100))}" alt="">` : '<div class="th"></div>'}</td>
    <td><b>${esc(p.name)}</b>${p.featured ? ' <span class="pill-s">Featured</span>' : ""}</td>
    <td>${esc(catName(p.category))}</td>
    <td>${money(p.price)}${p.mrp > p.price ? ` <s class="muted">${money(p.mrp)}</s>` : ""}</td>
    <td class="${p.stock < 1 ? "bad" : p.stock <= 5 ? "warn" : ""}">${p.stock < 1 ? "Sold out" : p.stock}</td>
    <td class="acts"><button class="link-btn" data-e="${p.id}">Edit</button><button class="link-btn danger" data-d="${p.id}">Delete</button></td></tr>`).join("")
    || '<tr><td colspan="6" class="muted">No products match your search.</td></tr>';
  $("rows").querySelectorAll("[data-e]").forEach(b => b.onclick = () => openForm(PRODUCTS.find(p => p.id === b.dataset.e)));
  $("rows").querySelectorAll("[data-d]").forEach(b => b.onclick = () => removeProduct(b.dataset.d));
}

function openForm(p) {
  editingId = p ? p.id : null;
  $("dlg-title").textContent = p ? "Edit product" : "Add product";
  $("f-name").value = p ? p.name : "";
  $("f-cat").value = p ? p.category : CATEGORIES[0].slug;
  $("f-price").value = p ? p.price : "";
  $("f-mrp").value = p && p.mrp > p.price ? p.mrp : "";
  $("f-stock").value = p ? p.stock : 10;
  $("f-desc").value = p ? p.description || "" : "";
  $("f-hl").value = p ? (p.highlights || []).join("\n") : "";
  $("f-feat").checked = !!(p && p.featured);
  formImages = p ? [...(p.images || [])] : [];
  $("form-err").textContent = ""; $("up-status").textContent = ""; $("save").disabled = false;
  renderImgs(); $("dlg").showModal();
}

function renderImgs() {
  $("imgs").innerHTML = formImages.map((u, i) => `<div class="im"><img src="${esc(adminImg(u, 160, 200))}" alt="Image ${i + 1}">
    ${i === 0 ? '<span class="main-tag">Main</span>' : `<button type="button" class="mk" data-main="${i}">Make main</button>`}
    <button type="button" class="rm" data-rm="${i}" aria-label="Remove image">✕</button></div>`).join("");
  $("imgs").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { formImages.splice(+b.dataset.rm, 1); renderImgs(); });
  $("imgs").querySelectorAll("[data-main]").forEach(b => b.onclick = () => { formImages.unshift(formImages.splice(+b.dataset.main, 1)[0]); renderImgs(); });
}

async function uploadFiles(e) {
  const files = [...e.target.files]; e.target.value = "";
  if (!files.length) return;
  if (CLOUDINARY.cloudName.startsWith("PASTE") || CLOUDINARY.uploadPreset.startsWith("PASTE"))
    return ($("up-status").textContent = "Image upload is not set up. Add your Cloudinary details in js/firebase-config.js, or paste an image URL instead.");
  $("save").disabled = true;
  for (const [i, f] of files.entries()) {
    if (formImages.length >= 6) { $("up-status").textContent = "You can add up to 6 images."; break; }
    if (f.size > 8 * 1024 * 1024) { $("up-status").textContent = `${f.name} is larger than 8 MB.`; continue; }
    $("up-status").textContent = `Uploading ${i + 1} of ${files.length}…`;
    try {
      const fd = new FormData(); fd.append("file", f); fd.append("upload_preset", CLOUDINARY.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error && json.error.message || "Upload failed");
      formImages.push(json.secure_url); renderImgs();
    } catch (er) { $("up-status").textContent = "Upload failed: " + er.message; $("save").disabled = false; return; }
  }
  $("up-status").textContent = ""; $("save").disabled = false;
}

async function saveProduct(e) {
  e.preventDefault();
  const price = Math.round(+$("f-price").value), mrpRaw = Math.round(+$("f-mrp").value || 0), stock = Math.round(+$("f-stock").value);
  const err = m => ($("form-err").textContent = m);
  if (!$("f-name").value.trim()) return err("Enter a product name.");
  if (!(price > 0)) return err("Enter a selling price above 0.");
  if (mrpRaw && mrpRaw < price) return err("Original price must be higher than the selling price, or leave it empty.");
  if (!(stock >= 0)) return err("Stock cannot be negative.");
  const data = {
    storeId: STORE_ID, name: $("f-name").value.trim(), category: $("f-cat").value, price, mrp: mrpRaw || price, stock,
    description: $("f-desc").value.trim(), highlights: $("f-hl").value.split("\n").map(s => s.trim()).filter(Boolean),
    images: formImages, featured: $("f-feat").checked, updatedAt: ts(),
  };
  $("save").disabled = true; err("");
  try {
    if (editingId) await db.collection("products").doc(editingId).update(data);
    else await db.collection("products").add({ ...data, createdAt: ts() });
    $("dlg").close(); toast(editingId ? "Product updated" : "Product added"); await refresh();
  } catch (er) {
    err(er.code === "permission-denied" ? "Permission denied. Your account is not set as the admin in the Firestore rules (see SETUP.md)." : "Could not save: " + er.message);
    $("save").disabled = false;
  }
}

async function removeProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
  try { await db.collection("products").doc(id).delete(); toast("Product deleted"); await refresh(); }
  catch (er) { alert(er.code === "permission-denied" ? "Permission denied. Check the Firestore rules." : "Could not delete: " + er.message); }
}

async function seedSamples() {
  if (!confirm(`Add ${SAMPLE_PRODUCTS.length} sample products?`)) return;
  try {
    const batch = db.batch();
    SAMPLE_PRODUCTS.forEach(p => { const { id, ...rest } = p; batch.set(db.collection("products").doc(id), { ...rest, createdAt: ts(), updatedAt: ts() }); });
    await batch.commit(); toast("Sample products added"); await refresh();
  } catch (er) { alert(er.code === "permission-denied" ? "Permission denied. Check the Firestore rules." : "Could not add: " + er.message); }
}

function toast(msg) {
  let t = $("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2000);
}
