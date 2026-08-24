import { baseApi } from "./baseApi";
import type { Recipe, CreateRecipeInput, UpdateRecipeInput } from "@/types/api/index";

export const recipesEndpoints = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecipes: builder.query<Recipe[], void>({
      query: () => "/recipes",
      providesTags: ["Recipes"],
    }),
    getRecipeById: builder.query<Recipe, string>({
      query: (id) => `/recipes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Recipes", id }],
    }),
    createRecipe: builder.mutation<Recipe, CreateRecipeInput>({
      query: (body) => ({ url: "/recipes", method: "POST", body }),
      invalidatesTags: ["Recipes"],
    }),
    updateRecipe: builder.mutation<Recipe, { id: string; data: UpdateRecipeInput }>({
      query: ({ id, data }) => ({ url: `/recipes/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Recipes"],
    }),
    deleteRecipe: builder.mutation<void, string>({
      query: (id) => ({ url: `/recipes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Recipes"],
    }),
  }),
});

export const {
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipesEndpoints;
