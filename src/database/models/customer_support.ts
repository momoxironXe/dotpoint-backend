import mongoose from 'mongoose';

const customerSupportSchema = new mongoose.Schema({
  subject: { type: String, default: null },
  content: { type: String, default: String },
  attachments: { type: [{ type: String, }], default: [] },
  isActive: { type: Boolean, default: true },
  isBlock: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "user" },
}, { timestamps: true });

export const customerSupportModel = mongoose.model<any>('customer_support', customerSupportSchema);