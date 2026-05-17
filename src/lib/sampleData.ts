import { Product, UserRole } from '../types';

export const SAMPLE_PRODUCTS: Partial<Product>[] = [
  {
    name: "Beirut Signature Blend",
    description: "Our award-winning medium-dark roast with notes of chocolate and toasted hazelnut. Perfect for traditional stovetop or espresso.",
    price: 450000,
    category: "Coffee Beans",
    images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800"],
    stock: 50,
    sku: "CC-BEI-001",
    tags: ["Bold", "Medium-Dark", "Local"],
    isSubscriptionEligible: true,
    rating: 4.9,
    reviewCount: 124,
    isFeatured: true
  },
  {
    name: "Ethiopian Yirgacheffe",
    description: "Exquisite light roast with floral jasmine aromas and bright citrus acidity. Ideal for pour-over aficionados.",
    price: 600000,
    category: "Coffee Beans",
    images: ["https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&q=80&w=800"],
    stock: 30,
    sku: "CC-ETH-002",
    tags: ["Floral", "Light", "Specialty"],
    isSubscriptionEligible: true,
    rating: 4.8,
    reviewCount: 88,
    isFeatured: false
  },
  {
    name: "Pro-Barista Espresso Machine",
    description: "Industrial grade dual-boiler machine for the serious home barista or small office. Stainless steel finish.",
    price: 32000000,
    category: "Espresso Machines",
    images: ["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&q=80&w=800"],
    stock: 5,
    sku: "CC-MAC-888",
    tags: ["Professional", "Steel", "Pro"],
    isSubscriptionEligible: false,
    rating: 5.0,
    reviewCount: 12,
    isFeatured: true
  },
  {
    name: "Premium Gold Capsules (10pk)",
    description: "Superior quality Arabica capsules compatible with all Nespresso-style machines.",
    price: 280000,
    category: "Capsules",
    images: ["https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=800"],
    stock: 200,
    sku: "CC-CAP-010",
    tags: ["Convenience", "Gold", "Arabica"],
    isSubscriptionEligible: true,
    rating: 4.7,
    reviewCount: 56,
    isFeatured: false
  },
  {
    name: "Pure Vanilla Syrup",
    description: "Cold-filtered vanilla bean reduction. Perfect for elevated lattes.",
    price: 350000,
    category: "Syrups",
    images: ["https://images.unsplash.com/photo-1595981267035-7b04ca84a810?auto=format&fit=crop&q=80&w=800"],
    stock: 100,
    sku: "CC-SYR-001",
    tags: ["Sweet", "Vanilla", "Luxury"],
    isSubscriptionEligible: true,
    rating: 4.8,
    reviewCount: 45,
    isFeatured: false
  },
  {
    name: "Dark Cacao Powder",
    description: "70% Single-origin chocolate powder for the ultimate mocha ritual.",
    price: 450000,
    category: "Powders",
    images: ["https://images.unsplash.com/photo-1587049016473-b1ad2c0173bc?auto=format&fit=crop&q=80&w=800"],
    stock: 150,
    sku: "CC-POW-002",
    tags: ["Bold", "Chocolate", "Organic"],
    isSubscriptionEligible: true,
    rating: 4.9,
    reviewCount: 67,
    isFeatured: true
  }
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'sensory-starter',
    name: 'SENSORY_STARTER',
    description: 'Personalized selection of beans and essentials for the foundational ritual.',
    price: 1200000,
    features: ['Curated Local Beans', 'Syrup Add-on Included', 'Priority Provisioning', 'Bi-Weekly Sync']
  },
  {
    id: 'excellence-suite',
    name: 'EXCELLENCE_SUITE',
    description: 'The ultimate orchestral selection for high-performance sensory environments.',
    price: 4500000,
    features: ['Bulk Bean Allocation', 'Powder & Syrup Access', 'Dedicated Support Node', 'Weekly Fleet Logistics'],
    isFeatured: true
  },
  {
    id: 'custom-archival',
    name: 'LEGACY_ARCHIVE',
    description: 'Bespoke sensory architecture for global entities and archival collectors.',
    price: 9500000,
    features: ['Isotopic Sourcing', 'AI Sensory Mapping', '24/7 Agent Node', 'Global Logistics']
  }
];
