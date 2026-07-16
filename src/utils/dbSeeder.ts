import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SEED_PRODUCTS = [
  // ── COFFEE BEANS ──────────────────────────────────────────────────────────
  {
    id: 'ethiopian-yirgacheffe',
    name: 'Ethiopia Yirgacheffe',
    description: 'Bright, floral cup with delicate notes of jasmine, lemon blossom, and sweet black tea.',
    fullDescription: "Sourced from the Gedeo Zone in southern Ethiopia, this Yirgacheffe is washed and sun-dried on raised beds at 1,800–2,200 m above sea level. The result is a transparently clean cup that showcases the terroir of one of the world's most celebrated coffee regions.",
    price: 350000,
    priceUsd: 3.90,
    priceLbp: 350000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'],
    stock: 45,
    sku: 'BEANS-ETH-250',
    tags: ['single-origin', 'light-roast', 'africa'],
    isSubscriptionEligible: true,
    rating: 4.8,
    reviewCount: 24,
    isFeatured: true,
    wholesalePriceUsd: 3.20,
    wholesalePriceLbp: 280000,
    variants: [
      { id: '250g', name: '250g Bag', price: 350000, priceUsd: 3.90, priceLbp: 350000, stock: 45, sku: 'BEANS-ETH-250' },
      { id: '1kg', name: '1kg Bag', price: 1300000, priceUsd: 14.50, priceLbp: 1300000, stock: 20, sku: 'BEANS-ETH-1000' }
    ]
  },
  {
    id: 'colombian-supremo',
    name: 'Colombia Supremo',
    description: 'Medium-bodied roast with rich notes of caramel, dark chocolate, and a clean cherry finish.',
    fullDescription: 'Colombian Supremo is graded as the largest screen-size bean from Colombia. Grown in the Huila and Antioquia regions at 1,400–2,000 m, this washed lot is roasted to a medium profile that preserves its natural sweetness while developing body and complexity.',
    price: 320000,
    priceUsd: 3.50,
    priceLbp: 320000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800'],
    stock: 60,
    sku: 'BEANS-COL-250',
    tags: ['single-origin', 'medium-roast', 'americas'],
    isSubscriptionEligible: true,
    rating: 4.6,
    reviewCount: 18,
    isFeatured: false,
    wholesalePriceUsd: 2.90,
    wholesalePriceLbp: 260000,
    variants: [
      { id: '250g', name: '250g Bag', price: 320000, priceUsd: 3.50, priceLbp: 320000, stock: 60, sku: 'BEANS-COL-250' },
      { id: '1kg', name: '1kg Bag', price: 1200000, priceUsd: 13.40, priceLbp: 1200000, stock: 15, sku: 'BEANS-COL-1000' }
    ]
  },
  {
    id: 'barista-espresso-blend',
    name: 'Barista House Blend',
    description: 'Bold espresso blend crafted for perfect milk integration. Rich cocoa and toasted hazelnut profile.',
    fullDescription: 'Our house espresso blend combines 60% Brazilian Santos with 40% Guatemalan Antigua. Roasted to a dark profile just short of second crack, it pulls a dense, syrupy shot with a long-lasting crema ideal for lattes and cappuccinos.',
    price: 290000,
    priceUsd: 3.20,
    priceLbp: 290000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800'],
    stock: 80,
    sku: 'BEANS-HOU-250',
    tags: ['blend', 'dark-roast'],
    isSubscriptionEligible: true,
    rating: 4.7,
    reviewCount: 32,
    isFeatured: true,
    wholesalePriceUsd: 2.60,
    wholesalePriceLbp: 230000,
    variants: [
      { id: '250g', name: '250g Bag', price: 290000, priceUsd: 3.20, priceLbp: 290000, stock: 80, sku: 'BEANS-HOU-250' },
      { id: '1kg', name: '1kg Bag', price: 1100000, priceUsd: 12.30, priceLbp: 1100000, stock: 30, sku: 'BEANS-HOU-1000' }
    ]
  },
  {
    id: 'kenya-aa-peaberry',
    name: 'Kenya AA Peaberry',
    description: 'Intensely fruit-forward with blackcurrant, tomato, and a wine-like finish. Kenyan excellence.',
    fullDescription: 'Peaberry beans are a natural mutation where only one seed develops inside the cherry, concentrating all the nutrients. This AA-grade lot from the Nyeri region is fully washed and whole-bean dried, resulting in a complex, vibrant cup with distinctive Kenyan character.',
    price: 420000,
    priceUsd: 4.70,
    priceLbp: 420000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800'],
    stock: 30,
    sku: 'BEANS-KEN-250',
    tags: ['single-origin', 'light-roast', 'africa', 'peaberry'],
    isSubscriptionEligible: true,
    rating: 4.9,
    reviewCount: 11,
    isFeatured: true,
    wholesalePriceUsd: 3.90,
    wholesalePriceLbp: 350000,
    variants: [
      { id: '250g', name: '250g Bag', price: 420000, priceUsd: 4.70, priceLbp: 420000, stock: 30, sku: 'BEANS-KEN-250' },
    ]
  },
  {
    id: 'guatemala-antigua-honey',
    name: 'Guatemala Antigua Honey',
    description: 'Honey-processed Guatemalan with stone fruit, brown sugar, and mild floral undertones.',
    fullDescription: 'Grown at 1,500 m on volcanic soils near Antigua, this honey-processed lot retains much of the fruit mucilage during drying. The result is a sweet, complex bean with more body than a washed lot but more clarity than a natural — a perfect middle-ground coffee.',
    price: 380000,
    priceUsd: 4.20,
    priceLbp: 380000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800'],
    stock: 35,
    sku: 'BEANS-GUA-250',
    tags: ['single-origin', 'medium-roast', 'honey-process'],
    isSubscriptionEligible: true,
    rating: 4.7,
    reviewCount: 9,
    isFeatured: false,
    wholesalePriceUsd: 3.50,
    wholesalePriceLbp: 310000,
    variants: [
      { id: '250g', name: '250g Bag', price: 380000, priceUsd: 4.20, priceLbp: 380000, stock: 35, sku: 'BEANS-GUA-250' },
      { id: '1kg', name: '1kg Bag', price: 1400000, priceUsd: 15.60, priceLbp: 1400000, stock: 10, sku: 'BEANS-GUA-1000' }
    ]
  },
  {
    id: 'sumatra-mandheling',
    name: 'Sumatra Mandheling Dark',
    description: 'Heavy-bodied, earthy Sumatran with notes of dark chocolate, cedar, and low acidity.',
    fullDescription: 'Processed using the wet-hulled "Giling Basah" method unique to Indonesia, this Mandheling from North Sumatra develops a uniquely heavy body, complex earthiness, and a characteristically low acidity. An ideal choice for dark roast enthusiasts.',
    price: 310000,
    priceUsd: 3.45,
    priceLbp: 310000,
    category: 'Coffee Beans',
    images: ['https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800'],
    stock: 40,
    sku: 'BEANS-SUM-250',
    tags: ['single-origin', 'dark-roast', 'asia', 'low-acid'],
    isSubscriptionEligible: true,
    rating: 4.5,
    reviewCount: 21,
    isFeatured: false,
    wholesalePriceUsd: 2.80,
    wholesalePriceLbp: 250000,
    variants: [
      { id: '250g', name: '250g Bag', price: 310000, priceUsd: 3.45, priceLbp: 310000, stock: 40, sku: 'BEANS-SUM-250' },
      { id: '1kg', name: '1kg Bag', price: 1150000, priceUsd: 12.80, priceLbp: 1150000, stock: 15, sku: 'BEANS-SUM-1000' }
    ]
  },

  // ── GROUND COFFEE ─────────────────────────────────────────────────────────
  {
    id: 'morning-ritual-ground',
    name: 'Morning Ritual Ground',
    description: 'Expertly ground Colombian blend for drip machines and French press. Smooth, balanced, satisfying.',
    fullDescription: 'Pre-ground to a medium coarseness ideal for drip coffee makers and French press. Sealed in a nitrogen-flushed bag with a one-way valve to preserve peak freshness for up to 6 months.',
    price: 270000,
    priceUsd: 3.00,
    priceLbp: 270000,
    category: 'Ground Coffee',
    images: ['https://images.unsplash.com/photo-1606937295736-5b8d2a97deb1?auto=format&fit=crop&q=80&w=800'],
    stock: 55,
    sku: 'GRD-MOR-250',
    tags: ['ground', 'medium-roast', 'drip'],
    isSubscriptionEligible: true,
    rating: 4.5,
    reviewCount: 28,
    isFeatured: false,
    wholesalePriceUsd: 2.40,
    wholesalePriceLbp: 215000,
    variants: [
      { id: '250g', name: '250g Pack', price: 270000, priceUsd: 3.00, priceLbp: 270000, stock: 55, sku: 'GRD-MOR-250' },
      { id: '500g', name: '500g Pack', price: 500000, priceUsd: 5.60, priceLbp: 500000, stock: 20, sku: 'GRD-MOR-500' }
    ]
  },
  {
    id: 'espresso-fine-ground',
    name: 'Espresso Fine Ground',
    description: 'Fine-ground espresso blend for moka pots and espresso machines. Intense and aromatic.',
    price: 295000,
    priceUsd: 3.30,
    priceLbp: 295000,
    category: 'Ground Coffee',
    images: ['https://images.unsplash.com/photo-1544787210-2213d84ad964?auto=format&fit=crop&q=80&w=800'],
    stock: 50,
    sku: 'GRD-ESP-250',
    tags: ['ground', 'dark-roast', 'espresso'],
    isSubscriptionEligible: true,
    rating: 4.6,
    reviewCount: 19,
    isFeatured: false,
    wholesalePriceUsd: 2.65,
    wholesalePriceLbp: 237000,
    variants: [
      { id: '250g', name: '250g Pack', price: 295000, priceUsd: 3.30, priceLbp: 295000, stock: 50, sku: 'GRD-ESP-250' }
    ]
  },

  // ── CAPSULES ───────────────────────────────────────────────────────────────
  {
    id: 'signature-nespresso-capsules',
    name: 'Signature Nespresso Capsules',
    description: '10-pack of 100% Arabica biodegradable pods. Sweet espresso with smooth caramel undertones.',
    price: 180000,
    priceUsd: 2.00,
    priceLbp: 180000,
    category: 'Capsules',
    images: ['https://images.unsplash.com/photo-1521302080487-3c5e29734232?auto=format&fit=crop&q=80&w=800'],
    stock: 150,
    sku: 'CAP-SIG-10',
    tags: ['capsules', 'convenience', 'nespresso'],
    isSubscriptionEligible: true,
    rating: 4.5,
    reviewCount: 12,
    isFeatured: false,
    wholesalePriceUsd: 1.60,
    wholesalePriceLbp: 140000
  },
  {
    id: 'dark-roast-capsules',
    name: 'Intense Dark Roast Capsules',
    description: '10-pack of bold, dark-roasted Nespresso-compatible pods. Smoky body with bittersweet chocolate.',
    price: 195000,
    priceUsd: 2.20,
    priceLbp: 195000,
    category: 'Capsules',
    images: ['https://images.unsplash.com/photo-1544787210-2213d84ad964?auto=format&fit=crop&q=80&w=800'],
    stock: 120,
    sku: 'CAP-DRK-10',
    tags: ['capsules', 'dark-roast', 'nespresso'],
    isSubscriptionEligible: true,
    rating: 4.4,
    reviewCount: 17,
    isFeatured: false,
    wholesalePriceUsd: 1.75,
    wholesalePriceLbp: 156000
  },
  {
    id: 'decaf-capsules',
    name: 'Decaf Sunrise Capsules',
    description: 'Swiss Water Process decaf in 10 biodegradable pods. All the flavor, none of the caffeine.',
    price: 200000,
    priceUsd: 2.25,
    priceLbp: 200000,
    category: 'Capsules',
    images: ['https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=800'],
    stock: 80,
    sku: 'CAP-DEC-10',
    tags: ['capsules', 'decaf'],
    isSubscriptionEligible: true,
    rating: 4.3,
    reviewCount: 8,
    isFeatured: false,
    wholesalePriceUsd: 1.80,
    wholesalePriceLbp: 160000
  },

  // ── DRIP BAGS ─────────────────────────────────────────────────────────────
  {
    id: 'ethiopia-drip-bags',
    name: 'Ethiopia Yirgacheffe Drip Bags',
    description: 'Single-serve drip bags — just add hot water for a perfect pour-over anywhere, anytime.',
    price: 150000,
    priceUsd: 1.68,
    priceLbp: 150000,
    category: 'Drip Bags',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'],
    stock: 100,
    sku: 'DRIP-ETH-5',
    tags: ['drip-bags', 'single-origin', 'convenience'],
    isSubscriptionEligible: true,
    rating: 4.7,
    reviewCount: 14,
    isFeatured: false,
    wholesalePriceUsd: 1.30,
    wholesalePriceLbp: 115000,
    variants: [
      { id: '5pack', name: '5-Pack', price: 150000, priceUsd: 1.68, priceLbp: 150000, stock: 100, sku: 'DRIP-ETH-5' },
      { id: '10pack', name: '10-Pack', price: 280000, priceUsd: 3.10, priceLbp: 280000, stock: 60, sku: 'DRIP-ETH-10' }
    ]
  },
  {
    id: 'colombia-drip-bags',
    name: 'Colombia Supremo Drip Bags',
    description: 'Portable Colombian drip bags — cafe-quality coffee on the go, fresh every time.',
    price: 140000,
    priceUsd: 1.55,
    priceLbp: 140000,
    category: 'Drip Bags',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800'],
    stock: 90,
    sku: 'DRIP-COL-5',
    tags: ['drip-bags', 'medium-roast'],
    isSubscriptionEligible: true,
    rating: 4.5,
    reviewCount: 10,
    isFeatured: false,
    wholesalePriceUsd: 1.20,
    wholesalePriceLbp: 107000,
    variants: [
      { id: '5pack', name: '5-Pack', price: 140000, priceUsd: 1.55, priceLbp: 140000, stock: 90, sku: 'DRIP-COL-5' }
    ]
  },

  // ── GIFT BOXES ─────────────────────────────────────────────────────────────
  {
    id: 'discovery-gift-box',
    name: 'Discovery Gift Box',
    description: 'The perfect introduction: three 100g bags of our top single-origins with tasting notes card.',
    price: 750000,
    priceUsd: 8.40,
    priceLbp: 750000,
    category: 'Gift Boxes',
    images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    sku: 'GIFT-DIS-01',
    tags: ['gift', 'curated', 'sampler'],
    isSubscriptionEligible: false,
    rating: 4.9,
    reviewCount: 7,
    isFeatured: true,
    wholesalePriceUsd: 7.00,
    wholesalePriceLbp: 620000
  },
  {
    id: 'barista-starter-kit',
    name: 'Barista Starter Kit',
    description: 'Everything a home barista needs: 250g house blend, V60 paper filters, a gooseneck kettle guide.',
    price: 1200000,
    priceUsd: 13.40,
    priceLbp: 1200000,
    category: 'Gift Boxes',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    sku: 'GIFT-BAR-01',
    tags: ['gift', 'starter', 'equipment'],
    isSubscriptionEligible: false,
    rating: 4.8,
    reviewCount: 5,
    isFeatured: true,
    wholesalePriceUsd: 11.00,
    wholesalePriceLbp: 975000
  },
  {
    id: 'luxury-ritual-box',
    name: 'Luxury Ritual Box',
    description: 'An ultra-premium set: Kenya AA Peaberry, hand-painted ceramic mug, and silk tasting journal.',
    price: 2500000,
    priceUsd: 27.90,
    priceLbp: 2500000,
    category: 'Gift Boxes',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800'],
    stock: 8,
    sku: 'GIFT-LUX-01',
    tags: ['gift', 'luxury', 'premium'],
    isSubscriptionEligible: false,
    rating: 5.0,
    reviewCount: 3,
    isFeatured: true,
    wholesalePriceUsd: 23.50,
    wholesalePriceLbp: 2100000
  },

  // ── BREWING EQUIPMENT ─────────────────────────────────────────────────────
  {
    id: 'precision-brewer-hario-v60',
    name: 'Hario V60 Ceramic Dripper',
    description: 'The standard pour-over extraction vessel. Crafted in Japan from high-quality Arita-yaki porcelain.',
    price: 420000,
    priceUsd: 4.70,
    priceLbp: 420000,
    category: 'Brewing Equipment',
    images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    sku: 'EQP-V60-CR',
    tags: ['equipment', 'dripper', 'pour-over'],
    isSubscriptionEligible: false,
    rating: 4.9,
    reviewCount: 15,
    isFeatured: false
  },
  {
    id: 'french-press-large',
    name: 'Classic French Press 1L',
    description: 'Heavy-duty borosilicate glass French press. Produces a rich, full-bodied brew in 4 minutes.',
    price: 650000,
    priceUsd: 7.25,
    priceLbp: 650000,
    category: 'Brewing Equipment',
    images: ['https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    sku: 'EQP-FP-1L',
    tags: ['equipment', 'french-press'],
    isSubscriptionEligible: false,
    rating: 4.7,
    reviewCount: 22,
    isFeatured: false
  },
  {
    id: 'moka-pot-stainless',
    name: 'Stainless Moka Pot 6-Cup',
    description: 'Italian-style stovetop espresso maker. Produces concentrated, flavorful coffee without a machine.',
    price: 480000,
    priceUsd: 5.35,
    priceLbp: 480000,
    category: 'Brewing Equipment',
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    sku: 'EQP-MKP-6',
    tags: ['equipment', 'moka-pot', 'stovetop'],
    isSubscriptionEligible: false,
    rating: 4.6,
    reviewCount: 13,
    isFeatured: false
  },
  {
    id: 'aeropress-coffee-maker',
    name: 'AeroPress Coffee Maker',
    description: 'Fast, versatile, and portable. Brews full-bodied espresso-style coffee or smooth cold brew.',
    price: 850000,
    priceUsd: 9.50,
    priceLbp: 850000,
    category: 'Brewing Equipment',
    images: ['https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=800'],
    stock: 18,
    sku: 'EQP-ARP-01',
    tags: ['equipment', 'aeropress', 'portable'],
    isSubscriptionEligible: false,
    rating: 4.8,
    reviewCount: 19,
    isFeatured: true
  },

  // ── ACCESSORIES ────────────────────────────────────────────────────────────
  {
    id: 'precision-brew-ratio-scale',
    name: 'Precision Brew Ratio Scale',
    description: 'High-accuracy digital coffee scale with built-in timer, auto-start, and real-time flow rate logging.',
    price: 750000,
    priceUsd: 8.30,
    priceLbp: 750000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    sku: 'ACC-SCL-01',
    tags: ['equipment', 'scale', 'accessories'],
    isSubscriptionEligible: false,
    rating: 4.9,
    reviewCount: 8,
    isFeatured: true
  },
  {
    id: 'goose-neck-kettle',
    name: 'Gooseneck Pour-Over Kettle',
    description: 'Variable-temperature gooseneck kettle with 0.7L capacity. Precise control for perfect extraction.',
    price: 1100000,
    priceUsd: 12.30,
    priceLbp: 1100000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800'],
    stock: 12,
    sku: 'ACC-KTL-01',
    tags: ['equipment', 'kettle', 'pour-over'],
    isSubscriptionEligible: false,
    rating: 4.8,
    reviewCount: 11,
    isFeatured: false
  },
  {
    id: 'ceramic-handgrip-mug',
    name: 'Artisan Ceramic Coffee Mug',
    description: 'Hand-thrown ceramic mug in warm espresso glaze. Holds 300 ml — the perfect ritual vessel.',
    price: 280000,
    priceUsd: 3.10,
    priceLbp: 280000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1510932742089-6f0a36f0de18?auto=format&fit=crop&q=80&w=800'],
    stock: 30,
    sku: 'ACC-MUG-CR',
    tags: ['mug', 'ceramic', 'accessories'],
    isSubscriptionEligible: false,
    rating: 4.7,
    reviewCount: 16,
    isFeatured: false
  },
  {
    id: 'coffee-grinder-hand',
    name: 'Manual Ceramic Burr Grinder',
    description: 'Premium hand grinder with 18-step ceramic burr adjustment. Grind fresh beans anytime, anywhere.',
    price: 920000,
    priceUsd: 10.30,
    priceLbp: 920000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1454944338482-a69bb95894af?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    sku: 'ACC-GRD-MN',
    tags: ['grinder', 'manual', 'accessories'],
    isSubscriptionEligible: false,
    rating: 4.8,
    reviewCount: 14,
    isFeatured: true
  },
  {
    id: 'cold-brew-mason-jar',
    name: 'Cold Brew Mason Jar System',
    description: '1L mason jar with stainless mesh filter for effortless 12-hour cold brew concentrate.',
    price: 340000,
    priceUsd: 3.80,
    priceLbp: 340000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800'],
    stock: 22,
    sku: 'ACC-CBD-1L',
    tags: ['cold-brew', 'accessories'],
    isSubscriptionEligible: false,
    rating: 4.6,
    reviewCount: 9,
    isFeatured: false
  },
  {
    id: 'v60-filter-papers',
    name: 'Hario V60 Filter Papers (100pk)',
    description: 'Oxygen-bleached paper filters for V60 size 02. Tasteless, odorless — pure coffee clarity.',
    price: 80000,
    priceUsd: 0.90,
    priceLbp: 80000,
    category: 'Accessories',
    images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800'],
    stock: 100,
    sku: 'ACC-FLT-V60',
    tags: ['filters', 'pour-over', 'accessories'],
    isSubscriptionEligible: false,
    rating: 4.5,
    reviewCount: 27,
    isFeatured: false
  }
];

const SEED_PLANS = [
  {
    id: 'starter-pack',
    name: 'Starter',
    displayName: 'Starter Pack',
    description: 'The easiest way to begin your coffee journey. A small, curated selection delivered biweekly.',
    price: 1200000,
    priceUsd: 13.40,
    priceLbp: 1200000,
    features: [
      '2 × 250g Bags per delivery',
      'Curated roast variety',
      'Biweekly delivery',
      'Priority customer support'
    ],
    productIds: ['ethiopian-yirgacheffe', 'colombian-supremo'],
    frequency: 'biweekly',
    minDeliveries: 2,
    isFeatured: false,
    isRecommended: false,
    isCustomizable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'explorer-plan',
    name: 'Explorer',
    displayName: 'Explorer Plan',
    description: 'For the curious coffee adventurer. Discover rotating single-origins from across the world.',
    price: 2500000,
    priceUsd: 27.90,
    priceLbp: 2500000,
    features: [
      '3 × 250g Single-Origin Bags',
      'Tasting notes & brew guide',
      'Weekly delivery',
      'Free shipping on every order'
    ],
    productIds: ['ethiopian-yirgacheffe', 'kenya-aa-peaberry', 'guatemala-antigua-honey'],
    isFeatured: false,
    isRecommended: true,
    frequency: 'weekly',
    minDeliveries: 3,
    isCustomizable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'premium-suite',
    name: 'Premium',
    displayName: 'Premium Suite',
    description: 'Our most popular plan for dedicated home baristas. Maximum freshness, maximum variety.',
    price: 4500000,
    priceUsd: 50.28,
    priceLbp: 4500000,
    features: [
      '4 × 250g Premium Bags + Capsule Pack',
      'Access to limited small-batch drops',
      'Weekly delivery',
      'Dedicated personal concierge',
      'Free premium brewing accessories'
    ],
    productIds: ['ethiopian-yirgacheffe', 'kenya-aa-peaberry', 'barista-espresso-blend', 'signature-nespresso-capsules'],
    isFeatured: true,
    isRecommended: false,
    frequency: 'weekly',
    minDeliveries: 4,
    isCustomizable: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'family-plan',
    name: 'Family',
    displayName: 'Family Plan',
    description: 'Coffee for the whole household. Large format bags, variety for every taste, delivered weekly.',
    price: 3200000,
    priceUsd: 35.70,
    priceLbp: 3200000,
    features: [
      '2 × 1kg Bags (mixed roasts)',
      'Ground + Whole Bean options',
      'Weekly delivery',
      'Family-size discount applied',
      'Free delivery always'
    ],
    productIds: ['colombian-supremo', 'barista-espresso-blend'],
    isFeatured: false,
    isRecommended: false,
    frequency: 'weekly',
    minDeliveries: 2,
    isCustomizable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'office-plan',
    name: 'Office',
    displayName: 'Office Plan',
    description: 'Keep your team energized. Bulk beans and capsules delivered to your office every week.',
    price: 7500000,
    priceUsd: 83.75,
    priceLbp: 7500000,
    features: [
      '4 × 1kg Bags + 40 Capsules',
      'Mixed roast profiles for all tastes',
      'Weekly delivery to your office',
      'Dedicated account manager',
      'Custom branded packaging available'
    ],
    productIds: ['barista-espresso-blend', 'colombian-supremo', 'signature-nespresso-capsules', 'dark-roast-capsules'],
    isFeatured: false,
    isRecommended: false,
    frequency: 'weekly',
    minDeliveries: 1,
    isCustomizable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'custom-plan',
    name: 'Custom',
    displayName: 'Custom Plan',
    description: 'A fully personalized coffee subscription tailored exactly to your tastes and schedule.',
    price: 9500000,
    priceUsd: 106.15,
    priceLbp: 9500000,
    features: [
      'You choose the beans & quantities',
      'Custom roast profile on request',
      'Flexible delivery frequency',
      'Dedicated personal roaster contact',
      'First-access to micro-lots & experiments'
    ],
    productIds: [],
    frequency: 'monthly',
    minDeliveries: 1,
    isFeatured: false,
    isRecommended: false,
    isCustomizable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'daily-essentials',
    name: 'Daily',
    displayName: 'Daily Essentials',
    description: 'Fresh coffee delivered to your door every single day. Perfect for the dedicated coffee devotee who never compromises.',
    price: 350000,
    priceUsd: 3.91,
    priceLbp: 350000,
    features: [
      '1 × 200g Bag per day',
      'Fresh-roasted daily dispatch',
      'Daily delivery — 7 days a week',
      'Priority morning slot guarantee',
      'Free brewing consultation'
    ],
    productIds: ['ethiopian-yirgacheffe'],
    frequency: 'daily',
    minDeliveries: 7,
    isFeatured: true,
    isRecommended: false,
    isCustomizable: false,
    createdAt: new Date().toISOString()
  }
];

const SEED_CMS = [
  {
    id: 'hero_home',
    key: 'hero',
    type: 'hero',
    title: 'Premium Coffee. Delivered Fresh.',
    subtitle: 'PREMIUM COFFEE • DELIVERED FRESH',
    body: 'Discover specialty coffee beans, brewing tools, and curated subscriptions delivered directly to your door.',
    image: 'https://images.unsplash.com/photo-1442551320318-79bb0e4511fb?auto=format&fit=crop&q=80&w=2500',
    ctaText: 'Start Subscription',
    ctaLink: '/subscriptions',
    visible: true,
    order: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'banner_promo',
    key: 'promo_banner',
    type: 'banner',
    title: 'Free Shipping on Orders Over LBP 1,500,000',
    subtitle: 'SEASONAL PROMOTION',
    body: 'Order now and get free express delivery on all orders above 1.5M LBP or $16.50 USD.',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    visible: true,
    order: 2,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'about_snippet',
    key: 'about_home',
    type: 'feature',
    title: 'Specialty Coffee Roasters in Beirut',
    subtitle: 'OUR STORY',
    body: 'Founded in the heart of Beirut, CoffeeCraze partners with ethical farms worldwide to bring you the finest specialty coffee — roasted fresh, delivered with care.',
    visible: true,
    order: 3,
    updatedAt: new Date().toISOString()
  }
];

const SEED_BLOG = [
  {
    id: 'lebanese-morning-ritual',
    title: 'The Art of the Lebanese Morning Ritual',
    excerpt: 'Discover how coffee shapes the culture of Beirut and beyond, from traditional Jezveh brewing to modern specialty shops.',
    content: `For generations in Beirut, morning does not start when the sun rises; it starts with the smell of roasting cardamom and brewing beans.

The traditional Lebanese coffee ritual is centered around the *Jezveh* (or Rakweh), a small copper pot with a long handle. Finely ground coffee is boiled slowly with water and optional spices, generating a thick, aromatic foam on top.

### The Social Connection
Drinking coffee is rarely a solitary experience in Lebanon. It is a shared communication, a bridge between neighbors, and a gesture of welcoming hospitality. To enter a Lebanese home is to be greeted with the question: *"Badkon ahwe?"* (Would you like some coffee?).

### Recalibrating for Modern Tastes
As Beirut embraces modern third-wave coffee shops, the spirit of this ritual remains unchanged. CoffeeCraze bridges the heritage of the Lebanese roast profile with specialty single-origin beans sourced directly from sustainable farms worldwide.

### How to Brew Lebanese Coffee at Home
1. Add 1 tablespoon of very finely ground dark coffee per cup to your Jezveh.
2. Optionally add 1/4 teaspoon of ground cardamom.
3. Add cold water and stir.
4. Heat over medium heat until foam rises — remove before it boils over.
5. Let the grounds settle for 2 minutes, then pour slowly into small cups.

The result is a thick, intense, aromatic coffee that tastes like heritage.`,
    category: 'Culture',
    date: 'June 09, 2026',
    author: 'CoffeeCraze Team',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80',
    likes: 5,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: [
      {
        id: 'comment_1',
        userName: 'Ziad Al-Khoury',
        content: 'This captures the essence of Beirut mornings beautifully. Nothing beats the Rakweh smell!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        replies: [
          {
            id: 'reply_1',
            userName: 'CoffeeCraze Barista',
            content: 'Thank you Ziad! We love starting the day this way too.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    ],
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'perfecting-v60-technique',
    title: 'Perfecting Your V60 Technique',
    excerpt: 'A masterclass in slow-drip extraction for the home barista. Learn the exact ratio, grind size, and water temperature.',
    content: `The Hario V60 is a classic pour-over brewer preferred for its clean cup and ability to showcase delicate flavor notes. However, it is also highly sensitive to technique.

Here is our master guide to consistent pour-over extraction.

### 1. The Ratio
We recommend a starting ratio of **1:15** (e.g. 15g of coffee to 225g of water) or **1:16** for a slightly lighter body.

### 2. Grind Size
Aim for a medium-coarse grind, resembling sea salt. If the water drains too fast (under 2:30 minutes), grind finer. If it stalls (over 4:00 minutes), grind coarser.

### 3. Water Temperature
Keep water between **90°C and 94°C** (195°F to 201°F). Off-boil water is ideal. Boiled water will scorch the coffee, resulting in bitter elements.

### The Pour Sequence
* **The Bloom (0-40s):** Pour 3x the coffee weight in water (approx 45g) to release trapped CO2 gas. Let it bubble and swell.
* **First Pour (40s-1:15):** Pour in circular motions up to 130g.
* **Second Pour (1:15-2:00):** Pour slowly up to 225g. Gently swirl the dripper to flatten the coffee bed for even extraction.

Total brew time should be between 2:45 and 3:15 minutes.`,
    category: 'Guide',
    date: 'June 08, 2026',
    author: 'Head Barista',
    image: 'https://images.unsplash.com/photo-1544787210-2213d84ad964?w=1200&auto=format&fit=crop&q=80',
    likes: 8,
    dislikes: 1,
    likedBy: [],
    dislikedBy: [],
    comments: [],
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'cold-brew-summer-guide',
    title: 'Cold Brew: The Summer Coffee Revolution',
    excerpt: 'How to master the 12-hour cold brew method at home and create cafe-quality iced coffee in your refrigerator.',
    content: `Summer in Beirut is hot. And nothing beats the heat like a glass of smooth, concentrated cold brew coffee poured over ice.

Cold brew is not iced coffee — and the difference matters. Iced coffee is hot-brewed then chilled, which often turns bitter and acidic. Cold brew is steeped in cold water for 12–24 hours, extracting flavor without heat. The result is 67% less acidic and naturally sweeter.

### What You Need
- 100g coarsely ground coffee (we love Colombia Supremo for cold brew)
- 800ml cold, filtered water
- A mason jar or cold brew pitcher
- A fine mesh strainer or cheesecloth

### Method
1. Combine ground coffee and cold water in your jar.
2. Stir to ensure all grounds are saturated.
3. Seal and refrigerate for 12–18 hours.
4. Strain through a fine mesh strainer — twice if needed.
5. Store the concentrate in the fridge for up to 2 weeks.

### Serving
Dilute 1:1 with water or milk over ice for a standard strength. Add simple syrup, vanilla, or oat milk for a cafe-style experience.

### Pro Tip
Use our **Ethiopia Yirgacheffe** for cold brew to get a floral, tea-like iced coffee with notes of lemon and jasmine.`,
    category: 'Recipe',
    date: 'June 07, 2026',
    author: 'CoffeeCraze Team',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&auto=format&fit=crop&q=80',
    likes: 12,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: [
      {
        id: 'comment_cb_1',
        userName: 'Layla M.',
        content: 'Made this with the Ethiopia beans — absolutely incredible. The floral notes in cold brew are unreal.',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        replies: []
      }
    ],
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'understanding-coffee-processing',
    title: 'Natural vs. Washed: Understanding Coffee Processing',
    excerpt: 'Why the method used to remove a coffee cherry\'s fruit affects everything about what ends up in your cup.',
    content: `When you taste a bright, floral Ethiopian versus a heavy, earthy Sumatran, you might assume it's all about the origin. But processing — how the coffee cherry is prepared after harvest — plays an equal role in shaping flavor.

### Washed (Wet) Process
The most common method in high-quality coffee. The fruit skin and pulp are mechanically removed within hours of picking, then the beans ferment in water tanks to remove remaining mucilage before sun-drying.

**Result:** Clean, bright, transparent flavors. The bean's intrinsic character shines through.

**Try:** Ethiopia Yirgacheffe, Kenya AA Peaberry

### Natural (Dry) Process
The whole cherry dries in the sun for 3–6 weeks before the fruit is hulled off. The bean absorbs sugars and fermentation flavors from the fruit.

**Result:** Heavy body, fruity, wine-like, complex — sometimes funky.

### Honey Process
A middle path: the skin is removed but some mucilage remains during drying.

**Result:** Sweet, medium body, stone fruit notes.

**Try:** Guatemala Antigua Honey

Understanding processing unlocks a deeper appreciation of every cup. Next time you taste a wine-like natural or a tea-like washed, you'll know exactly why.`,
    category: 'Education',
    date: 'June 05, 2026',
    author: 'Head Roaster',
    image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=1200&auto=format&fit=crop&q=80',
    likes: 15,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: [
      {
        id: 'comment_proc_1',
        userName: 'Ahmad K.',
        content: 'This is exactly what I needed. Never understood why some coffees tasted "fermented". Now it all makes sense!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        replies: [
          {
            id: 'reply_proc_1',
            userName: 'CoffeeCraze Barista',
            content: 'Exactly right Ahmad! Natural processed coffees can get very funky. It\'s an acquired taste!',
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
          }
        ]
      }
    ],
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'subscription-guide-2026',
    title: 'Which CoffeeCraze Subscription Is Right for You?',
    excerpt: 'A practical guide to choosing your subscription plan based on how much you drink, what you like, and your budget.',
    content: `Choosing a subscription is a big deal. You want to love every delivery, not feel locked into something that doesn't fit your lifestyle. Here's our honest guide.

### The Starter Pack — For Beginners
If you're new to specialty coffee or drink 1-2 cups per day, start here. You'll receive 2 × 250g bags biweekly — enough for 30–40 cups. We curate two complementary origins to help you discover your preferences.

**Best for:** First-timers, light drinkers, those on a budget.

### The Explorer Plan — For the Curious
This plan was built for people who want to travel the world through coffee. Each delivery includes 3 different single-origin bags with rotating origins and a printed tasting notes card.

**Best for:** Coffee enthusiasts who love variety and discovery.

### The Premium Suite — For the Dedicated
Our most complete subscription. Premium bags, capsule packs, early access to limited lots, and a personal concierge who can answer any coffee question. Free brewing accessories are included in the first shipment.

**Best for:** Daily drinkers, home baristas, coffee connoisseurs.

### The Family Plan
Two 1kg bags per week — that's about 120-160 cups. Available in whole bean or pre-ground. A family-sized discount is automatically applied.

**Best for:** Households of 3+ coffee drinkers.

### The Office Plan
Four 1kg bags + 40 capsules per week. Keep the whole team caffeinated. A dedicated account manager handles your order adjustments.

**Best for:** Small offices and workspaces.

### Not Sure? Build Your Own.
Our Custom Plan lets you choose everything: origins, quantities, roast profiles, and delivery frequency. Contact our team to design your perfect subscription.`,
    category: 'Guide',
    date: 'June 03, 2026',
    author: 'CoffeeCraze Team',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1200&auto=format&fit=crop&q=80',
    likes: 9,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: [],
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

export const dbSeeder = {
  async seedAll() {
    if (!db) {
      console.warn('[Seeder] Firestore not initialized, skipping seeding.');
      return;
    }

    try {
      // 1. Seed Products
      const prodSnap = await getDocs(collection(db, 'products'));
      if (prodSnap.empty) {
        console.log('[Seeder] Seeding products...');
        for (const prod of SEED_PRODUCTS) {
          await setDoc(doc(db, 'products', prod.id), prod);
        }
        console.log(`[Seeder] ${SEED_PRODUCTS.length} products seeded successfully.`);
      } else {
        console.log(`[Seeder] Products already exist (${prodSnap.size} found), skipping.`);
      }

      // 2. Seed Plans
      const plansSnap = await getDocs(collection(db, 'plans'));
      if (plansSnap.empty) {
        console.log('[Seeder] Seeding plans...');
        for (const plan of SEED_PLANS) {
          await setDoc(doc(db, 'plans', plan.id), plan);
        }
        console.log(`[Seeder] ${SEED_PLANS.length} plans seeded successfully.`);
      } else {
        console.log(`[Seeder] Plans already exist (${plansSnap.size} found), skipping.`);
      }

      // 3. Seed CMS Content
      const cmsSnap = await getDocs(collection(db, 'cms_content'));
      if (cmsSnap.empty) {
        console.log('[Seeder] Seeding CMS content...');
        for (const cms of SEED_CMS) {
          await setDoc(doc(db, 'cms_content', cms.id), cms);
        }
        console.log(`[Seeder] ${SEED_CMS.length} CMS items seeded successfully.`);
      } else {
        console.log(`[Seeder] CMS already exists (${cmsSnap.size} found), skipping.`);
      }

      // 4. Seed Blog Posts
      const blogSnap = await getDocs(collection(db, 'blog_posts'));
      if (blogSnap.empty) {
        console.log('[Seeder] Seeding blog posts...');
        for (const post of SEED_BLOG) {
          await setDoc(doc(db, 'blog_posts', post.id), post);
        }
        console.log(`[Seeder] ${SEED_BLOG.length} blog posts seeded successfully.`);
      } else {
        console.log(`[Seeder] Blog posts already exist (${blogSnap.size} found), skipping.`);
      }
    } catch (error) {
      console.error('[Seeder] Seeding error:', error);
      throw error;
    }
  },

  // Force re-seed all collections (admin use only)
  async reseedAll() {
    if (!db) {
      console.warn('[Seeder] Firestore not initialized, skipping seeding.');
      return;
    }
    console.log('[Seeder] Force re-seeding all collections...');
    try {
      for (const prod of SEED_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      for (const plan of SEED_PLANS) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }
      for (const cms of SEED_CMS) {
        await setDoc(doc(db, 'cms_content', cms.id), cms);
      }
      for (const post of SEED_BLOG) {
        await setDoc(doc(db, 'blog_posts', post.id), post);
      }
      console.log('[Seeder] All collections re-seeded successfully.');
    } catch (error) {
      console.error('[Seeder] Re-seed error:', error);
      throw error;
    }
  }
};
