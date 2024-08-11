const express = require("express")
const User = require("../models/User.model")
const router = express.Router()
const JWT = require("jsonwebtoken")
const Notification = require("../models/Notification.model")
const bcrypt = require("bcrypt")
const multer = require("multer")
const nodemailer = require("nodemailer");
const uploadOnCloudinary = require("../config/cloudinaryConfig")
const { generateToken, verifyToken } = require("../config/JWT")
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

router.post('/auth/register', upload.single('profileImg'), async (req, res) => {
  const { email, password, username, name } = req.body
  const filePath = req.file.path;
  try {
    if (!filePath) {
      return res.status(400).json({ error: 'Profile image is required' });
    }
    const result = await uploadOnCloudinary(filePath);
    if (!result) {
      return res.status(500).json({ error: 'Failed to upload image' });
    }
    const profileImg = result.secure_url;
    const user = new User({
      name,
      username,
      profileImg,
      password,
      email
    });

    await user.save();

    // Attach the new user to the req object
    req.user = user;
    const generatedToken = generateToken(user._id)
    res.cookie('token', generatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
    });
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
        to: `${user.email}`, // list of receivers
        subject: `Welcome to Whistle - We're Excited to Have You!`, // Subject line
        html: `<!DOCTYPE html>
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
        <h2>Hi ${user.name},</h2>
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
      console.log("Message sent: %s", info.messageId)
} catch (error) {
  console.log("Email couldn't be send because ",error);
  
}

    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      token: generatedToken,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password) {
      return res.status(400).send('Email and password are required');
    }
    const user = await User.findOne({ email});
    console.log(user)
    if (!user) {
      return res.status(400).send('User not found');
    }
    console.log(bcrypt.compare(password,user.password))
    const isMatch = await bcrypt.compare(password, user.password);
    // const isMatch = user.password === password
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }
    const token = generateToken(user._id);
  
          res.cookie('token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 3600000, // 1 hour
          });
  
          res.json({
              _id: user._id,
              name: user.name,
              email: user.email,
          });
  } catch (error) {
    res.status(401).json({ message: 'Invalid email or password' });
  }
})
router.post('/auth/logout',async(req,res)=>{
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = verifyToken(token)
    console.log(decoded);
    if(decoded){
      res.cookie('token', '', { httpOnly: true, expires: new Date(0) }); // Set the expiration to a past date
    
    res.status(200).send('Logout successful');
    }
    else{
      return res.status(401).json({ error: 'noone logged in ' });

    }
  } catch (error) {
    res.status(404).json({message:"Error in logging out seems like noone is logged in "})
  }
})
router.post('/users/find',async(req,res)=>{
  const token = req.cookies.token;
  const username = req.query

  
  try {
    const decoded = verifyToken(token)
    console.log(decoded);
    
      
      console.log(username)
      const user = await User.findOne(username)
      console.log(user);
      if (!user) {
        
        res.status(404).json({message:"No username exits"})
      }
      res.status(200).json(user)
    
  } catch (error) {
    res.status(404).json({message:`Login to search ${username.username}`})
    
  }
})
router.get('/users',async(req,res)=>{
  try {
  //   const token = req.cookies.token;
  // const decoded = verifyToken(token)
  // console.log(decoded.id);
  // if(!decoded){
    
  //   return res.status(401).json({ error: `Start using twitter by signing up !` });
  // }
  
    const users = await User.find()
    res.status(200).send(users);
  } catch (error) {
   return res.status(401).json({ error: `Error while getting the users` });
  }
})
router.delete('/users/del',async(req,res)=>{
  const {id} = req.query
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up ! authetication error` });
  }
  if(decoded.id ==id){
 const user = await User.findByIdAndDelete({_id:id})
      res.status(200).send(user);
    }
    else{
  return res.status(401).json({ error: `you cant delete this account` });
}
  }
   catch (error) {
   return res.status(401).json({ error: `Error while deleting the users` });
  }
})
router.get('/users/current', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }


    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error while updating the user' });
  }
});
router.put('/users/edit', async (req, res) => {
  const { bio, name } = req.body;
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }

    const updateData = {};
    if (bio) updateData.bio = bio;
    if (name) updateData.name = name;

    const user = await User.findByIdAndUpdate(decoded.id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error while updating the user' });
  }
});
router.post('/users/:userId/follow',async(req,res)=>{
  const { entityType} = req.body;
  
  if (!entityType) {
    return res.status(400).json({ error: 'entityType and content are required' });
  }

  try {
    const userIdToFollow = req.params.userId;
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }
    const currentUserId = decoded.id
    if (userIdToFollow === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }
    const userToFollow = await User.findById(userIdToFollow);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userToFollow.followers.includes(currentUserId)) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    // Add follower and following
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();
    const currentUser = await User.findById(currentUserId);
    currentUser.following.push(userIdToFollow);
    await currentUser.save();
    
    const notification = new Notification({
      user: userIdToFollow,
      sender: currentUserId,
      type: 'follow',
      content: `${currentUser.username} started following you`,
      entityType
    });
    await notification.save();

    userToFollow.notifications.push(notification._id);
    await userToFollow.save();

    res.status(200).json({ message: 'Followed user successfully',notification:notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})
router.post('/users/:userId/unfollow',async(req,res)=>{
  try {
    const {userId} = req.params;
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }
    const currentUserId = decoded.id
    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);
    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userToUnfollow.followers.includes(currentUserId)) {
      // Remove current user from target user's followers list
      userToUnfollow.followers = userToUnfollow.followers.filter(followerId => followerId.toString() !== currentUserId);
      await userToUnfollow.save();

      // // Remove target user from current user's following list
      currentUser.following = currentUser.following.filter(followingId => followingId.toString() !== userId);
      await currentUser.save();
      const notification = await Notification.findOne({
       user: userId,
       sender: currentUserId,
       type: 'follow',
      });
      console.log("notification._id = ",notification._id);
      if (notification._id) {
        userToUnfollow.notifications = userToUnfollow.notifications.filter(
          notifId => {
            console.log("notifId = ",notifId);
            const shouldKeep = notifId.toString() !== notification._id.toString();
        console.log(shouldKeep ? "keeping notification" : "deleting from notification array");
        return shouldKeep;
          }
        );
        await userToUnfollow.save();
      }
      const notifcationdel = await Notification.findByIdAndDelete(notification._id)
            
      res.status(200).json({ message: 'Unfollowed user successfully',deletedNoti:notifcationdel });
    } else {
      res.status(400).json({ error: 'You are not following this user' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})
router.get('/users/current/following', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.following || user.following.length === 0) {
      return res.status(200).json({ message: 'You are not following anyone yet. Start following others to see their updates.' });
    }
    let allFollowing = [];
    for (const followingUser of user.following) {
      const fuser = await User.findById(followingUser);
      allFollowing.push(fuser);
    }
    res.status(200).json(allFollowing);
  } catch (error) {
    res.status(500).json({ error: 'Error while updating the user' });
  }
});
router.get('/users/current/followers', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication token is missing' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Authentication error' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.followers || user.followers.length === 0) {
      return res.status(200).json({ message: 'You have no followers yet. Share your profile to gain followers.' });
    }

    let allFollowers = [];
    for (const followersUser of user.followers) {
      const fuser = await User.findById(followersUser);
      allFollowers.push(fuser);
    }
    if(allFollowers.length>0){

      res.status(200).json(allFollowers);
    }
    else{
      res.status(200).json({});

    }
  } catch (error) {
    res.status(500).json({ error: 'Error while updating the user' });
  }
});
router.get('/users/notifications',async(req,res)=>{
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  console.log(decoded.id);
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up !` });
  }
  const user = await User.findById(decoded.id);
  if (!user.notifications || user.notifications.length === 0) {
    return res.status(200).json({ message: 'You have no new notifications.' });
  }
  let allNotifications = [];
    for (const userNoti of user.notifications) {
      const userNotifications = await Notification.find(userNoti)
     
      allNotifications.push(userNotifications);
    }
    res.status(200).json(allNotifications);
  } catch (error) {
   return res.status(401).json({ error: `Error while getting the notifications ${error}` });
  }
})
router.get('/users/notificationsall',async(req,res)=>{
  try {
    const token = req.cookies.token;
  const decoded = verifyToken(token)
  console.log(decoded.id);
  if(!decoded){
    
    return res.status(401).json({ error: `Start using twitter by signing up !` });
  }
      const userNotifications = await Notification.find()
     
    res.status(200).json(userNotifications);
  } catch (error) {
   return res.status(401).json({ error: `Error while getting the notifications ${error}` });
  }
})
module.exports = router