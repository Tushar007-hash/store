// Phase 1: hardcoded data. In Phase 2 this moves to Firestore.
// Every product carries a storeId so Phase 6 (multi-store) needs no rewrite.
const STORE_ID = "store-1";

const STORE = {
  id: STORE_ID,
  name: "Kartzy",
  announcements: [ // top bar: each line shows for a few seconds, then slides to the next
    "🏷️ Up to 44% OFF on selected products",
    "Cash on Delivery Available",
    "↩️ Easy returns on your orders",
  ],
  announceSeconds: 3.5,
  heroTitle: "Considered essentials for everyday living",
  heroText: "Thoughtfully chosen products for your home, kitchen and car. Useful, well made and fairly priced.",
  phone: "+91 8988690544",
  email: "Kartzy.business@gmail.com",
  hours: "24/7",
  promise: [
    ["Honest pricing", "Clear prices with no hidden charges at checkout."],
    ["Easy returns", "Simple exchange and refund policy if something is not right."],
    ["Secure checkout", "Pay by UPI, card or net banking, or choose cash on delivery."],
  ],
  offers: [ // shown in the cart drawer
    { code: "Prepaid29", text: "Get ₹29 off on orders of ₹499 or more.", min: 499 },
    { code: "Prepaid100", text: "Get ₹100 off on orders of ₹1000 or more.", min: 1000 },
  ],
};

const CATEGORIES = [
  { slug: "organizers", name: "Organizers", kicker: "Smart storage picks", title: "Organizer Picks Worth Exploring",
    text: "Storage solutions that reduce clutter and make everyday spaces easier to manage.", quote: "A better organized home starts with giving everything the right place." },
  { slug: "kitchen", name: "Kitchen Tools", kicker: "Kitchen favourites", title: "Clever Tools for Everyday Kitchens",
    text: "Useful finds that make preparation, cooking, storage and cleaning simpler.", quote: "Small kitchen upgrades can make everyday routines noticeably easier." },
  { slug: "cleaning", name: "Cleaning Essentials", kicker: "Cleaning made simple", title: "Everyday Cleaning, Made Easier",
    text: "Practical tools for daily mess and difficult corners.", quote: "The right cleaning tools save effort every time you use them." },
  { slug: "home", name: "Home Essentials", kicker: "Everyday home upgrades", title: "Small Upgrades. Everyday Difference.",
    text: "Household products that make routines more convenient and comfortable.", quote: "The products you use every day should make routines easier." },
  { slug: "car", name: "Car Accessories", kicker: "Smarter car essentials", title: "Upgrade Your Everyday Drive",
    text: "Accessories for a cleaner, more organized and more convenient drive.", quote: "A more organized car can make everyday driving feel easier." },
  { slug: "bathroom", name: "Bathroom Mats", kicker: "Bathroom comfort", title: "Comfort Starts Under Your Feet",
    text: "Bathroom mats that add everyday comfort and a cleaner finishing touch.", quote: "Comfort often comes from the small details you use every day." },
];

// [name, price, mrp, stock]
const RAW = {
  organizers: [["Folding Wardrobe Organizer", 699, 1299, 15], ["Self-Adhesive Bathroom Corner Shelf", 699, 999, 20], ["Adjustable Over-The-Door Hanger", 599, 899, 12],
    ["Mini Cabinet Drawer Organizer", 789, 1199, 9], ["Round Hook Hanger for Wardrobe", 589, 799, 30], ["Makeup Brush Holder", 699, 999, 0]],
  kitchen: [["Corner Sink Filter Strainer", 699, 999, 18], ["Silicone Dish Drying Mat", 699, 1099, 25], ["Peeler with Peel Storage Container", 699, 999, 14],
    ["Airtight Food Storage Container", 899, 1399, 40], ["Reusable Elastic Food Covers", 589, 799, 3], ["9-in-1 Vegetable Cutter with Basket", 899, 1499, 10]],
  cleaning: [["Microfiber Kitchen Towel Roll", 699, 999, 22], ["Extendable Fan Blade Duster", 899, 1299, 11], ["Extendable Gap Cleaning Duster", 699, 999, 16],
    ["Oven & Cookware Cleaning Paste", 399, 699, 35], ["Gap Cleaning Brush", 399, 599, 28], ["Window Track Cleaning Brush (Pack of 3)", 399, 699, 19]],
  home: [["Waterproof Sealant Glue", 699, 999, 17], ["Snap Button Kit", 699, 1199, 13], ["Money Savings Box", 799, 1299, 8],
    ["Zipper Repair Kit", 699, 999, 21], ["Foldable Shoe Storage Box", 899, 1299, 6], ["Door Hanging Hook", 899, 1199, 24]],
  car: [["Car Dashboard Showpiece", 799, 1299, 9], ["Bumper Guard (Black)", 799, 1499, 12], ["Dashboard Decor Set (3 pc)", 799, 1199, 15],
    ["Car Cleaning Duster", 599, 999, 20], ["Alloy Wheel Car Freshener", 899, 1499, 7], ["Dashboard Ornament", 799, 999, 5]],
  bathroom: [["Round Non-Slip Bath Mat", 799, 1299, 14], ["Anti-Skid Bath Mat", 499, 999, 26], ["Super Absorbent Bathroom Mat", 699, 1099, 18]],
};

// Sample products: used when Firebase is not set up yet, and as the "Add sample products" seed in the admin.
const SAMPLE_PRODUCTS = Object.entries(RAW).flatMap(([cat, list]) => list.map(([name, price, mrp, stock], i) => {
  const id = cat.slice(0, 3) + "-" + (i + 1);
  return { id, storeId: STORE_ID, name, price, mrp, stock, category: cat, featured: ["org-1", "kit-1", "cle-1", "bat-1"].includes(id),
    description: "A practical everyday product. Replace this text with your own description from the admin panel in Phase 2.",
    highlights: ["Easy to use and easy to clean", "Durable everyday build", "Ships in 3-5 working days"],
    images: [1, 2, 3].map(n => `https://picsum.photos/seed/${id}-${n}/800/800`) };
}));

// Live products (loaded from Firestore by db.js, or the samples above when Firebase is not configured)
let PRODUCTS = SAMPLE_PRODUCTS;
