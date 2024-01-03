import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
    name: { type: String, default: null },
    seqValue: { type: Number, default: 0 },
}, { timestamps: true })
counterSchema.index({ name: 1, })
export const counterModel = mongoose.model('counter', counterSchema)