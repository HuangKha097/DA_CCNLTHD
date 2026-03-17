import express from 'express';
import {connectDB} from "./configs/db.js";
import dotenv from "dotenv";
import cors from "cors";

import UserRoutes from "./routes/UserRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import ReviewRoutes from "./routes/ReviewRoutes.js";
import CoinRoutes from "./routes/CoinRoutes.js";
import {authenToken} from "./middlewares/AuthenToken.js";

import {routes} from './routes/index.js';


dotenv.config();
const app = express();

connectDB()

app.use(cors())
app.use(express.json())



app.use("/api/user", UserRoutes)
app.use("/api/product", ProductRoutes)
app.use("/api/review", ReviewRoutes)
app.use("/api/coin", CoinRoutes)

routes(app);


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
})

