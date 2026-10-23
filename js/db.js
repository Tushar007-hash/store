// Data layer. If Firebase is not configured yet, the site keeps working with the sample products.
let db = null, auth = null;
const firebaseReady = () => typeof firebase !== "undefined" && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith("PASTE");

if (firebaseReady()) {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  if (firebase.auth) auth = firebase.auth();
}

// Throws on error (used by the admin so problems are visible).
async function fetchProducts() {
  const snap = await db.collection("products").where("storeId", "==", STORE_ID).get();
  const t = p => (p.createdAt && p.createdAt.seconds) || 0;
  return snap.docs.map(d => ({ id: d.id, images: [], highlights: [], ...d.data() })).sort((a, b) => t(a) - t(b));
}

// Used by the storefront.
async function loadProducts() {
  if (!firebaseReady()) { PRODUCTS = SAMPLE_PRODUCTS; return; }
  try { PRODUCTS = await fetchProducts(); }
  catch (e) { console.error("Could not load products:", e); PRODUCTS = []; }
}
