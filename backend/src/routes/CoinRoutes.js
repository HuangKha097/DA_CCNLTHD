import express from "express";
import { 
    checkIn, 
    exchangeCoins, 
    getMyVouchers, 
    playGame, 
    submitArcadeScore 
} from "../controllers/CoinController.js";
import { authenToken } from "../middlewares/AuthenToken.js";

const router = express.Router();

router.post('/checkin', authenToken, checkIn);
router.post('/exchange', authenToken, exchangeCoins);
router.get('/my-vouchers', authenToken, getMyVouchers);
router.post('/play-game', authenToken, playGame);
router.post('/arcade-submit', authenToken, submitArcadeScore);

export default router;
