import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend is running on Cloud Run!" });
});

// Example API endpoint
app.get("/api/hello", (req, res) => {
  res.json({ greeting: "Hello from Node.js backend 👋" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
