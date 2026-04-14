import express from "express";

import {signUp, login, logout, getUserInfoById, updateProfile, changePassword, removeAddress, addAddress, refreshTokenService }
        from "../controllers/UserController.js";
import {authenToken, isCurrentUserProfile} from "../middlewares/AuthenToken.js";

const router = express.Router();

//   PUBLIC ROUTES
router.post('/signup', signUp);
router.post('/login', login);

//  PRIVATE ROUTES
router.post('/logout', authenToken, logout);


router.get('/info/:userId', authenToken, getUserInfoById);
router.put('/update/:userId', authenToken, isCurrentUserProfile, updateProfile);
router.put('/password/:userId', authenToken, isCurrentUserProfile, changePassword);


router.post('/address/:userId', authenToken, isCurrentUserProfile, addAddress);
router.delete('/address/:userId/:addressIndex', authenToken, isCurrentUserProfile, removeAddress);

// REFRESH TOKEN
router.post('/refresh-token/:userId', refreshTokenService);

export default router;