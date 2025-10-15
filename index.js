const { connectDB } = require("./connect/db.connect");
connectDB();

const Agent = require("./models/agent.models");
const Lead = require("./models/lead.models");
const Comment = require("./models/comment.models");
const Tag = require("./models/tag.models");

const PORT = process.env.PORT || 3000;
const express = require("express");
const app = express();
app.use(express.json());

// CORS
const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Anvaya CRM Server is running");
});


// SALES AGENTS ROUTES

app.listen(PORT, () => {
  console.log(`Server connected successfully on port http://localhost:${PORT}/`);
});