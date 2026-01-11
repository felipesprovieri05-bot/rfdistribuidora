
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Cerveja Artesanal IPA', 
    buyPrice: 8.50, 
    sellPrice: 18.00, 
    stock: 50, 
    category: 'Cervejas',
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '2', 
    name: 'X-Burguer Especial', 
    buyPrice: 12.00, 
    sellPrice: 28.00, 
    stock: 30, 
    category: 'Lanches',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '3', 
    name: 'Vinho Tinto Malbec', 
    buyPrice: 35.00, 
    sellPrice: 75.00, 
    stock: 15, 
    category: 'Vinhos e Outros',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '4', 
    name: 'Batata Frita com Queijo', 
    buyPrice: 7.00, 
    sellPrice: 22.00, 
    stock: 40, 
    category: 'Petiscos e Porções',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '5', 
    name: 'Suco Natural Laranja', 
    buyPrice: 3.00, 
    sellPrice: 10.00, 
    stock: 60, 
    category: 'Bebidas Não Alcoólicas',
    imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '6', 
    name: 'Gin Tônica Premium', 
    buyPrice: 15.00, 
    sellPrice: 35.00, 
    stock: 25, 
    category: 'Destilados e Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '7', 
    name: 'Pudim de Leite', 
    buyPrice: 4.00, 
    sellPrice: 12.00, 
    stock: 15, 
    category: 'Sobremesas',
    imageUrl: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&q=80&w=800'
  },
  { 
    id: '8', 
    name: 'Combo Burguer + Fritas', 
    buyPrice: 18.00, 
    sellPrice: 45.00, 
    stock: 20, 
    category: 'Combos Especiais',
    imageUrl: 'https://images.unsplash.com/photo-1460306423018-2b3a9c50c059?auto=format&fit=crop&q=80&w=800'
  },
];

export const ADMIN_PASSWORD = "admin123";

export const CATEGORIES = [
  'Petiscos e Porções',
  'Lanches',
  'Bebidas Não Alcoólicas',
  'Cervejas',
  'Bebidas',
  'Destilados e Drinks',
  'Vinhos e Outros',
  'Sobremesas',
  'Combos Especiais',
  'Outros'
] as const;
