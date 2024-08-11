const mongoose = require("mongoose")
const notificationSchema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        sender:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        type:{
            type:String,
            enum:['follow', 'mention', 'like', 'retweet', 'reply'],
            required:true
        },
        content:{
            type:String,
            required:true
        },
        entity:{
            type:mongoose.Schema.Types.ObjectId,
            refPath:"entityType"
        },
        post:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tweet',
        },
        entityType: {
            type: String,
            enum: ['Tweet', 'User',"follow",'liked','retweet','reply'],
            required: true,
          },
          isRead: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
        {
          timestamps: true,
        }
      

    
)

      
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;