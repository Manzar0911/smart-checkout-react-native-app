// Mock product database for Packaged Food / Snacks
export const PRODUCTS = {
  '8901234567001': {
    id: '8901234567001',
    name: 'Aloo Bhujia',
    brand: 'Haldiram\'s',
    price: 95,
    originalPrice: 110,
    discount: 14,
    image: 'https://www.thai-food-online.co.uk/cdn/shop/products/Haldirams-Aloo-Bhujia-200g-Front.png', // Aloo Bhujia
    ingredients: 'Potato, Edible Vegetable Oil, Gram Flour, Spices & Condiments',
    packaging: 'Pouch, 400g',
    expiryDate: '2026-12-15',
    category: 'Namkeen',
    weight: '400g',
  },
  '8901234567002': {
    id: '8901234567002',
    name: 'Magic Masala Chips',
    brand: 'Lay\'s',
    price: 20,
    originalPrice: 20,
    discount: 0,
    image: 'https://tse3.mm.bing.net/th/id/OIP.itq2GDTaTe3nMHhOIdznhAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3', // Chips
    ingredients: 'Potato, Edible Vegetable Oil, Spices, Salt, Tomato Powder',
    packaging: 'Pouch, 50g',
    expiryDate: '2027-02-20',
    category: 'Chips',
    weight: '50g',
  },
  '8901234567003': {
    id: '8901234567003',
    name: 'Masala Kurkure',
    brand: 'Kurkure',
    price: 20,
    originalPrice: 25,
    discount: 20,
    image: 'https://m.media-amazon.com/images/I/71sOPzrW0mL._SX679_.jpg', // Kurkure / Puffs
    ingredients: 'Rice Meal, Edible Vegetable Oil, Corn Meal, Gram Meal, Spices',
    packaging: 'Pouch, 90g',
    expiryDate: '2027-01-10',
    category: 'Snacks',
    weight: '90g',
  },
  '8901234567004': {
    id: '8901234567004',
    name: 'Roasted Makhana (Salt & Pepper)',
    brand: 'Mr. Makhana',
    price: 150,
    originalPrice: 199,
    discount: 25,
    image: 'https://bf1af2.akinoncloudcdn.com/products/2024/09/10/63957/73e7fd52-e6d0-41c5-a4b1-f7725699bf3a_size3840_cropCenter.jpg', // Makhana
    ingredients: 'Popped Lotus Seeds, Olive Oil, Black Pepper, Himalayan Pink Salt',
    packaging: 'Zip Lock Pouch, 100g',
    expiryDate: '2027-04-01',
    category: 'Healthy Snacks',
    weight: '100g',
  },
  '8901234567005': {
    id: '8901234567005',
    name: 'Diet Mixture',
    brand: 'Bikaji',
    price: 180,
    originalPrice: 200,
    discount: 10,
    image: 'https://bgstores.in/wp-content/uploads/2020/08/haldirams-deit-200-300x300.png', // Diet Mixture
    ingredients: 'Rice Flakes, Gram Flour, Edible Vegetable Oil, Peanuts, Spices',
    packaging: 'Pouch, 500g',
    expiryDate: '2027-03-25',
    category: 'Diet Snacks',
    weight: '500g',
  },
  '8901234567006': {
    id: '8901234567006',
    name: 'Mad Angles Achaari Masti',
    brand: 'Bingo!',
    price: 35,
    originalPrice: 40,
    discount: 12,
    image: 'https://www.bigbasket.com/media/uploads/p/l/238341_24-bingo-mad-angles-achaari-masti.jpg', // Mad Angles
    ingredients: 'Rice Grits, Edible Vegetable Oil, Corn Grits, Gram Grits, Achaari Seasoning',
    packaging: 'Pouch, 130g',
    expiryDate: '2026-11-28',
    category: 'Chips',
    weight: '130g',
  },
  '8901234567007': {
    id: '8901234567007',
    name: 'NutriChoice Digestive Biscuits',
    brand: 'Britannia',
    price: 60,
    originalPrice: 65,
    discount: 8,
    image: 'https://d3olmw93qe7qxx.cloudfront.net/images/products/B9001448.jpg', // TEST IMAGE - Biscuits
    ingredients: 'Refined Wheat Flour, Whole Wheat Flour, Edible Vegetable Oil, Sugar',
    packaging: 'Wrapper, 250g',
    expiryDate: '2027-05-15',
    category: 'Crackers',
    weight: '250g',
  },
  '8901234567008': {
    id: '8901234567008',
    name: 'Khara Biscuit',
    brand: 'Karachi Bakery',
    price: 160,
    originalPrice: 180,
    discount: 11,
    image: 'https://th.bing.com/th/id/OIP.tG6dKArUnMWg2zk85KC79AHaFn?w=240&h=182&c=7&r=0&o=7&pid=1.7&rm=3', // Khara Biscuit
    ingredients: 'Refined Wheat Flour, Interesterified Vegetable Fat, Sugar, Salt, Spices',
    packaging: 'Box, 400g',
    expiryDate: '2026-12-31',
    category: 'Crackers',
    weight: '400g',
  },
};

// Recommendations based on categories
export const RECOMMENDATIONS = [
  {
    id: '8901234567004',
    name: 'Roasted Makhana',
    brand: 'Mr. Makhana',
    price: 150,
    originalPrice: 199,
    image: 'https://bf1af2.akinoncloudcdn.com/products/2024/09/10/63957/73e7fd52-e6d0-41c5-a4b1-f7725699bf3a_size3840_cropCenter.jpg', // Makhana
    tag: 'Trending',
  },
  {
    id: '8901234567005',
    name: 'Diet Mixture',
    brand: 'Bikaji',
    price: 180,
    originalPrice: 200,
    image: 'https://bgstores.in/wp-content/uploads/2020/08/haldirams-deit-200-300x300.png', // Diet Mixture
    tag: 'Most Popular',
  },
  {
    id: '8901234567001',
    name: 'Aloo Bhujia',
    brand: 'Haldiram\'s',
    price: 95,
    originalPrice: 110,
    image: 'https://www.thai-food-online.co.uk/cdn/shop/products/Haldirams-Aloo-Bhujia-200g-Front.png', // Aloo Bhujia
    tag: 'Classic',
  },
];

// Simulated barcode scan results (random selection)
export const getRandomProduct = () => {
  const keys = Object.keys(PRODUCTS);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return PRODUCTS[randomKey];
};

export const OFFERS = [
  { id: 'o1', title: 'Festive Save 20%', subtitle: 'Use Code: FESTIVAL20', color: '#FF6B35', code: 'FESTIVAL20' },
  { id: 'o2', title: 'Flat ₹50 Off', subtitle: 'Use Code: FLAT50', color: '#00D4AA', code: 'FLAT50' },
  { id: 'o3', title: 'Snacks Combo', subtitle: 'Extra 10% Off', color: '#7B68EE', code: 'COMBO10' },
];

export const VALID_COUPONS = {
  'FESTIVAL20': { type: 'percent', value: 20 },
  'FLAT50': { type: 'fixed', value: 50 },
  'COMBO10': { type: 'percent', value: 10 },
};
