const crypto = require("crypto");
const { otpStore } = require("./verify-otp");


function generateOTP() {
   return crypto.randomInt(100000, 999999).toString();
}

exports.sendOTP = async (req, res) => {
     try {
         const { email } = req.body;
         
         // Email validation
         if (!email) {
             return res.status(400).json({ message: "Email is required" });
         }
         
         // Basic email format validation
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: "Invalid email format" });
         }

         const otp = generateOTP();
         const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes
         
         // Store OTP with expiration in the Map
         otpStore.set(email, { 
             otp, 
             expirationTime,
             attempts: 0
         });

         // Set timeout to delete OTP after 5 minutes
         setTimeout(() => {
             if (otpStore.has(email) && otpStore.get(email).otp === otp) {
                 otpStore.delete(email);
             }
         }, 5 * 60 * 1000);

         // Check if transporter exists
         if (!req.app.locals.transporter) {
			return res.status(500).json({ 
				message: "Email service not configured", 
				error: "Email transporter is missing" 
			});
		}

         // Send email using the transporter
         const mailOptions = {
             from: process.env.EMAIL_USER,
             to: email,
             subject: "Your OTP for registration",
             text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`,
         };

         try {
             await req.app.locals.transporter.sendMail(mailOptions);
             res.json({ message: "OTP sent successfully" });
         } catch (emailError) {
             console.error("Email sending error:", emailError);
             return res.status(500).json({ 
                 message: "Failed to send email", 
                 error: emailError.message 
             });
         }
     } catch (error) { 
         res.status(500).json({ 
             message: "Error sending OTP", 
             error: error.message,
             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
         });
     }
};