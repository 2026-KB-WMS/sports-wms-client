import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("products", "routes/products.tsx"),
  route("warehouses", "routes/warehouses.tsx"),
  route("warehouses/:warehouseId", "routes/warehouse-detail.tsx"),
  route("inventory", "routes/inventory.tsx"),
  route("stores", "routes/stores.tsx"),
  route("stores/:storeId", "routes/store-detail.tsx"),
] satisfies RouteConfig
