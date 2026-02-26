/**
 * API request/response interfaces. Define here first, then use in redux/api and elsewhere.
 */

/** Request body for submitting an order */
export interface SubmitOrderRequest {
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}

/** Response from submit order endpoint */
export interface SubmitOrderResponse {
  orderId: string;
}
