import mongoose from 'mongoose';

const profitWithdrawalSchema: any = new mongoose.Schema({
    withdrawalAmount: { type: Number, default: 0 },
    refund: { type: Number, default: 0 },
    rollover: { type: Number, default: 0 },
    payoutChannel: { type: String, default: null },
    specialRequirement: { type: Boolean, default: false },
    bankName: { type: String, default: null },
    accountNumber: { type: Number, default: 0 },
    ifscCode: { type: String, default: null },
    isApproval: { type: Boolean, default: false },
    reason: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    challengeUserId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "challenge_user" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

profitWithdrawalSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const profitWithdrawalModel = mongoose.model<any>('profit_withdrawal', profitWithdrawalSchema);