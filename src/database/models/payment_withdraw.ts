import mongoose from 'mongoose';

const paymentSchema: any = new mongoose.Schema({
    withdrawal: { type: Number, default: 0 },
    refund: { type: Number, default: 0 },
    rollOver: { type: Number, default: 0 },
    payoutChannel: { type: String, default: null },
    requirement: { type: String, default: null },
    status: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

export const paymentWithdrawModel = mongoose.model<any>('payment_withdraw', paymentSchema);