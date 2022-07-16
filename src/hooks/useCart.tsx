/* eslint-disable */
import { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    prevCartRef.current = cart
    console.log(prevCartRef.current)
  })

  const cartPreviousValue = prevCartRef.current ?? cart
  console.log(cartPreviousValue)

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    }
  }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      // verificação se o produto existe
      const productCart = [...cart]
      const productExists = productCart.find(product => product.id === productId)
      // pegando os dados dos produtos
      const responseProducts = await api.get(`/products/${productId}`)
      const productData = responseProducts.data
      // pegando os dados do stock
      const responseStock = await api.get(`/stock/${productId}`)
      const stock = responseStock.data.amount
      // colocando um valor para o amount
      const currentAmount = productExists ? productExists.amount : 0
      const addAmount = currentAmount + 1
      //verificando se o a quantidade solicitada é maior que o stock e retornando um erro se for maior
      if (addAmount > stock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (productExists) {
        productExists.amount = addAmount
      } else {
        const product = { ...productData, amount: 1 }
        productCart.push(product)
      }

      setCart(productCart)
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const verification = cart.find(product => product.id === productId)
      if (verification) {
        const removedProduct = cart.filter(product => product.id !== productId)
        setCart(removedProduct)
      } else {
        toast.error('Erro na remoção do produto')
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`)
      const stock = responseStock.data.amount

      if (amount > stock) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (amount > 0) {
        const updatedProduct = cart.map(product =>
          product.id === productId ? { ...product, amount: amount } : product
        )
        setCart(updatedProduct)
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
