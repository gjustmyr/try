export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  shop: Shop;
  category: string;
  inStock: boolean;
  badge?: 'sale' | 'new' | 'hot';
}

export interface Shop {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
}

export const SHOPS: Shop[] = [
  { id: '1', name: 'TechHub Store', logo: '🏪', verified: true },
  { id: '2', name: 'Fashion Boutique', logo: '👗', verified: true },
  { id: '3', name: 'Home Essentials', logo: '🏠', verified: false },
  { id: '4', name: 'Sports World', logo: '⚽', verified: true },
  { id: '5', name: 'Book Haven', logo: '📚', verified: true },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    originalPrice: 129.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    rating: 4.5,
    reviews: 234,
    shop: SHOPS[0],
    category: 'Electronics',
    inStock: true,
    badge: 'sale',
  },
  {
    id: '2',
    name: 'Cotton Summer Dress',
    price: 45.0,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    rating: 4.8,
    reviews: 156,
    shop: SHOPS[1],
    category: 'Fashion',
    inStock: true,
    badge: 'new',
  },
  {
    id: '3',
    name: 'Ceramic Coffee Mug Set',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    rating: 4.3,
    reviews: 89,
    shop: SHOPS[2],
    category: 'Home',
    inStock: true,
  },
  {
    id: '4',
    name: 'Yoga Mat Premium',
    price: 35.0,
    originalPrice: 50.0,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    rating: 4.6,
    reviews: 312,
    shop: SHOPS[3],
    category: 'Sports',
    inStock: true,
    badge: 'hot',
  },
  {
    id: '5',
    name: 'The Art of Programming',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    rating: 4.9,
    reviews: 445,
    shop: SHOPS[4],
    category: 'Books',
    inStock: true,
  },
  {
    id: '6',
    name: 'Smart Watch Series 5',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    rating: 4.7,
    reviews: 678,
    shop: SHOPS[0],
    category: 'Electronics',
    inStock: true,
    badge: 'sale',
  },
  {
    id: '7',
    name: 'Leather Crossbody Bag',
    price: 89.0,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    rating: 4.4,
    reviews: 203,
    shop: SHOPS[1],
    category: 'Fashion',
    inStock: false,
  },
  {
    id: '8',
    name: 'Scented Candle Collection',
    price: 32.5,
    image: 'https://images.unsplash.com/photo-1602874801006-e24b3e7ff7d7?w=400',
    rating: 4.2,
    reviews: 127,
    shop: SHOPS[2],
    category: 'Home',
    inStock: true,
    badge: 'new',
  },
  {
    id: '9',
    name: 'Running Shoes Pro',
    price: 120.0,
    originalPrice: 160.0,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    rating: 4.8,
    reviews: 891,
    shop: SHOPS[3],
    category: 'Sports',
    inStock: true,
    badge: 'hot',
  },
  {
    id: '10',
    name: 'Mystery Novel Collection',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    rating: 4.6,
    reviews: 234,
    shop: SHOPS[4],
    category: 'Books',
    inStock: true,
  },
  {
    id: '11',
    name: 'Wireless Gaming Mouse',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
    rating: 4.5,
    reviews: 456,
    shop: SHOPS[0],
    category: 'Electronics',
    inStock: true,
  },
  {
    id: '12',
    name: 'Denim Jacket Classic',
    price: 75.0,
    originalPrice: 95.0,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    rating: 4.7,
    reviews: 189,
    shop: SHOPS[1],
    category: 'Fashion',
    inStock: true,
    badge: 'sale',
  },
];
