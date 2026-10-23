// Cart lives in localStorage, one cart per store.
const CART_KEY = "cart_" + STORE_ID;

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
  if (typeof renderDrawer === "function") renderDrawer();
}
function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || product.stock < 1) return;
  const cart = getCart();
  const line = cart.find(i => i.id === productId);
  if (line) line.qty = Math.min(line.qty + qty, product.stock);
  else cart.push({ id: productId, qty: Math.min(qty, product.stock) });
  saveCart(cart);
}
function setQty(productId, qty) {
  const product = PRODUCTS.find(p => p.id === productId);
  let cart = getCart();
  const line = cart.find(i => i.id === productId);
  if (!line || !product) return;
  line.qty = Math.max(1, Math.min(qty, product.stock));
  saveCart(cart);
}
function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}
function cartCount() { return getCart().reduce((n, i) => n + i.qty, 0); }
function cartTotal() {
  return getCart().reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}
function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (el) { el.textContent = cartCount(); el.hidden = cartCount() === 0; }
}

function pruneCart() {
  const ids = new Set(PRODUCTS.map(p => p.id)), cart = getCart();
  const kept = cart.filter(i => ids.has(i.id));
  if (kept.length !== cart.length) saveCart(kept);
}
