const nodemailer = require('nodemailer');

const sendResetEmail = async (userEmail, username) => {
  // Ethereal is a fake email inbox used for testing.
  // It does not send real emails, but it gives you a preview link.
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(userEmail)}`;

  const mailOptions = {
    from: '"CampusCare Admin" <admin@campuscare.edu>',
    to: userEmail,
    subject: 'CampusCare - Password Reset Request',
    text: `Hello ${username}, reset your password here: ${resetLink}`,
    html: `
      <p>Hello <b>${username}</b>,</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log('Password reset email sent:', info.messageId);
  console.log('Preview URL:', previewUrl);

  return previewUrl;
};

module.exports = sendResetEmail;