import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema: any = new mongoose.Schema({
    workspaceId: { type: String, default: uuidv4() },
    lineAccountId: { type: String, default: null },
    role: { type: Number, default: 0 },
    title: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    email: { type: String, default: null },
    dob: { type: String, default: null },
    password: { type: String, default: null },
    countryCode: { type: String, default: null },
    countryCode1: { type: String, default: null },
    state: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: null },
    street: { type: String, default: null },
    postalCode: { type: String, default: null },
    airWallexUserId: { type: String, default: null },
    image: { type: String, default: null },
    authToken: { type: Number, default: 0 },
    userType: { type: Number, default: 1 },   // 0 = Admin || 1 = User 
    otp: { type: Number, default: 0 },
    otpExpireTime: { type: Date, default: null },
    accountSuspensionDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isKYCVerified: { type: Boolean, default: false },
    tradingProgram: { type: String, default: null },
    deviceToken: { type: [{ type: String }], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    tradingAccounts: {
        type: [
            {
                step1Completed: { type: Boolean },
                step2Completed: { type: Boolean },
                step1Status: { type: Number }, // 0 = Pending || 1 = Approved || 2 = Rejected
                step2Status: { type: Number }, // 0 = Pending || 1 = Approved || 2 = Rejected
                step1ApprovalId: { type: mongoose.Schema.Types.ObjectId, },
                step2ApprovalId: { type: mongoose.Schema.Types.ObjectId, },
                step1CompletedAt: { type: Date },
                step2CompletedAt: { type: Date },
                accountId: { type: String, },
                currencyCode: { type: String, },
                challengePayCurrencyCode: { type: String, },
                serverDetail: { type: String, },
                currencyImage: { type: String, },
                endChallengeDate: { type: Date, },
                accountBalance: { type: Number, },
                currentAccountBalance: { type: Number, },
                serverURL: { type: String, },
                investorPassword: { type: String, },
                login: { type: String, },
                password: { type: String, },
                challengeUserId: { type: String, },
                isChallengeEnded: { type: Boolean, },
                challengeBuyingPrice: { type: Number, }
            }
        ], default: []
    },
    totalTradingBalance: { type: Number, default: 0 },
    calculationFinalAmount: { type: Number, default: 0 },
    calculationTotalAmount: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    equity: { type: Number, default: 0 },
    accountSize: { type: Number, default: 0 },
    gain: { type: Number, default: 0 },
}, { timestamps: true })
userSchema.index({ _id: 1, isBlock: 1, isActive: 1 })

export const userModel = mongoose.model<any>('user', userSchema);