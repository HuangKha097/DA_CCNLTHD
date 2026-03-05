import express from 'express';
import {connectDB} from "./configs/db.js";
import dotenv from "dotenv";
import UserRoutes from "./routes/UserRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import {authenToken} from "./middlewares/AuthenToken.js";

dotenv.config();
const app = express();

connectDB()

app.use(express.json())

const books = [
    {
        id: 1,
        name: "Arthur",
        price: 100,
    }, {
        id: 2,
        name: "Bill",
        price: 200,
    }
]
app.get("/books", authenToken,(req, res) => {
    res.json({
        status: "success",
        data: books
    })
})

app.use("/api/user", UserRoutes)
app.use("/api/product", ProductRoutes)

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
})

