import express from "express";

import {signUp, login, logout, getUserInfoById, updateProfile, changePassword, removeAddress, addAddress, refreshTokenService }
        from "../controllers/UserController.js";
import {authenToken} from "../middlewares/AuthenToken.js";

const router = express.Router();

//   PUBLIC ROUTES
router.post('/signup', signUp);
router.post('/login', login);

//  PRIVATE ROUTES
router.post('/logout', authenToken, logout);


router.get('/info/:userId', authenToken, getUserInfoById);
router.put('/update/:userId', authenToken, updateProfile);
router.put('/password/:userId', authenToken, changePassword);


router.post('/address/:userId', authenToken, addAddress);
router.delete('/address/:userId/:addressIndex', authenToken, removeAddress);

// REFRESH TOKEN
router.post('/refresh-token/:userId', refreshTokenService);

export default router;