import mongoose from 'mongoose';

const mtTradeHistorySchema: any = new mongoose.Schema({
    _id: { type: String, default: null },
    closeTime: { type: String, default: null },
    closeISOTime: { type: Date, default: null },
    openTime: { type: String, default: null },
    positionId: { type: String, default: null },
    success: { type: String, default: null },
    symbol: { type: String, default: null },
    type: { type: String, default: null },
    pips: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    gain: { type: Number, default: 0 },
    closePrice: { type: Number, default: 0 },
    marketValue: { type: Number, default: 0 },
    openPrice: { type: Number, default: 0 },
    durationInMinutes: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    workspaceId: { type: String, default: null },
    accountId: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    challengeUserId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "challenge_user" },
}, { timestamps: true })

export const mtTradeHistoryModel = mongoose.model<any>('mt_trade_history', mtTradeHistorySchema);