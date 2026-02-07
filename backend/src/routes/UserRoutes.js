import express from "express";

import {signUp, login, logout, getUserInfoById, updateProfile, removeAddress, addAddress } from "../controllers/UserController.js";
import {authenToken} from "../middlewares/AuthenToken.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post('/signup', signUp);
router.post('/login', login);

// --- PRIVATE ROUTES ---

router.post('/logout', authenToken, logout);


router.get('/info/:userId', authenToken, getUserInfoById);
router.put('/update/:userId', authenToken, updateProfile);


router.post('/address/:userId', authenToken, addAddress);
router.delete('/address/:userId/:addressIndex', authenToken, removeAddress);


export default router;