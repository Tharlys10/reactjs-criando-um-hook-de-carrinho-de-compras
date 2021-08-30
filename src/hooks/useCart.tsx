import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    let card_storage = cart

    try {
      const { data: stock } = await api.get(`/stock/${productId}`)

      if (!stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const { data: product } = await api.get(`/products/${productId}`)

      const product_cart_already_exists = cart.find((product: Product) => product.id === productId)

      if (product_cart_already_exists) {
        const total = product_cart_already_exists.amount + 1

        if (total > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        card_storage = cart.map((product: Product) => product.id === productId ? {
          ...product,
          amount: total
        } : product)
      } else {
        const product_selected_new: Product = {
          ...product,
          amount: 1
        }

        card_storage = [
          ...card_storage,
          product_selected_new
        ]
      }

      localStorage.removeItem("@RocketShoes:cart")
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(card_storage))

      setCart(card_storage)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    let card_storage = cart

    try {
      const product_already_exists = card_storage.some((product: Product) => product.id === productId)

      if (!product_already_exists) {
        toast.error('Erro na remoção do produto');
        return
      }

      card_storage = card_storage.filter((product: Product) => product.id !== productId)

      localStorage.removeItem("@RocketShoes:cart")
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(card_storage))

      setCart(card_storage)

      toast.success("Produto removido com sucesso")
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return
    }

    let card_storage = cart

    try {
      const { data: stock } = await api.get(`/stock/${productId}`)

      if (!stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const product_cart_already_exists = cart.find((product: Product) => product.id === productId)

      if (product_cart_already_exists) {
        if (amount > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        card_storage = cart.map((product: Product) => product.id === productId ? {
          ...product,
          amount
        } : product)

        localStorage.removeItem("@RocketShoes:cart")
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(card_storage))

        setCart(card_storage)
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
