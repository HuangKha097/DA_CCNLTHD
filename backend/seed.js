// seed.js - Chạy 1 lần để tạo dữ liệu test
// Cách chạy: node seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log("MongoDB Connected");

// ===== INSERT SHOP =====
const shop = await mongoose.connection.collection("Shops").insertOne({
  owner: new mongoose.Types.ObjectId(),
  name: "Shop Test ABC",
  email: "shoptest@gmail.com",
  status: "active",
  verified: true,
  logo: "",
  coverInfo: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});
const shopId = shop.insertedId;
console.log("✅ ShopId:", shopId.toString());

// ===== INSERT PRODUCT =====
const product = await mongoose.connection.collection("Products").insertOne({
  product_shop: shopId,
  product_name: "Áo thun test",
  product_price: 150000,
  product_description: "Áo thun dùng để test",
  product_quantity: 100,
  product_type: "Clothing",
  product_attributes: { color: "đen", size: "M" },
  product_thumb: "https://via.placeholder.com/150",
  product_images: [],
  product_ratingsAverage: 4.5,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
const productId = product.insertedId;
console.log("✅ ProductId:", productId.toString());

// ===== INSERT INVENTORY =====
await mongoose.connection.collection("Inventories").insertOne({
  inven_productId: productId,
  inven_shopId: shopId,
  inven_stock: 50,
  inven_location: "HCM",
  inven_reservations: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log("✅ Inventory created - Stock: 50");

// ===== IN RA ĐỂ ĐIỀN VÀO order.http =====
console.log("\n========================================");
console.log("Copy các giá trị này vào file order.http:");
console.log("========================================");
console.log(`@shopId    = ${shopId.toString()}`);
console.log(`@productId = ${productId.toString()}`);
console.log("========================================\n");

await mongoose.disconnect();
console.log("Done!");
