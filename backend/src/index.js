import express from 'express';
import {connectDB} from "./configs/db.js";
import dotenv from "dotenv";
import {routes} from './routes/index.js';

dotenv.config();
const app = express();

connectDB()

app.use(express.json())


routes(app);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
})

