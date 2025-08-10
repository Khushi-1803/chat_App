import User from "../models/user.models.js";
import Message from "../models/message.models.js";
import cloudinary from "../lib/cloudinary.js";
import { json } from "express";
import {io,userSocketMap} from '../server.js'

//get all users except loggedin Users
export const getUsersForSidebar = async(req,res) =>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:userId}}).select("-password");

        //conunt number of messgaes not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId, seen:false})
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises)
        res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
        
    }
}
//get all messages for selected users
export const getMessages = async(req,res)=>{
    try {
       const {id:selecctedUserId} = req.params;
       const myId = req.user._id;
       
       const messages = await Message.find({
        $or:[
            {senderId:myId, receiverId: selecctedUserId},
            {senderId:selecctedUserId, receiverId: myId},
        ]
       })
       await Message.updateMany({senderId:selecctedUserId,receiverId:myId},
        {seen:true});
        res.json({success:true,messages})
       
    } catch (error) {
       console.log(error.message);
       res.json({success:false,message:error.message}) 
    }
}
//api to mark message as seen using message id
export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
        
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message}) 
    }
}


//send message to selected user
export const sendMessage = async(req,res)=>{
    try {
        const {text,image} = req.body
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })
        //emit the new message to reciver socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        res.json({success:true,newMessage})
    } catch (error) {
      console.log(error.message);
    res.json({success:false,message:error.message})  
    }
}