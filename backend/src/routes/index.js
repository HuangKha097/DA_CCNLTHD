import CartRouter from "./CartRoutes.js";
import UserRouter from "./UserRoutes.js";
import DiscountRouter from "./DiscountRoutes.js";
import OrderRouter from "./OrderRoutes.js"; // <-- Thêm dòng này

export const routes = (app) => {
  app.use("/api/cart", CartRouter);
  app.use("/api/order", OrderRouter); // <-- Thêm dòng này
  app.use("/api/user", UserRouter);
  app.use("/api/discount", DiscountRouter);
};
