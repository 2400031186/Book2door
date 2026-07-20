import { createContext, useContext, useEffect, useReducer } from 'react';
import { getBookCoverUrl } from '../constants/books';

const CartContext = createContext();
const STORAGE_KEY = 'book2door-cart';

function normalizeItem(item) {
  const sideMode = item.sideMode || 'single';
  const cartKey = item.cartKey
    || (item.type === 'book' ? `book-${item.id}-${sideMode}` : `${item.type}-${item.id}`);
  return {
    ...item,
    sideMode,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    cartKey,
  };
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return action.payload.map(normalizeItem);
    case 'ADD_BOOK': {
      const payload = normalizeItem(action.payload);
      const existing = state.find((i) => i.cartKey === payload.cartKey);
      if (existing) {
        return state.map((i) =>
          i.cartKey === payload.cartKey
            ? { ...i, quantity: i.quantity + (payload.quantity || 1) }
            : i
        );
      }
      return [...state, { type: 'book', ...payload, quantity: payload.quantity || 1 }];
    }
    case 'ADD_PDF': {
      const payload = normalizeItem(action.payload);
      const existing = state.find((i) => i.type === 'pdf' && i.id === payload.id);
      if (existing) {
        return state.map((i) =>
          i.type === 'pdf' && i.id === payload.id ? { ...i, ...payload, quantity: 1 } : i
        );
      }
      return [...state, { type: 'pdf', ...payload, quantity: 1 }];
    }
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.cartKey === action.payload.cartKey
          ? { ...i, quantity: Math.max(1, action.payload.quantity) }
          : i
      );
    case 'REMOVE':
      return state.filter((i) => i.cartKey !== action.payload);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeItem);
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function getLineTotal(item) {
  return Math.round((Number(item.price) || 0) * (Number(item.quantity) || 1) * 100) / 100;
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, loadCartFromStorage);
  const ready = true;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addBook = (book, quantity = 1, sideMode = 'single', unitPrice) => {
    const price = unitPrice ?? parseFloat(book.price);
    dispatch({
      type: 'ADD_BOOK',
      payload: {
        id: book.id,
        course_code: book.course_code,
        title: book.title,
        price,
        single_side_amount: parseFloat(book.price),
        sideMode,
        cover_image_url: getBookCoverUrl(book.cover_image_url),
        year: book.year,
        semester: book.semester,
        page_count: book.page_count,
        quantity,
        cartKey: `book-${book.id}-${sideMode}`,
      },
    });
  };

  const addPdf = (pdf) => {
    dispatch({
      type: 'ADD_PDF',
      payload: {
        id: pdf.id,
        file_name: pdf.file_name,
        price: parseFloat(pdf.calculated_price),
        page_count: pdf.page_count,
        print_options: pdf.print_options,
        cartKey: `pdf-${pdf.id}`,
      },
    });
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QTY', payload: { cartKey, quantity } });
  };

  const removeItem = (cartKey) => dispatch({ type: 'REMOVE', payload: cartKey });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const subtotal = items.reduce((sum, item) => sum + getLineTotal(item), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        ready,
        addBook,
        addPdf,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        itemCount,
        getLineTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
