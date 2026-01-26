import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {})
        console.log("MongoDB Connected")
    }catch(error) {
        console.error("MongoDB Connected Error: ", error)
        process.exit(1); // thoat db khi loi connect
    }
}