// Mehsul elementinin strukturu
export interface ProductItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  inStock: boolean;
}

// Test ucun hazirlanmis mehsul siyahisi (mock inventory)
export const MOCK_INVENTORY: ProductItem[] = [
  { id: '1', name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', brand: 'Sony', price: 299, rating: 4.8, inStock: true },
  { id: '2', name: 'Ultra-Wide Curved Gaming Monitor 34"', category: 'Electronics', brand: 'LG', price: 650, rating: 4.6, inStock: true },
  { id: '3', name: 'Ergonomic Mesh Office Chair', category: 'Furniture', brand: 'Herman Miller', price: 450, rating: 4.9, inStock: false },
  { id: '4', name: 'Smart Fitness Watch Series 7', category: 'Electronics', brand: 'Apple', price: 399, rating: 4.5, inStock: true },
  { id: '5', name: 'Mechanical RGB Keyboard', category: 'Electronics', brand: 'Logitech', price: 120, rating: 4.3, inStock: true },
  { id: '6', name: 'Organic Cotton Hoodie', category: 'Apparel', brand: 'Nike', price: 75, rating: 4.1, inStock: true },
  { id: '7', name: 'Trail Running Shoes', category: 'Apparel', brand: 'Adidas', price: 130, rating: 4.4, inStock: false },
  { id: '8', name: 'Minimalist Standing Desk', category: 'Furniture', brand: 'IKEA', price: 280, rating: 4.2, inStock: true },
  { id: '9', name: 'Stainless Steel Water Bottle 1L', category: 'Accessories', brand: 'Hydro Flask', price: 45, rating: 4.7, inStock: true },
  { id: '10', name: 'Leather Laptop Backpack 15"', category: 'Accessories', brand: 'Herschel', price: 110, rating: 4.0, inStock: true },
  { id: '11', name: 'Bluetooth Portable Speaker', category: 'Electronics', brand: 'JBL', price: 89, rating: 4.5, inStock: false },
  { id: '12', name: 'Noise Isolating Earbuds', category: 'Electronics', brand: 'Bose', price: 199, rating: 4.6, inStock: true },
  { id: '13', name: 'Adjustable Monitor Stand', category: 'Furniture', brand: 'Dell', price: 60, rating: 4.1, inStock: true },
  { id: '14', name: 'Breathable Workout Shorts', category: 'Apparel', brand: 'Puma', price: 35, rating: 3.9, inStock: true },
  { id: '15', name: 'Polarized Sunglasses', category: 'Accessories', brand: 'Ray-Ban', price: 160, rating: 4.8, inStock: false },
];