import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ReportSummary,
  SalesByDay,
  TopProduct,
  OrderTypeDistribution,
} from "@/types/admin";

const mockSummary: ReportSummary = {
  totalSales: 12450.8,
  totalOrders: 342,
  averageOrderValue: 36.41,
  totalProfit: 4820.2,
};

const mockSalesByDay: SalesByDay[] = [
  { date: "2025-02-20", sales: 2100, orders: 58 },
  { date: "2025-02-21", sales: 2350, orders: 62 },
  { date: "2025-02-22", sales: 1980, orders: 54 },
  { date: "2025-02-23", sales: 2650, orders: 72 },
  { date: "2025-02-24", sales: 2410.8, orders: 66 },
  { date: "2025-02-25", sales: 960, orders: 30 },
];

const mockTopProducts: TopProduct[] = [
  { productId: "p1", name: "Classic Burger", quantity: 128, revenue: 1151.72 },
  { productId: "p4", name: "Margherita Pizza", quantity: 95, revenue: 1234.05 },
  { productId: "p7", name: "Cola", quantity: 210, revenue: 522.9 },
  { productId: "p10", name: "French Fries", quantity: 156, revenue: 622.44 },
  { productId: "p2", name: "Cheese Burger", quantity: 88, revenue: 835.12 },
];

const mockOrderTypeDist: OrderTypeDistribution[] = [
  { type: "Dine-in", count: 180, percentage: 52.6 },
  { type: "Takeaway", count: 102, percentage: 29.8 },
  { type: "Delivery", count: 60, percentage: 17.6 },
];

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["Reports"],
  endpoints: (builder) => ({
    getReportSummary: builder.query<ReportSummary, void>({
      queryFn: () => ({ data: mockSummary }),
      providesTags: ["Reports"],
    }),
    getSalesByDay: builder.query<SalesByDay[], void>({
      queryFn: () => ({ data: mockSalesByDay }),
      providesTags: ["Reports"],
    }),
    getTopProducts: builder.query<TopProduct[], void>({
      queryFn: () => ({ data: mockTopProducts }),
      providesTags: ["Reports"],
    }),
    getOrderTypeDistribution: builder.query<OrderTypeDistribution[], void>({
      queryFn: () => ({ data: mockOrderTypeDist }),
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetReportSummaryQuery,
  useGetSalesByDayQuery,
  useGetTopProductsQuery,
  useGetOrderTypeDistributionQuery,
} = reportsApi;
