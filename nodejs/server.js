import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { PDFDocument } from "pdf-lib";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import PDFMeta from "./models/PDFMeta.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const pdfFolder = path.join(process.cwd(), "pdfs");

app.use(cors());
app.use(express.json());

// ✅ Start MongoDB connection without blocking container startup
connectDB()
  .then(() => console.log("✅ MongoDB connection established"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend is running and MongoDB is initializing!" });
});

// 📄 Return entire PDF
app.get("/pdf", (req, res) => {
  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).json({ error: "Missing 'filename' query parameter" });
  }

  const filePath = path.join(pdfFolder, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// 🧠 Return a specific page as a single-page PDF + store metadata
app.get("/pdf/page", async (req, res) => {
  const filename = req.query.filename;
  const pageNumber = parseInt(req.query.page, 10);
  const clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  if (!filename || isNaN(pageNumber)) {
    return res.status(400).json({ error: "Missing 'filename' or 'page' query parameter" });
  }

  const filePath = path.join(pdfFolder, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "PDF not found" });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const originalPdf = await PDFDocument.load(fileBuffer);

    if (pageNumber < 1 || pageNumber > originalPdf.getPageCount()) {
      return res.status(400).json({ error: "Invalid page number" });
    }

    const stats = fs.statSync(filePath);
    await PDFMeta.findOneAndUpdate(
      { filename },
      {
        filename,
        pageCount: originalPdf.getPageCount(),
        size: stats.size,
        lastAccessed: new Date(),
        lastAccessedPage: pageNumber,
        lastAccessedIP: clientIP,
        $push: {
          accessLog: {
            page: pageNumber,
            ip: clientIP,
            accessedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
    newPdf.addPage(copiedPage);

    const newPdfBytes = await newPdf.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}-page-${pageNumber}.pdf"`
    );
    res.send(Buffer.from(newPdfBytes));
  } catch (error) {
    console.error("❌ Error extracting page:", error);
    res.status(500).json({ error: "Failed to extract page" });
  }
});

// 🚀 Start server immediately
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
