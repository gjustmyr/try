const { User, Seller } = require("../models");
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/email");

exports.getPendingSellers = async () => {
	return Seller.findAll({
		where: { approvalStatus: "pending" },
		include: [
			{
				model: User,
				as: "user",
				attributes: ["id", "email", "emailVerified", "createdAt"],
			},
		],
		order: [["createdAt", "DESC"]],
	});
};

exports.getAllSellers = async (status) => {
	const where = {};
	if (status) {
		where.approvalStatus = status;
	}

	return Seller.findAll({
		where,
		include: [
			{
				model: User,
				as: "user",
				attributes: ["id", "email", "emailVerified", "isActive", "createdAt"],
			},
		],
		order: [["createdAt", "DESC"]],
	});
};

exports.approveSeller = async (seller, adminUserId) => {
	seller.approvalStatus = "approved";
	seller.approvedAt = new Date();
	seller.approvedBy = adminUserId;
	await seller.save();

	sendApprovalEmail(seller.user.email, seller.shopName).catch((error) => {
		console.error("Failed to send approval email:", error);
	});

	return seller;
};

exports.rejectSeller = async (seller, reason) => {
	seller.approvalStatus = "rejected";
	seller.rejectionReason = reason;
	await seller.save();

	sendRejectionEmail(seller.user.email, seller.shopName, reason).catch(
		(error) => {
			console.error("Failed to send rejection email:", error);
		},
	);

	return seller;
};
