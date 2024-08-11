const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Schema = mongoose.Schema
const userSchema = new Schema({
    profileImg:{
        type:String
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true
      },
      password: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      bio: {
        type: String,
        maxLength: 160
      },
    followers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    otpEvent:{
      type:Boolean,
      default:false
    },
    following:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    pending:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    headerImage: {
        type: String, // URL to the user's profile header image
      },
      tweets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }],
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }],
      retweets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }],
      bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      }],
      notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      },
    updatedNow:{
        type:Date,
        default:Date.now
    },
    resetOTP: { type: String },
    otpExpires: { type: Date }
    ,
    replies:[{
type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
    }]

}
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
      return next();
  }
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (err) {
      next(err);
  }
});
const User = mongoose.model('User',userSchema)
module.exports = User