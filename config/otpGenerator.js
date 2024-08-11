const otplib = require('otplib');
const crypto = require('crypto');
const User = require('../models/User.model')
function generateOTP() {
  const secret = otplib.authenticator.generateSecret();
  const otp = otplib.authenticator.generate(secret);
  return { otp, secret };
}

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function  storeOTP (userId, otp) {
  try {
    const otpHash = hashOTP(otp);
    const timestamp = Date.now();
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found');
    }
    user.resetOTP = otpHash
    user.otpExpires = timestamp
    await user.save()
  } catch (error) {
    throw new Error('Error storing OTP: ' + error.message);
  }
  // Store otpHash, secret, and timestamp in your database associated with userId
}


async function verifyOTP(userId, submittedOtp,res) {
    // Retrieve the stored hash and secret from the database using userId
    try {
      const user = await User.findById(userId)
      if (!user || !user.resetOTP) {
        return res.status(404).json('No OTP found');
      }
      const storedOtpHash = user.resetOTP;
      const timestamp = user.otpExpires;
    
      // Check if OTP is still valid (e.g., within 5 minutes)
      const currentTimestamp = Date.now();
      if (currentTimestamp - timestamp > 5 * 60 * 1000) {
        return res.status(400).json('OTP has expired');
      }
    
      // Verify the OTP
      const submittedOtpHash = crypto.createHash('sha256').update(submittedOtp).digest('hex');
  
    // Compare the hashed submitted OTP with the stored hashed OTP
    if (submittedOtpHash === storedOtpHash) {
      user.resetOTP = ''
      user.otpExpires = ''
      user.otpEvent = true
      user.save()
      res.send('OTP is valid You can reset your password');

    } else {
      res.status(401).send('Invalid OTP Resend the code ');
    }
    } catch (error) {
      
    return res.status(500).json('Error verifying OTP: ' + error.message);
    }
  
    // If valid, proceed with password reset
  }
module.exports = {generateOTP,verifyOTP,storeOTP}