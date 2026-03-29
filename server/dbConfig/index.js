import mongoose from 'mongoose';

export const dbConnection = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
        // console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);// Exit process with failure 0 means success 1 means failure 
    }
}