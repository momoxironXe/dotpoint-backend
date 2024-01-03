import mongoose from 'mongoose';

const challengeApprovalSchema: any = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    isStep1: { type: Boolean, default: false },
    isStep2: { type: Boolean, default: false },
    login: { type: String, default: null },
    accountId: { type: String, default: null },
    status: { type: Number, default: 0 },   // 0 = Pending || 1 = Approved || 2 = Rejected
    challengeUserId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "challenge_user" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

challengeApprovalSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const challengeApprovalModel = mongoose.model<any>('challenge_approval', challengeApprovalSchema);