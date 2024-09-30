const otpStore = new Map();

exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const storedData = otpStore.get(email);
  if (!storedData) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  const { otp: storedOTP, expirationTime } = storedData;

  if (Date.now() > expirationTime) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (storedOTP !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP is valid
  otpStore.delete(email);
  res.json({ message: "OTP verified successfully" });
};

// Export otpStore to be used in other controllers
exports.otpStore = otpStore;
