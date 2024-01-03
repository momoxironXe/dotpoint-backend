import mongoose from 'mongoose';

const mtOrderSchema: any = new mongoose.Schema({
    id: { type: String, default: null },
    platform: { type: String, default: null },
    type: { type: String, default: null },
    state: { type: String, default: null },
    symbol: { type: String, default: null },
    time: { type: String, default: null },
    brokerTime: { type: String, default: null },
    positionId: { type: String, default: null },
    reason: { type: String, default: null },
    fillingMode: { type: String, default: null },
    expirationType: { type: String, default: null },
    doneTime: { type: String, default: null },
    doneBrokerTime: { type: String, default: null },
    magic: { type: Number, default: 0 },
    openPrice: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    currentVolume: { type: Number, default: 0 },
    accountCurrencyExchangeRate: { type: Number, default: 0 },
    takeProfit: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    workspaceId: { type: String, default: null },
    accountId: { type: String, default: null },
    login: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

export const mtOrderModel = mongoose.model<any>('mt_order', mtOrderSchema);