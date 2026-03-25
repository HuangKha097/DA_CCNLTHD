import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDB } from './src/configs/db.js';
import User from './src/models/User.js';

dotenv.config();

const run = async () => {
    try {
        await connectDB();
        const adminEmail = "admin123@gmail.com";
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            const passwordHash = await bcrypt.hash("123456", 10);
            await User.create({
                name: "System Admin",
                email: adminEmail,
                password: passwordHash,
                roles: ["admin", "user"]
            });
            console.log("SUCCESS: Admin account created successfully! You can now log in.");
        } else {
            console.log("INFO: Admin account already exists in the database. You can log in.");
            
            // Just in case it existed but didn't have the admin role:
            if (!adminExists.roles.includes('admin')) {
                adminExists.roles.push('admin');
                await adminExists.save();
                console.log("INFO: Added 'admin' role to existing account.");
            }
        }
    } catch (error) {
        console.error("ERROR:", error);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

run();
