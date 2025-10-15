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






// Create a new lead
app.post("/leads", async (req, res) => {
  try {
    const { name, source, salesAgent, status, tags, timeToClose, priority } = req.body;

    // Input validation
    if (!name) {
      return res.status(400).json({
        error: "Invalid input: 'name' is required.",
      });
    }

    if (!source) {
      return res.status(400).json({
        error: "Invalid input: 'source' is required.",
      });
    }

    const validSources = ["Website", "Referral", "Cold Call", "Advertisement", "Email", "Other"];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        error: `Invalid input: 'source' must be one of ${JSON.stringify(validSources)}.`,
      });
    }

    const validStatus = ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({
        error: `Invalid input: 'status' must be one of ${JSON.stringify(validStatus)}.`,
      });
    }

    const validPriorities = ["High", "Medium", "Low"];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: `Invalid input: 'priority' must be one of ${JSON.stringify(validPriorities)}.`,
      });
    }

    if (!timeToClose || timeToClose <= 0) {
      return res.status(400).json({
        error: "Invalid input: 'timeToClose' must be a positive integer.",
      });
    }

    // Check if sales agent exists
    if (salesAgent) {
      const agent = await Agent.findById(salesAgent);
      if (!agent) {
        return res.status(404).json({
          error: `Sales agent with ID '${salesAgent}' not found.`,
        });
      }
    }

    const lead = new Lead({
      name,
      source,
      salesAgent,
      status: status || "New",
      tags: tags || [],
      timeToClose,
      priority: priority || "Medium",
    });

    await lead.save();

    // Populate sales agent data
    const populatedLead = await Lead.findById(lead._id).populate("salesAgent", "name");

    res.status(201).json({
      id: populatedLead._id,
      name: populatedLead.name,
      source: populatedLead.source,
      salesAgent: populatedLead.salesAgent
        ? {
            id: populatedLead.salesAgent._id,
            name: populatedLead.salesAgent.name,
          }
        : null,
      status: populatedLead.status,
      tags: populatedLead.tags,
      timeToClose: populatedLead.timeToClose,
      priority: populatedLead.priority,
      createdAt: populatedLead.createdAt,
      updatedAt: populatedLead.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// SALES AGENTS ROUTES

// Create a new sales agent
app.post("/agents", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Input validation
    if (!name || !email) {
      return res.status(400).json({
        error: "Invalid input: 'name' and 'email' are required.",
      });
    }

    // Email format validation
  function testEmail(email) {

  const atIndex = email.indexOf('@');
  const dotIndex = email.indexOf('.');

  if (atIndex < 2) {
    return flase;
  }


  if (dotIndex - atIndex <= 2) {
    return false;
  }

  if (dotIndex === email.length - 1) {
    return false;
  }

  return true;
}

    if (testEmail(email) === false) {
      return res.status(400).json({
        error: "Invalid input: 'email' must be a valid email address.",
      });
    }

    // Check if email already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(409).json({
        error: `Sales agent with email '${email}' already exists.`,
      });
    }

    const agent = new Agent({ name, email });
  const savedagent  =   await agent.save();

    res.status(201).json({message:"agent saved" ,savedagent }
     );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server connected successfully on port http://localhost:${PORT}/`);
});