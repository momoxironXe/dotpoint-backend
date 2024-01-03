import mongoose from 'mongoose';

const userSessionSchema: any = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    refresh_token: { type: String }
}, { timestamps: true })

userSessionSchema.index({ _id: 1, isBlock: 1, isActive: 1 })

export const userSessionModel = mongoose.model<any>('user_session', userSessionSchema);