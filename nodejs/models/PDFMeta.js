import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema(
  {
    page: Number,
    ip: String,
    accessedAt: { type: Date, default: Date.now },
  },
  { _id: false } // don't need individual IDs for each log entry
);

const pdfMetaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    pageCount: Number,
    size: Number,
    lastAccessed: { type: Date, default: Date.now },

    // 👇 New fields
    lastAccessedPage: Number,
    lastAccessedIP: String,
    accessLog: [accessLogSchema], // history of accesses
  },
  { timestamps: true }
);

export default mongoose.model("PDFMeta", pdfMetaSchema);
