import mongoose from 'mongoose';

const challengeUserSchema: any = new mongoose.Schema({
    challengeType: { type: Number, default: 0 },    // 0 = Person, 1 = Company
    currencyCode: { type: String, default: null },
    accountId: { type: String, default: null },
    riskMode: { type: Number, default: 0 },    // 0 = Normal, 1 = Aggressive
    accountBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    noOfTrades: { type: Number, default: 0 },
    lots: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    averageRRR: { type: Number, default: 0 },
    expectancy: { type: Number, default: 0 },
    profitFactor: { type: Number, default: 0 },
    noOfLossTrade: { type: Number, default: 0 },
    noOfSuccessTrade: { type: Number, default: 0 },
    accountType: { type: Number, default: 0 },     // 0 = Dot point Leverage 1:100
    platform: { type: Number, default: 0 },     // 0 = Meta Trader 4 || 1 = Meta Trader 5 || 2 = C Trader
    amount: { type: Number, default: 0 },
    minimumTradingDays: { type: Number, default: 0 },
    tradingPeriodDays: { type: Number, default: 0 },
    paymentStatus: { type: Number, default: 0 },  // 0 = Pending || 1 = Completed || 2 = Failed
    status: { type: Number, default: 0 }, // 0 = Pending || 1 = Running || 2 = Completed || 3 = Ended || 4 = Terminated
    billingInfo: {
        type: {
            firstName: { type: String, default: null },
            lastName: { type: String, default: null },
            companyName: { type: String, default: null },
            businessNumber: { type: String, default: null },
            VATnumber: { type: String, default: null },
            contactNumber: { type: String, default: null },
            countryCode: { type: String, default: null },
            email: { type: String, default: null },
            city: { type: String, default: null },
            street: { type: String, default: null },
            postalCode: { type: String, default: null },
            country: { type: String, default: null },
            state: { type: String, default: null },
            note: { type: String, default: null },
        }, default: {
            firstName: null,
            lastName: null,
            companyName: null,
            businessNumber: null,
            VATnumber: null,
            contactNumber: null,
            countryCode: null,
            email: null,
            city: null,
            street: null,
            postalCode: null,
            country: null,
            state: null,
            note: null,
        }
    },
    minimumDayObjective: {
        type: {
            isPassed: { type: Boolean, default: false },
            completedDays: { type: Number, default: 0 },
        }, default: { isPassed: false }
    },
    maxDailyLossObjective: {
        type: {
            isPassed: { type: Boolean, default: false },
            percentage: { type: Number, default: 0 },
            value: { type: Number, default: 0 },
        }, default: { isPassed: false, percentage: 0, value: 0, }
    },
    maxLossObjective: {
        type: {
            isPassed: { type: Boolean, default: false },
            percentage: { type: Number, default: 0 },
            value: { type: Number, default: 0 },
        }, default: { isPassed: false, percentage: 0, value: 0, }
    },
    profitObjective: {
        type: {
            isPassed: { type: Boolean, default: false },
            percentage: { type: Number, default: 0 },
            value: { type: Number, default: 0 },
        }, default: { isPassed: false, percentage: 0, value: 0, }
    },
    platformOption: { type: Number, default: 0 },
    averageProfit: { type: Number, default: 0 },
    averageLoss: { type: Number, default: 0 },
    maximumDayLoss: { type: Number, default: 0 },
    maximumLoss: { type: Number, default: 0 },
    profitTarget: { type: Number, default: 0 },
    DurationOfLastTradeTakenInDays: { type: Number, default: 0 },
    isReadTermsAndConditions: { type: Boolean, default: false },
    isReadRefundPolicy: { type: Boolean, default: false },
    isDailyLimitExceed: { type: Boolean, default: false },
    isFullLimitExceed: { type: Boolean, default: false },
    isStep1: { type: Boolean, default: true },
    isStep2: { type: Boolean, default: false },
    isKYCAfter: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    endChallengeDate: { type: Date, default: null },
    startChallengeDate: { type: Date, default: null },
    airwallexPaymentLinkId: { type: String, default: null },
    login: { type: String, default: null },
    coinbaseEvenId: { type: String, default: null },
    workspaceId: { type: String, default: null },
    serverDetail: { type: String, default: null },
    tradingCurrency: { type: Array, default: [] },
    currencyListId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "currency_list" },
    challengeListId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "challenge_list" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

challengeUserSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const challengeUserModel = mongoose.model<any>('challenge_user', challengeUserSchema);