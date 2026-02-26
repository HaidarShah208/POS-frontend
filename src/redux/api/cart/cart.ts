import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CartState, CartItem, AddToCartPayload, CartItemModifier } from "@/types";

const initialCartState: CartState = {
  items: [],
  totalQuantity: 0,
  discount: 0,
  discountType: "fixed",
  orderType: "dine-in",
  paymentMethod: "cash",
};

let cartState: CartState = { ...initialCartState };

function recalcQuantity(state: CartState) {
  state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: typeof window !== "undefined" ? "/api" : "",
  }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    getCart: builder.query<CartState, void>({
      queryFn: () => ({ data: JSON.parse(JSON.stringify(cartState)) }),
      providesTags: ["Cart"],
    }),
    addToCart: builder.mutation<CartState, AddToCartPayload>({
      queryFn: (payload) => {
        const { productId, name, price, image, quantity = 1, note, modifiers } = payload;
        const existing = cartState.items.find(
          (i) => i.productId === productId && !i.note && !(i.modifiers?.length)
        );
        if (existing && !note && !(modifiers?.length)) {
          existing.quantity += quantity;
        } else {
          cartState.items.push({
            id: `cart-${productId}-${Date.now()}`,
            productId,
            name,
            price,
            quantity,
            image,
            note,
            modifiers: modifiers?.length ? [...modifiers] : undefined,
          });
        }
        recalcQuantity(cartState);
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: builder.mutation<CartState, string>({
      queryFn: (itemId) => {
        cartState.items = cartState.items.filter((i) => i.id !== itemId);
        recalcQuantity(cartState);
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    increaseQty: builder.mutation<CartState, string>({
      queryFn: (itemId) => {
        const item = cartState.items.find((i) => i.id === itemId);
        if (item) {
          item.quantity += 1;
          recalcQuantity(cartState);
        }
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    decreaseQty: builder.mutation<CartState, string>({
      queryFn: (itemId) => {
        const item = cartState.items.find((i) => i.id === itemId);
        if (item) {
          if (item.quantity <= 1) {
            cartState.items = cartState.items.filter((i) => i.id !== itemId);
          } else {
            item.quantity -= 1;
          }
          recalcQuantity(cartState);
        }
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setItemNote: builder.mutation<CartState, { itemId: string; note: string }>({
      queryFn: ({ itemId, note }) => {
        const item = cartState.items.find((i) => i.id === itemId);
        if (item) item.note = note || undefined;
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setItemModifiers: builder.mutation<CartState, { itemId: string; modifiers: CartItemModifier[] }>({
      queryFn: ({ itemId, modifiers }) => {
        const item = cartState.items.find((i) => i.id === itemId);
        if (item) item.modifiers = modifiers?.length ? modifiers : undefined;
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setDiscount: builder.mutation<CartState, number>({
      queryFn: (value) => {
        cartState.discount = Math.max(0, value);
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setDiscountType: builder.mutation<CartState, CartState["discountType"]>({
      queryFn: (value) => {
        cartState.discountType = value;
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setOrderType: builder.mutation<CartState, CartState["orderType"]>({
      queryFn: (value) => {
        cartState.orderType = value;
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    setPaymentMethod: builder.mutation<CartState, CartState["paymentMethod"]>({
      queryFn: (value) => {
        cartState.paymentMethod = value;
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation<CartState, void>({
      queryFn: () => {
        cartState = {
          ...initialCartState,
          items: [],
          totalQuantity: 0,
          discount: 0,
          discountType: "fixed",
          orderType: "dine-in",
          paymentMethod: "cash",
        };
        return { data: JSON.parse(JSON.stringify(cartState)) };
      },
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useRemoveFromCartMutation,
  useIncreaseQtyMutation,
  useDecreaseQtyMutation,
  useSetItemNoteMutation,
  useSetItemModifiersMutation,
  useSetDiscountMutation,
  useSetDiscountTypeMutation,
  useSetOrderTypeMutation,
  useSetPaymentMethodMutation,
  useClearCartMutation,
} = cartApi;
