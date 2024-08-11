const nodemailer = require('nodemailer');

async function sendEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: '"Whistle (Next Twitter)" <syedmutahir908@gmail.com>',
    to: to,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is ${otp}`
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail