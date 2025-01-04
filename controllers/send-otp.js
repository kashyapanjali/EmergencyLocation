const crypto = require("crypto");
const { otpStore } = require("./verify-otp");

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = generateOTP();
  const expirationTime = Date.now() + 5 * 60 * 1000; // Current time + 5 minutes
  otpStore.set(email, { otp, expirationTime });

  // Set timeout to delete OTP after 5 minutes
  setTimeout(() => {
    if (otpStore.has(email) && otpStore.get(email).otp === otp) {
      otpStore.delete(email);
    }
  }, 5 * 60 * 1000);

  const mailOptions = {
    from: "anjali.official7061@gmail.com",
    to: email,
    subject: "Your OTP for registration",
    text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`,
  };

  try {
    await req.app.locals.transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
};
