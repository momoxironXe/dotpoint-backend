import mongoose from 'mongoose';

const currencyListSchema: any = new mongoose.Schema({
    name: { type: String, default: null },
    image: { type: String, default: null },
    code: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    workspaceId: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

currencyListSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const currencyListModel = mongoose.model<any>('currency_list', currencyListSchema);