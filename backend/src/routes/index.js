import CartRouter from "./CartRoutes.js";
import UserRouter from "./UserRoutes.js";
import DiscountRouter from "./DiscountRoutes.js";

export const routes = (app) => {
    // app.use("/api/product", ProductRouter);
    app.use("/api/cart", CartRouter);
    // app.use("/api/order", OrderRouter);
    app.use("/api/user", UserRouter);
    app.use("/api/discount", DiscountRouter);
};




