import mongoose from 'mongoose';

const tradingProfitSchema: any = new mongoose.Schema({
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    profit: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    isWithdrawal: { type: Boolean, default: false },
    workspaceId: { type: String, default: null },
    accountId: { type: String, default: null },
    login: { type: String, default: null },
    mtOrderHistoryIds: { type: Array, default: [] },
    numberOfDays: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    challengeUserId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "challenge_user" },
}, { timestamps: true })

export const tradingProfitModel = mongoose.model<any>('trading_profit', tradingProfitSchema);