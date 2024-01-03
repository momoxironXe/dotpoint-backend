import mongoose from 'mongoose';

const serverListSchema: any = new mongoose.Schema({
    serverName: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true })

serverListSchema.index({ createdBy: 1, isBlock: -1, isActive: 1 })

export const serverListModel = mongoose.model<any>('server_list', serverListSchema);