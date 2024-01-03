import mongoose from 'mongoose';

const coinbaseSchema: any = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    eventData: { type: Object, default: {} },
}, { timestamps: true })

coinbaseSchema.index({ _id: 1, isBlock: 1, isActive: 1 })

export const coinbaseModel = mongoose.model<any>('coinbase', coinbaseSchema);