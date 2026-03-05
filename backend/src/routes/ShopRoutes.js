import express from "express";

import { signUp, login, updateShopInfor, showAllInfo } from "../controllers/ShopController.js";

const router = express.Router();

router.get("/show-all-information", showAllInfo);
router.post("/signup", signUp);
router.post("/login", login);
router.put("/update", updateShopInfor);

export default router;
