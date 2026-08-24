import { baseApi } from "./baseApi";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: Record<string, unknown> | null;
  limits: Record<string, number> | null;
  active: boolean;
}

export interface PaymentSubmission {
  id: string;
  organizationId: string;
  planId: string;
  amount: number;
  paymentMethod: "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER";
  accountTitle: string | null;
  transactionId: string | null;
  receiptImage: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: { id: string; name: string; slug: string };
  plan?: Plan;
}

export interface MySubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  plan?: Plan;
}

export const subscriptionEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<Plan[], void>({
      query: () => "/subscriptions/plans",
    }),
    getMySubscription: builder.query<MySubscription, void>({
      query: () => "/subscriptions/my-status",
      providesTags: ["Auth"],
    }),
    submitPayment: builder.mutation<PaymentSubmission, FormData>({
      query: (body) => ({
        url: "/subscriptions/submit-payment",
        method: "POST",
        body,
        formData: true,
      }),
      invalidatesTags: ["Auth"],
    }),
    getPaymentStatus: builder.query<PaymentSubmission | null, void>({
      query: () => "/subscriptions/payment-status",
      providesTags: ["Auth"],
    }),
    getAdminPayments: builder.query<{ data: PaymentSubmission[]; total: number; page: number; totalPages: number }, { page?: number; status?: string }>({
      query: (params) => ({ url: "/subscriptions/admin/payments", params }),
      providesTags: ["PlatformStats"],
    }),
    approvePayment: builder.mutation<void, string>({
      query: (id) => ({ url: `/subscriptions/admin/payments/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["PlatformStats", "Organizations"],
    }),
    rejectPayment: builder.mutation<void, { id: string; notes: string }>({
      query: ({ id, notes }) => ({ url: `/subscriptions/admin/payments/${id}/reject`, method: "PATCH", body: { notes } }),
      invalidatesTags: ["PlatformStats"],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useSubmitPaymentMutation,
  useGetPaymentStatusQuery,
  useGetAdminPaymentsQuery,
  useApprovePaymentMutation,
  useRejectPaymentMutation,
} = subscriptionEndpoints;
