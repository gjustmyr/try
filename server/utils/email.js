const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

// Send OTP verification email
const sendOtpEmail = async (email, otp) => {
	const mailOptions = {
		from: `"MultiShop Marketplace" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Verify Your Email - OTP Code",
		html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; text-align: center; }
          .otp-box { background: white; border: 2px solid #ff6b35; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .warning { background: #fff5f2; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0; text-align: left; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Thank you for registering on MultiShop Marketplace.</p>
            <p>Please use the following OTP code to verify your email address:</p>
            <div class="otp-box">${otp}</div>
            <div class="warning">
              <strong>⏱️ This code will expire in 15 minutes.</strong><br>
              Do not share this code with anyone.
            </div>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>&copy; 2026 MultiShop Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log("OTP email sent to:", email);
	} catch (error) {
		console.error("Error sending OTP email:", error);
		throw new Error("Failed to send OTP email");
	}
};

// Send approval notification email
const sendApprovalEmail = async (email, shopName) => {
	const mailOptions = {
		from: `"MultiShop Marketplace" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Seller Application Approved - MultiShop",
		html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #ff6b35; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <h2>Your Seller Application is Approved</h2>
            <p>Great news! Your seller application for <strong>${shopName}</strong> has been approved.</p>
            <p>You can now start selling on MultiShop Marketplace.</p>
            <a href="${process.env.FRONTEND_URL || "http://localhost:4200"}/seller/dashboard" class="button">Go to Dashboard</a>
            <p>Start by adding your products and setting up your shop profile.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MultiShop Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log("Approval email sent to:", email);
	} catch (error) {
		console.error("Error sending approval email:", error);
	}
};

// Send rejection notification email
const sendRejectionEmail = async (email, shopName, reason) => {
	const mailOptions = {
		from: `"MultiShop Marketplace" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Seller Application Update - MultiShop",
		html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .reason { background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
          </div>
          <div class="content">
            <h2>Seller Application Status</h2>
            <p>Thank you for your interest in selling on MultiShop Marketplace.</p>
            <p>Unfortunately, we are unable to approve your application for <strong>${shopName}</strong> at this time.</p>
            <div class="reason">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            <p>You may reapply after addressing the issues mentioned above.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MultiShop Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log("Rejection email sent to:", email);
	} catch (error) {
		console.error("Error sending rejection email:", error);
	}
};

module.exports = {
	sendOtpEmail,
	sendApprovalEmail,
	sendRejectionEmail,
};
