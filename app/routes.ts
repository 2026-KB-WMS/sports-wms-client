import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("products", "routes/products.tsx"),
  route("warehouses", "routes/warehouses.tsx"),
  route("warehouses/:warehouseId", "routes/warehouse-detail.tsx"),
  route("inventory", "routes/inventory.tsx"),
  route("stores", "routes/stores.tsx"),
  route("stores/:storeId", "routes/store-detail.tsx"),
  route("suppliers", "routes/suppliers.tsx"),
  route("suppliers/:supplierId", "routes/supplier-detail.tsx"),
  route("purchase-orders", "routes/purchase-orders.tsx"),
  route("purchase-orders/:purchaseOrderId", "routes/purchase-order-detail.tsx"),
  route("inbounds", "routes/inbounds.tsx"),
  route("inbounds/:inboundId", "routes/inbound-detail.tsx"),
  route("store-orders", "routes/store-orders.tsx"),
  route("store-orders/:storeOrderId", "routes/store-order-detail.tsx"),
  route("allocations", "routes/allocations.tsx"),
  route("outbounds", "routes/outbounds.tsx"),
  route("outbounds/:outboundId", "routes/outbound-detail.tsx"),
] satisfies RouteConfig
