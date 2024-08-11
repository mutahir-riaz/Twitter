const express = require("express")
const User = require("../models/User.model")
const Tweet = require("../models/Tweet.model")
const otplib = require('otplib');
const Notification = require("../models/Notification.model")
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const router = express.Router()
const JWT = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const multer = require("multer")
const cloudinary = require('cloudinary').v2;
const getPublicIdFromUrl = require("../config/getPublicIdFromUrl")
const uploadOnCloudinary = require("../config/cloudinaryConfig")
const { generateToken, verifyToken } = require("../config/JWT")
const sendEmail = require("../config/sendEmail")
const {generateOTP,verifyOTP,storeOTP} = require("../config/otpGenerator");
const { log } = require("console");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post('/twitter/create',upload.array('media'),async(req,res)=>{
const {content} = req.body
const token = req.cookies.token 
try {
    const decoded = verifyToken(token)
    if(!decoded){
        return res.status(401).json({ error: 'Authentication error. Please sign in.' });
    }
    const currentUserId = decoded.id
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadOnCloudinary(file.path); 
        mediaUrls.push(result.secure_url);
      }
    }    
    const newTweet = new Tweet({
        author: currentUserId,
        content,
        media: mediaUrls
      });
      await newTweet.save();
      const user = await User.findById({_id:decoded.id})
      console.log(user);
      user.tweets.push(newTweet._id)
      await user.save()
      res.status(201).json(newTweet);

} catch (error) {
    
    res.status(500).json({ error: error.message });
}
})
router.get("/twitter/getall",async(req,res)=>{
  const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }try {
      
      const allTweets = await Tweet.find()
      res.status(200).send(allTweets);
    } catch (error) {
   return res.status(401).json({ error: `Error while getting the users` });
    }
})
router.delete('/twitter/del',async(req,res)=>{
  const {id} = req.query
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up ! authetication error` });
  }
  const tweetId = await Tweet.findById({_id:id})
  if(decoded.id ==tweetId.author){
 const Tweetdeleted = await Tweet.findByIdAndDelete({_id:id})
      res.status(200).send(Tweetdeleted);
    }
    else{
  return res.status(401).json({ error: `you cant delete this Tweet` });
}
  }
   catch (error) {
   return res.status(401).json({ error: `Error while deleting the Tweet` });
  }
})
router.get("/twitter/get",async(req,res)=>{
  const {context} = req.body
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up ! authetication error` });
  }
  const tweets = await Tweet.find({ content: { $regex: context, $options: 'i' } });
      res.status(200).send(tweets);
    
  }
   catch (error) {
   return res.status(401).json({ error: `Error while getting the Tweet` });
  }
})
router.get('/users/tweets',async(req,res)=>{
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  console.log(decoded.id);
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up !` });
  }
  const user = await User.findById(decoded.id);
  if (!user.tweets || user.tweets.length === 0) {
    return res.status(200).json({ message: 'You have no new Tweets.' });
  }
  let allTweets = [];
    for (const userTweet of user.tweets) {
      const userTwt = await Tweet.findById(userTweet)
     
      allTweets.push(userTwt);
    }
    res.status(200).json(allTweets);
  } catch (error) {
   return res.status(401).json({ error: `Error while getting the notifications ${error}` });
  }
})
router.get('/users/tweets/:id',async(req,res)=>{
  const accountId = req.params.id;
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  console.log(decoded.id);
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up !` });
  }
  const user = await User.findById(accountId);
  if (!user.tweets || user.tweets.length === 0) {
    return res.status(200).json({ message: 'You have no Tweets.' });
  }
  let allTweets = [];
    for (const userTweet of user.tweets) {
      const userTwt = await Tweet.findById(userTweet)
     
      allTweets.push(userTwt);
    }
    res.status(200).json(allTweets);
  } catch (error) {
   return res.status(401).json({ error: `Error while getting the notifications ${error}` });
  }
})
router.put('/twitter/edit', async (req, res) => {
  const { tweetId, newContent, mediaToDelete } = req.body;
  try {
    const token = req.cookies.token;
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Start using Twitter by signing up! Authentication error.' });
    }
    
    // Find the tweet by ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    // Update tweet content
    tweet.content = newContent;
    
    // Handle media deletion
    if (mediaToDelete && mediaToDelete.length > 0) {
      for (const mediaUrl of mediaToDelete) {
        console.log(mediaUrl)
        // Extract public ID from the URL
        const publicId = getPublicIdFromUrl(mediaUrl);
        console.log(publicId)
        
        // Remove the media from Cloudinary
        // await cloudinary.uploader.destroy(publicId);
        await cloudinary.uploader.destroy(publicId);

        // Remove the media reference from the tweet's media array
        tweet.media = tweet.media.filter(media => media !== mediaUrl);
      }
    }

    // Save the updated tweet
    await tweet.save();

    res.status(200).json({ message: 'Tweet updated successfully', tweet });
  } catch (error) {
    return res.status(500).json({ error: 'Error while updating the Tweet' });
  }
});
router.put('/twitter/like-dislike/:id', async (req, res) => {
  const tweetId = req.params.id;
  try {
    const token = req.cookies.token;
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error. Please sign up to use Twitter.' });
    }

    const currentUser = await User.findById(decoded.id);
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (currentUser.likes.includes(tweetId) && tweet.likes > 0) {
      currentUser.likes = currentUser.likes.filter(followerId => followerId.toString() !== tweetId);
      await currentUser.save(); // Save currentUser changes

      tweet.likes -= 1;
      await tweet.save(); // Save tweet changes
      const notification = await Notification.findOne({
        user: tweet.author,
        sender: decoded.id,
        post:tweetId,
        type: 'like',
       });
       console.log("notification._id = ",notification);
       
    const tweetUser = await User.findById(tweet.author)
       if (notification._id) {
        tweetUser.notifications = tweetUser.notifications.filter(
           notifId => {
             console.log("notifId = ",notifId);
             const shouldKeep = notifId.toString() !== notification._id.toString();
             console.log(shouldKeep ? "keeping notification" : "deleting from notification array");
             return shouldKeep;
           }
         );
         await tweetUser.save();}
        
      
         const notifcationdel = await Notification.findByIdAndDelete(notification._id)
    return res.status(200).json({ message: 'Tweet disliked successfully', tweet: tweet });
    } else {
      currentUser.likes.push(tweetId);
      await currentUser.save(); // Save currentUser changes

      tweet.likes += 1;
      await tweet.save(); // Save tweet changes
      const notification = new Notification({
        user: tweet.author,
        sender: decoded.id,
        post:tweetId,
        type: 'like',
        content: `${currentUser.username} liked your tweet`,
        entityType:'liked'
      });
    await notification.save();
    const tweetUser = await User.findById(tweet.author)
    tweetUser.notifications.push(notification._id)
    await tweetUser.save();
    }

    return res.status(200).json({ message: 'Tweet liked successfully', user: currentUser, tweet: tweet });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/twitter/repost/:id', async (req, res) => {
  const tweetId = req.params.id;
  try {
    const token = req.cookies.token;
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error. Please sign up to use Twitter.' });
    }

    const currentUser = await User.findById(decoded.id);
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if(!currentUser.tweets.includes(tweetId))
    {
    if (currentUser.retweets.includes(tweetId) && tweet.retweets > 0) {
      currentUser.retweets = currentUser.retweets.filter(followerId => followerId.toString() !== tweetId);
      await currentUser.save(); // Save currentUser changes

      tweet.retweets -= 1;
      await tweet.save(); // Save tweet changes
      const notification = await Notification.findOne({
        user: tweet.author,
        sender: decoded.id,
        post:tweetId,
        type: 'retweet',
       });
       console.log("notification._id = ",notification);
       
    const tweetUser = await User.findById(tweet.author)
       if (notification._id) {
        tweetUser.notifications = tweetUser.notifications.filter(
           notifId => {
             console.log("notifId = ",notifId);
             const shouldKeep = notifId.toString() !== notification._id.toString();
             console.log(shouldKeep ? "keeping notification" : "deleting from notification array");
             return shouldKeep;
           }
         );
         await tweetUser.save();}
        
      
         const notifcationdel = await Notification.findByIdAndDelete(notification._id)
    return res.status(200).json({ message: 'Tweet untweeted successfully', user: currentUser, tweet: tweet });
    } else {
      currentUser.retweets.push(tweetId);
      await currentUser.save(); // Save currentUser changes

      tweet.retweets += 1;
      await tweet.save(); // Save tweet changes
      const notification = new Notification({
        user: tweet.author,
        sender: decoded.id,
        post:tweetId,
        type: 'retweet',
        content: `${currentUser.username} retweet your tweet`,
        entityType:'retweet'
      });
    await notification.save();
    const tweetUser = await User.findById(tweet.author)
    tweetUser.notifications.push(notification._id)
    await tweetUser.save();
    }
return res.status(200).json({ message: 'Tweet retweeted successfully', user: currentUser, tweet: tweet });}
else{
  return res.status(404).json({ message: 'You cant retweet your tweet'});
}
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.put('/twitter/reply/:id',upload.array('media'),async(req,res)=>{
  const tweetId = req.params.id
  const {content} = req.body
const token = req.cookies.token 
try {
    const decoded = verifyToken(token)
    if(!decoded){
        return res.status(401).json({ error: 'Authentication error. Please sign in.' });
    }
    const currentUserId = decoded.id
    const parentTweet = await Tweet.findById(tweetId) 
      const user = await User.findById(currentUserId)
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadOnCloudinary(file.path); 
        mediaUrls.push(result.secure_url);
      }
    }    
    const newTweet = new Tweet({
        author: currentUserId,
        content,
        type:"reply",
        media: mediaUrls,
        parentTweet:tweetId,
        isReply: true
      });
      await newTweet.save();
    //   console.log(user);
    //   user.tweets.push(newTweet._id)
    parentTweet.replies.push(newTweet._id)
      await parentTweet.save()
      const notification = new Notification({
        user: parentTweet.author,
        sender: decoded.id,
        post:newTweet._id,
        type: 'reply',
        content: `${user.username} replied to your tweet`,
        entityType:'reply'
      });
    await notification.save();
    const tweetUser = await User.findById(parentTweet.author)
    tweetUser.notifications.push(notification._id)
    await tweetUser.save();
      res.status(201).json(parentTweet);

} catch (error) {
    
    res.status(500).json({ error: error.message });
}
})
router.get('/twitter/children/:id',async(req,res)=>{
  try {
    const tweetId = req.params.id
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }

    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
      return res.status(404).json({ error: 'tweet not found' });
    }
    
    if (!tweet.replies || tweet.replies.length === 0) {
      return res.status(200).json({ message: 'You have no replies yet. Share your tweet to gain feedback.' });
    }
    
    let allTweets = [];
    for (const singTweet of tweet.replies) {
      const fuser = await Tweet.findById(singTweet);
      console.log(fuser);
      allTweets.push(fuser);
    }

      res.status(200).json(allTweets);
    
  } catch (error) {
    res.status(500).json({ error: 'Error while getting the tweet' });
  }
})
router.get('/twitter/feed',async(req,res)=>{
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }
    const currentUser = await User.findById(decoded.id)
    // const user = await User.findById(decoded.id);
  if (!currentUser.following || currentUser.following.length === 0) {
    return res.status(200).json({ message: 'You have no new Tweets.' });
  }
  
  let allTweets = [];
  for(const user of currentUser.following){
    const myUser = await User.findById(user)
    console.log(myUser);
    if(myUser.tweets>0){
    for (const userTweet of myUser.tweets) {
      const userTwt = await Tweet.findById(userTweet)
      
      allTweets.push(userTwt);
    }}
  }
    return res.status(200).json(allTweets);

  } catch (error) {
    res.status(500).json({ error: 'Error while getting the tweet' });
  }
})
router.post('/twitter/email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Welcome to Whistle" <syedmutahir908@gmail.com>', // sender address
      to: "syntaxsmith.dev@gmail.com", // list of receivers
      subject: "Welcome to Whistle - We're Excited to Have You!", // Subject line
  // plain text body
      html:`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .email-container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #007bff;
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 8px 8px 0 0;
        text-align: center;
      }
      .header h1 {
        margin: 0;
      }
      .content {
        padding: 20px;
      }
      .content h2 {
        color: #333333;
      }
      .content p {
        color: #555555;
      }
      .content ul {
        list-style-type: none;
        padding: 0;
      }
      .content ul li {
        background-color: #f9f9f9;
        margin: 10px 0;
        padding: 10px;
        border-radius: 4px;
        color: #333333;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #888888;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>Welcome to Whistle</h1>
      </div>
      <div class="content">
        <h2>Hi Syed Mutahir,</h2>
        <p>Welcome to Whistle community!</p>
        <p>We're thrilled you've joined our community. Whether you're here to [mention key activity or benefit], we're sure you'll find something you love.</p>
        <p>To get started, here are a few things you can do right away:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Explore popular content</li>
          <li>Join our forum discussions</li>
        </ul>
        <p>If you have any questions or need assistance, don't hesitate to reach out. We're here to help!</p>
      </div>
      <div class="footer">
        Cheers,<br>
        The Whistle Team
      </div>
    </div>
  </body>
  </html>
  `, // html body
    });

    console.log("Message sent: %s", info.messageId);
    
    return res.status(200).json({ message: "sent successfully", info });
  } catch (error) {
    return res.status(401).json({ error: error });
  }
});
router.post('/otp/verify',async(req,res)=>{
  try {
    const { email, submittedOtp } = req.body;
    const user = await User.find({email:email})
      verifyOTP(user[0]._id,submittedOtp,res)
      // console.log(user);
      
  } catch (error) {
    return res.status(500).json('Error verifying OTP: ' + error.message);
    
  }

})
router.post('/otp/request',async(req,res)=>{
  try {
    const {email} = req.body
    const { otp, secret }= generateOTP()
    const user = await User.find({email:email})
    storeOTP(user[0]._id,otp,secret)
    sendEmail(email,otp)
    // res.status(200).send(user[0]._id);
    
    res.status(200).json({message:"successful generated otp"})
  } catch (error) {
    res.status(404).json({error})
    
  }
})
router.post('/users/reset/currentpassword',async(req,res)=>{
  try {
    const {email,password,ConfirmPassword} = req.body
    const userEmail = await User.find({email:email})
    const user = await User.findById(userEmail[0]._id)
    if(!userEmail){
      return res.status(404).json({Error:"No user Found"})
    }
    if(userEmail[0].otpEvent){
    if(password==ConfirmPassword ){
      user.password = password
      // const updatedUser = await User.findByIdAndUpdate(userEmail[0]._id,{password:password})
      user.otpEvent = false
     await user.save()
      res.status(200).json({Message:"Successfully updated the password",Doc:user})
    }
    else{
      res.status(404).json({Error:"Password Should match"})

    }}
    else{
      res.status(404).json({Error:"First verify your OTP"})

    }
  } catch (error) {
    res.status(404).json({error})
    
  }
})

module.exports = router