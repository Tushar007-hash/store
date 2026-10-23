const money = n => "₹" + n.toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = id => document.getElementById(id);
const pct = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><rect width="4" height="5" fill="#ebe9e4"/></svg>');
// Product image: uses the stored URL; Cloudinary URLs are resized automatically.
function pimg(p, i, w, h) {
  const u = (p.images || [])[i];
  if (!u) return PLACEHOLDER;
  if (u.includes("res.cloudinary.com") && u.includes("/upload/")) return u.replace("/upload/", `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`);
  return u;
}
const priceHtml = (p, save) => `<strong>${money(p.price)}</strong>` + (pct(p) > 0 ? ` <s>${money(p.mrp)}</s>` + (save ? ` <em>Save ${pct(p)}%</em>` : "") : "");
const catOf = slug => CATEGORIES.find(c => c.slug === slug);
const img = (seed, w = 800, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/* ---------- Layout ---------- */
function renderLayout() {
  $("site-header").innerHTML = `
    <div class="announce" role="region" aria-label="Store announcements" aria-live="polite">
      ${STORE.announcements.map((t, i) => `<p class="slide ${i === 0 ? "on" : ""}">${esc(t)}</p>`).join("")}</div>
    <div class="wrap bar">
      <div class="side"><button class="icon menu-btn" id="menu-btn" aria-label="Menu" aria-expanded="false">Menu</button>
        <button class="icon" id="search-btn" aria-label="Search">Search</button></div>
      <a class="brand" href="index.html">${esc(STORE.name)}</a>
      <div class="side right"><button class="icon" id="cart-btn" aria-label="Open cart">Cart <span id="cart-count" class="badge" hidden>0</span></button></div>
    </div>
    <nav id="nav" class="nav"><div class="wrap">
      ${CATEGORIES.map(c => `<a href="collection.html?c=${c.slug}">${esc(c.name)}</a>`).join("")}
      <a href="collection.html">All products</a>
    </div></nav>
    <form id="search-bar" class="search-bar" action="collection.html" role="search" hidden>
      <div class="wrap"><input name="q" type="search" placeholder="Search our products" aria-label="Search products"><button class="btn">Search</button></div>
    </form>`;
  $("site-footer").innerHTML = `
    <div class="wrap foot">
      <div><h3>${esc(STORE.name)}</h3><p>${esc(STORE.heroText)}</p></div>
      <div><h4>Shop</h4>${CATEGORIES.map(c => `<a href="collection.html?c=${c.slug}">${esc(c.name)}</a>`).join("")}</div>
      <div><h4>Help</h4><a href="#">About us</a><a href="#">Shipping policy</a><a href="#">Refund policy</a><a href="#">Privacy policy</a><a href="#">Terms of service</a></div>
      <div><h4>Contact</h4><p>${esc(STORE.phone)}<br>${esc(STORE.email)}<br>${esc(STORE.hours)}</p></div>
    </div>
    <div class="wrap copy"><span>© ${new Date().getFullYear()} ${esc(STORE.name)}</span><span>UPI &middot; Cards &middot; Net banking &middot; Cash on delivery</span></div>
    <div id="drawer-root"></div>`;
  $("menu-btn").onclick = () => { const o = $("nav").classList.toggle("open"); $("menu-btn").setAttribute("aria-expanded", o); };
  $("search-btn").onclick = () => { const b = $("search-bar"); b.hidden = !b.hidden; if (!b.hidden) b.q.focus(); };
  $("cart-btn").onclick = openDrawer;
  document.addEventListener("click", e => {
    const b = e.target.closest(".quick-add"); if (!b) return;
    addToCart(b.dataset.id, 1); openDrawer();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  renderDrawer(); updateCartCount();
  startAnnouncements();
}

/* ---------- Announcement slideshow ---------- */
function startAnnouncements() {
  const bar = document.querySelector(".announce");
  const slides = [...bar.querySelectorAll(".slide")];
  if (slides.length < 2) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, timer;
  const show = n => {
    slides[i].classList.remove("on"); slides[i].classList.add("out");
    const old = slides[i];
    setTimeout(() => old.classList.remove("out"), 600);
    i = n % slides.length; slides[i].classList.add("on");
  };
  const play = () => { timer = setInterval(() => show(i + 1), (STORE.announceSeconds || 3.5) * 1000); };
  const stop = () => clearInterval(timer);
  if (!reduce) play();
  bar.addEventListener("mouseenter", stop);
  bar.addEventListener("mouseleave", () => { stop(); if (!reduce) play(); });
  document.addEventListener("visibilitychange", () => { stop(); if (!document.hidden && !reduce) play(); });
}

/* ---------- Cart drawer ---------- */
function openDrawer() { $("drawer").classList.add("open"); $("scrim").classList.add("open"); }
function closeDrawer() { $("drawer").classList.remove("open"); $("scrim").classList.remove("open"); }
function renderDrawer() {
  const root = $("drawer-root"); if (!root) return;
  const was = $("drawer") && $("drawer").classList.contains("open");
  const cart = getCart(), total = cartTotal();
  const next = STORE.offers.find(o => total < o.min), top = STORE.offers[STORE.offers.length - 1];
  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id); if (!p) return "";
    return `<div class="line"><img src="${pimg(p, 0, 160, 200)}" alt="${esc(p.name)}">
      <div class="meta"><a href="product.html?id=${p.id}">${esc(p.name)}</a>
        <span class="prices">${priceHtml(p)}</span>
        <div class="qty"><button data-m="${p.id}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-p="${p.id}" aria-label="Increase">+</button></div></div>
      <button class="link" data-rm="${p.id}">Remove</button></div>`;
  }).join("");
  root.innerHTML = `<div id="scrim" class="scrim ${was ? "open" : ""}"></div>
    <aside id="drawer" class="drawer ${was ? "open" : ""}" aria-label="Cart">
      <div class="d-head"><h2>Your cart</h2><button class="icon" id="close-d" aria-label="Close cart">Close</button></div>
      ${cart.length ? `<div class="reward"><p>${next ? `Add ${money(next.min - total)} more to unlock <b>${esc(next.code)}</b>` : "You have unlocked every prepaid offer"}</p>
        <div class="bar-track"><i style="width:${Math.min(100, Math.round(total / top.min * 100))}%"></i></div></div>` : ""}
      <div class="d-body">${lines || '<div class="empty-cart"><p>Your cart is empty.</p><a class="btn" href="collection.html">Continue shopping</a></div>'}
        ${cart.length ? `<ul class="offers">${STORE.offers.map(o =>
          `<li class="${total >= o.min ? "met" : ""}"><b>${total >= o.min ? "✓" : "○"} ${esc(o.code)}</b> ${esc(o.text)}</li>`).join("")}</ul>` : ""}</div>
      ${cart.length ? `<div class="d-foot"><div class="row"><span>Subtotal</span><strong>${money(total)}</strong></div>
        <p class="note">Shipping and discounts are applied at checkout.</p>
        <button class="btn block" id="checkout">Check out</button></div>` : ""}
    </aside>`;
  $("scrim").onclick = closeDrawer; $("close-d").onclick = closeDrawer;
  const qtyOf = id => getCart().find(i => i.id === id).qty;
  root.querySelectorAll("[data-m]").forEach(b => b.onclick = () => setQty(b.dataset.m, qtyOf(b.dataset.m) - 1));
  root.querySelectorAll("[data-p]").forEach(b => b.onclick = () => setQty(b.dataset.p, qtyOf(b.dataset.p) + 1));
  root.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => removeFromCart(b.dataset.rm));
  if ($("checkout")) $("checkout").onclick = () => toast("Checkout is built in Phase 3");
}

function toast(msg) {
  let t = $("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
}

/* ---------- Product card ---------- */
const card = p => `
  <article class="card">
    <a class="thumb" href="product.html?id=${p.id}" tabindex="-1" aria-hidden="true"><img src="${pimg(p, 0, 640, 800)}" alt="" loading="lazy">
      ${p.stock < 1 ? '<span class="tag dark">Sold out</span>' : ""}</a>
    <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
    <p class="prices">${priceHtml(p, true)}</p>
    <button class="quick-add" data-id="${p.id}" ${p.stock < 1 ? "disabled" : ""}>${p.stock < 1 ? "Sold out" : "Add to cart"}</button>
  </article>`;

/* ---------- Home ---------- */
function initHome() {
  const live = CATEGORIES.filter(c => PRODUCTS.some(p => p.category === c.slug));
  const trust = [["Easy returns", "Simple exchange policy"], ["Secure payments", "UPI, cards and COD"], ["Dispatched in 3-5 days", "Across India"], ["Real support", STORE.hours]]
    .map(([t, s]) => `<div><b>${t}</b><span>${esc(s)}</span></div>`).join("");
  const tiles = live.map(c => `<a class="tile" href="collection.html?c=${c.slug}">
      <img src="${img("cat-" + c.slug, 700, 900)}" alt="" loading="lazy">
      <div><h3>${esc(c.name)}</h3><span>${PRODUCTS.filter(p => p.category === c.slug).length} products</span></div></a>`).join("");
  const flagged = PRODUCTS.filter(p => p.featured);
  const featured = (flagged.length ? flagged : PRODUCTS).slice(0, 4);
  const sections = live.map(c => {
    const list = PRODUCTS.filter(p => p.category === c.slug);
    return `<section class="block">
      <div class="block-head"><div><h2>${esc(c.title)}</h2><p class="muted">${esc(c.text)}</p></div>
        <a class="textlink" href="collection.html?c=${c.slug}">View all (${list.length})</a></div>
      <div class="grid">${list.slice(0, 4).map(card).join("")}</div></section>`;
  }).join("");
  const shop = PRODUCTS.length ? `
    <section class="wrap sect" id="categories"><div class="block-head"><h2>Shop by category</h2></div><div class="tiles">${tiles}</div></section>
    <section class="wrap sect"><div class="block-head"><div><h2>Featured this season</h2><p class="muted">A few pieces our customers reach for first.</p></div></div>
      <div class="grid">${featured.map(card).join("")}</div></section>` :
    `<section class="wrap sect" id="categories"><h2>New products are on the way</h2><p class="muted">Please check back shortly.</p></section>`;
  $("home").innerHTML = `
    <section class="hero">
      <div class="hero-copy"><h1>${esc(STORE.heroTitle)}</h1><p>${esc(STORE.heroText)}</p>
        <div class="hero-cta"><a class="btn" href="collection.html">Shop the collection</a><a class="textlink" href="#categories">Browse categories</a></div></div>
      <div class="hero-img"><img src="images/hero.jpg" alt=""></div>
    </section>
    <section class="wrap"><div class="trust">${trust}</div></section>
    ${shop}
    <section class="promise"><div class="wrap"><h2>Made to earn its place in your home</h2>
      <div class="p-grid">${STORE.promise.map(([t, s]) => `<div><h3>${esc(t)}</h3><p>${esc(s)}</p></div>`).join("")}</div></div></section>
    <div class="wrap">${sections}</div>`;
}

/* ---------- Collection / search ---------- */
function initCollection() {
  const params = new URLSearchParams(location.search);
  const c = catOf(params.get("c")), q = (params.get("q") || "").trim().toLowerCase();
  const list = PRODUCTS.filter(p => (!c || p.category === c.slug) && (!q || p.name.toLowerCase().includes(q)));
  const title = c ? c.name : q ? `Results for “${params.get("q")}”` : "All products";
  document.title = title + " - " + STORE.name;
  $("c-title").textContent = title;
  $("c-count").textContent = list.length + " product" + (list.length === 1 ? "" : "s");
  $("pills").innerHTML = [`<a class="pill ${!c ? "on" : ""}" href="collection.html">All</a>`,
    ...CATEGORIES.map(x => `<a class="pill ${c && c.slug === x.slug ? "on" : ""}" href="collection.html?c=${x.slug}">${esc(x.name)}</a>`)].join("");
  const draw = () => {
    const l = [...list], v = $("sort").value;
    if (v === "low") l.sort((a, b) => a.price - b.price);
    if (v === "high") l.sort((a, b) => b.price - a.price);
    if (v === "off") l.sort((a, b) => pct(b) - pct(a));
    $("grid").innerHTML = l.map(card).join("") || '<p class="muted">No products found. <a href="collection.html">See all products</a></p>';
  };
  $("sort").onchange = draw; draw();
}

/* ---------- Product ---------- */
function initProduct() {
  const p = PRODUCTS.find(x => x.id === new URLSearchParams(location.search).get("id"));
  const root = $("product");
  if (!p) { root.innerHTML = '<p class="muted">Product not found. <a href="index.html">Back to the store</a></p>'; return; }
  document.title = p.name + " - " + STORE.name;
  const inStock = p.stock > 0, c = catOf(p.category);
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const imgs = p.images && p.images.length ? p.images : [""];
  const big = i => pimg({ images: imgs }, i, 1000, 1250);
  root.innerHTML = `
    <div class="gallery">
      <div class="thumbs">${imgs.length > 1 ? imgs.map((s, i) => `<button class="t ${i ? "" : "on"}" data-src="${big(i)}" aria-label="Show image ${i + 1}"><img src="${pimg({ images: imgs }, i, 160, 200)}" alt=""></button>`).join("") : ""}</div>
      <div class="main"><img id="main-img" src="${big(0)}" alt="${esc(p.name)}"></div></div>
    <div class="info">
      <p class="crumb"><a href="index.html">Home</a> / <a href="collection.html?c=${c.slug}">${esc(c.name)}</a></p>
      <h1>${esc(p.name)}</h1>
      <div class="price-box"><span class="now">${money(p.price)}</span>${pct(p) ? `<s>${money(p.mrp)}</s><span class="save">Save ${pct(p)}%</span>` : ""}</div>
      <p class="tax">Inclusive of all taxes. Shipping calculated at checkout.</p>
      <p class="stock ${inStock ? "ok" : "out"}">${inStock ? (p.stock <= 5 ? `Only ${p.stock} left in stock` : "In stock") : "Sold out"}</p>
      ${inStock ? `<div class="buy"><div class="qty"><button id="minus" aria-label="Decrease">−</button><span id="q">1</span><button id="plus" aria-label="Increase">+</button></div>
        <button class="btn" id="add">Add to cart</button></div>` : ""}
      <ul class="perks"><li>Extra 10% off when you pay online</li><li>Cash on delivery available</li><li>Dispatched in 3-5 working days</li></ul>
      ${p.description ? `<details open><summary>Description</summary><p>${esc(p.description)}</p></details>` : ""}
      ${(p.highlights || []).length ? `<details><summary>Highlights</summary><ul>${p.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul></details>` : ""}
      <details><summary>Shipping and returns</summary><p>Orders are dispatched within 3-5 working days. If something is not right, contact us and we will arrange an exchange or refund as per our refund policy.</p></details>
      <details><summary>Customer reviews</summary><p class="muted">Reviews arrive in Phase 4.</p></details>
    </div>`;
  $("related").innerHTML = related.length ? `<h2>You may also like</h2><div class="grid">${related.map(card).join("")}</div>` : "";
  document.querySelectorAll(".t").forEach(b => b.onclick = () => {
    $("main-img").src = b.dataset.src;
    document.querySelectorAll(".t").forEach(x => x.classList.toggle("on", x === b));
  });
  if (inStock) {
    let q = 1;
    $("minus").onclick = () => { q = Math.max(1, q - 1); $("q").textContent = q; };
    $("plus").onclick = () => { q = Math.min(p.stock, q + 1); $("q").textContent = q; };
    $("add").onclick = () => { addToCart(p.id, q); openDrawer(); };
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  pruneCart();
  renderLayout();
  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "collection") initCollection();
  if (page === "product") initProduct();
});
