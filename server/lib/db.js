import mongoose from 'mongoose'

//function to connect the mongodb database
export const connectDB = async()=> {
    try {
        mongoose.connection.on('connected',()=>console.log('Database connected'));
        await mongoose.connect(`${process.env.MONGODB_URI}/chat_App`)
    } catch (error) {
      console.log(error);
        
    }
}