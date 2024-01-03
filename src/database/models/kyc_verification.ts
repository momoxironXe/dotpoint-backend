import mongoose from 'mongoose';

const kycVerificationSchema: any = new mongoose.Schema({
    credentialType: { type: String, default: null }, // company || personal
    verificationNo: { type: String, default: null },
    orderNo: { type: String, default: null },
    firstName: { type: String, default: null },
    middleName: { type: String, default: null },
    surname: { type: String, default: null },
    dob: { type: String, default: null },
    street: { type: String, default: null },
    city: { type: String, default: null },
    zipcode: { type: String, default: null },
    country: { type: String, default: null },
    documentType: { type: String, default: null },
    frontSideDoc: { type: String, default: null },
    backSideDoc: { type: String, default: null },
    selfieDoc: { type: String, default: null },
    status: { type: Number, default: null }, // 0 = Pending || 1 = Approved || 2 = Rejected || 3 = Pending for Admin Approval
    step4QuestionsList: { type: Array, default: [] },
    isQuestionAgree: { type: Boolean, default: false },
    isPolicyAgree: { type: Boolean, default: false },
    note: { type: String, default: null },
    accountAgree: { type: Boolean, default: false },
    addressProofDoc: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

export const kycVerificationModel = mongoose.model<any>('kyc_verification', kycVerificationSchema);