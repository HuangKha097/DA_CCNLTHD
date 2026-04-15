import express from "express";

import {login, showAllInfo, signUp, updateShopInfor, searchShops, disableShop, deleteShop} from "../controllers/ShopController.js";
import {authenToken, isCurrentShop, isCurrentUserProfile} from "../middlewares/AuthenToken.js";

const router = express.Router();

router.get("/search", searchShops);
router.post("/info", showAllInfo); // Public access for shop details
router.get("/show-all-information", authenToken, showAllInfo);
router.post("/signup", authenToken, signUp);
// router.post("/login", login);
router.put("/update", authenToken, isCurrentShop, updateShopInfor);
router.put("/disable", authenToken, isCurrentShop, disableShop);
router.delete("/:shopId", authenToken, isCurrentShop, deleteShop);

export default router;
