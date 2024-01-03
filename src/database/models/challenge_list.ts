import mongoose from 'mongoose';

const challengeListSchema: any = new mongoose.Schema({
    name: { type: String, default: null },
    description: { type: String, default: null },
    minimumTradingDays: { type: Number, default: 0 },
    tradingPeriodDays: { type: Number, default: 0 },  // In Days
    tradingCurrency: {
        type: [{
            // currencyType: { type: Number, default: 0 },
            currencyListId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "currency_list" },
            accountBalance: { type: Number, default: 0 },
            maximumDayLoss: { type: Number, default: 0 },
            maximumLoss: { type: Number, default: 0 },
            profitTarget: { type: Number, default: 0 },
            // challengeAmount: { type: Number, default: 0 },
            lowestAllowedEquity: { type: Number, default: 0 },
            buyChallengeCurrency: {
                type: [{
                    currency: { type: String, default: null },
                    amount: { type: Number, default: 0 },
                    flag: { type: String, default: null },
                    currencySymbol: { type: String, default: null },
                }], default: []
            }
        }], default: []
    },    // 0 = USD || 1 = EUR || 2 = RMD || 3 = HKD || 4 = TWD || 5 = SGD ||
    // riskModeOption: { type: [{ type: Number }], default: [] },    // 0 = Normal, 1 = Aggressive
    platformOption: { type: [{ type: Number }], default: [] },    // 0 = Meta Trader 4 || 1 = Meta Trader 5 || 2 = C Trader
    // accountBalance: { type: Number, default: 0 },
    // accountTypeOption: { type: [{ type: Number }], default: [] },    // 0 = Dot point Leverage 1:100
    challengeLevel: { type: Number, default: 0 },
    platformPercentage: { type: Number, default: 0 },
    userPercentage: { type: Number, default: 0 },
    serverDetailId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "server_list" },
    breachRules: { type: [{ type: String }], default: [] },
    levelUpRules: { type: [{ type: String }], default: [] },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    workspaceId: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

challengeListSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const challengeListModel = mongoose.model<any>('challenge_list', challengeListSchema);