# Project structure

This project follows the **optional `src` folder** layout from [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure).

## App and routes: real code in root `app`

- **All route and layout code lives in the root `app` folder** (layout, page, globals.css, (dashboard), (pos), auth). Each file under `app` contains the actual component code, not re-exports.
- Shared code (components, redux, features, lib, types) stays in `src/`. Root `app` imports them via `@/*` (e.g. `@/components/ui/button`, `@/redux/provider`).
- `tsconfig.json` has `"@/*": ["./src/*"]` so `@/` resolves to `src/`.

```
app/                        # App Router – actual layout & page code
├── layout.tsx
├── page.tsx                # /
├── globals.css
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx  # /dashboard
│   ├── products/page.tsx   # /products
│   ├── orders/page.tsx     # /orders
│   └── staff/page.tsx      # /staff
├── (pos)/
│   ├── layout.tsx
│   └── pos/page.tsx        # /pos
└── auth/
    ├── layout.tsx
    └── login/page.tsx      # /auth/login

src/                        # Shared code (app imports via @/*)
├── components/
├── features/
├── redux/
├── hooks/
├── lib/
└── types/
```

## Redux

- **Store:** `src/redux/store.ts`
- **Cart UI selectors:** `src/redux/selectors/cartUi.ts`
- **Cart calculation selectors:** `src/redux/selectors/cartCalculation.ts` (memoized)
- **API:** `src/redux/api/cart/` (RTK Query, tagTypes)

## References

- [Next.js Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure)
- [Configuring the `src` directory](https://nextjs.org/docs/app/building-your-application/configuring/src-directory)
