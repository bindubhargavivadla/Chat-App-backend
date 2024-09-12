const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        // Enable mongoose query logging
        mongoose.set('debug', true);    
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(`Error: ${error.message}`)
    }
}

module.exports = connectDB