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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`/stock/${productId}`)      
      
      if(stock.data.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const products = [...cart]

      const productIndex = products.findIndex(product => product.id === productId)            
      
      if( productIndex >= 0 ){
        
        if(products[productIndex].amount >= stock.data.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        products[productIndex].amount += 1
        
        setCart(products)  

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
        
        return
      } 
      
      const product  = await api.get(`/products/${productId}`)      

      setCart([...cart,{...product.data, amount: 1}])

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product.data, amount: 1}]))

      return
        
    } catch(e) {      
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {      
      const existProd = cart.find(product=> product.id === productId)

      if(!existProd){
        toast.error('Erro na remoção do produto')
        return
      }

      const otherProduts = cart.filter(product => product.id !== productId);

      setCart(otherProduts)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(otherProduts))

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0 ) {
        return
      }      

      const products = [...cart]

      const productIndex = products.findIndex(product => product.id === productId)

      if(productIndex < 0){
        throw toast.error('Erro na alteração de quantidade do produto')        
      }

      const stock = await api.get(`/stock/${productId}`)  

      if(stock.data.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const saldoStock = stock.data.amount - products[productIndex].amount 

      const degOrAcr = amount === 2 ? 'acr' : 'dec'      

      // console.log(productId, amount)
      // console.log(degOrAcr === 'acr' , 1 > saldoStock, saldoStock, stock.data)
      
      if( degOrAcr === 'acr' && 1 > saldoStock){      
       toast.error('Quantidade solicitada fora de estoque')        
       return
      }

      products[productIndex].amount += degOrAcr === 'acr' ? 1 : -1

      setCart(products)  

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))

    } catch (e) {      
      toast.error('Erro na adição do produto');
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
