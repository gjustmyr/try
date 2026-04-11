const authService = require("../services/auth.service");

// Login for all user types
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Email and password are required",
			});
		}

		const user = await authService.findUserByEmail(email);

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		if (!user.isActive) {
			return res.status(403).json({
				success: false,
				message: "Your account has been deactivated",
			});
		}

		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		if (!user.emailVerified && user.userType !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Please verify your email before logging in",
			});
		}

		if (user.userType === "seller") {
			if (!user.sellerProfile) {
				return res.status(403).json({
					success: false,
					message: "Seller profile not found",
				});
			}

			if (user.sellerProfile.approvalStatus === "pending") {
				return res.status(403).json({
					success: false,
					message: "Your seller application is pending approval",
				});
			}

			if (user.sellerProfile.approvalStatus === "rejected") {
				return res.status(403).json({
					success: false,
					message: "Your seller application was rejected",
				});
			}
		}

		const token = authService.generateToken(user);
		await authService.updateLastLogin(user);
		const responseData = authService.buildLoginResponse(user, token);

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: responseData,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Login failed",
			error: error.message,
		});
	}
};

// Get current user profile
exports.getProfile = async (req, res) => {
	try {
		const user = await authService.findUserById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get profile",
			error: error.message,
		});
	}
};

// Logout (optional - mainly for client-side token removal)
exports.logout = async (req, res) => {
	res.status(200).json({
		success: true,
		message: "Logout successful",
	});
};

// Register customer account
exports.register = async (req, res) => {
	try {
		const { fullName, email, password } = req.body;

		if (!fullName || !email || !password) {
			return res.status(400).json({
				success: false,
				message: "Full name, email, and password are required",
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				message: "Password must be at least 6 characters",
			});
		}

		await authService.createUser({ fullName, email, password });

		res.status(201).json({
			success: true,
			message:
				"Account created. Please check your email for the verification code.",
		});
	} catch (error) {
		console.error("Register error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Registration failed",
		});
	}
};

// Verify email with OTP
exports.verifyEmail = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({
				success: false,
				message: "Email and OTP are required",
			});
		}

		await authService.verifyUserEmail(email, otp);

		res.status(200).json({
			success: true,
			message: "Email verified successfully. You can now log in.",
		});
	} catch (error) {
		console.error("Verify email error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Email verification failed",
		});
	}
};

// Resend OTP for customer registration
exports.resendOtp = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		await authService.resendUserOtp(email);

		res.status(200).json({
			success: true,
			message: "A new verification code has been sent to your email.",
		});
	} catch (error) {
		console.error("Resend OTP error:", error);
		const status = error.status || 500;
		res.status(status).json({
			success: false,
			message: error.message || "Failed to resend OTP",
		});
	}
};

// Change password (authenticated)
exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		if (!currentPassword || !newPassword) {
			return res
				.status(400)
				.json({
					success: false,
					message: "Current and new password are required",
				});
		}

		if (newPassword.length < 6) {
			return res
				.status(400)
				.json({
					success: false,
					message: "New password must be at least 6 characters",
				});
		}

		const user = await authService.findUserById(req.user.id);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const isValid = await user.comparePassword(currentPassword);
		if (!isValid) {
			return res
				.status(400)
				.json({ success: false, message: "Current password is incorrect" });
		}

		user.password = newPassword;
		await user.save();

		res.json({ success: true, message: "Password changed successfully" });
	} catch (error) {
		console.error("Change password error:", error);
		res
			.status(500)
			.json({ success: false, message: "Failed to change password" });
	}
};

module.exports = exports;
