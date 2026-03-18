import express from "express";

import {login, showAllInfo, signUp, updateShopInfor, searchShops} from "../controllers/ShopController.js";
import {authenToken} from "../middlewares/AuthenToken.js";

const router = express.Router();

router.get("/search", searchShops);
router.post("/info", showAllInfo); // Public access for shop details
router.get("/show-all-information", authenToken, showAllInfo);
router.post("/signup", authenToken, signUp);
router.post("/login", login);
router.put("/update", authenToken, updateShopInfor);

export default router;
