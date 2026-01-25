import express from 'express';
import tasksRoutes from "./routes/tasksRoutes.js";
import {connectDB} from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();

connectDB()

app.use("/api/tasks",tasksRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
})

