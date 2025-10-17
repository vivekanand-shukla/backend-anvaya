const { initializeDatabase } = require("./connect/db.connect");
initializeDatabase();
// MONGODB = mongodb+srv://VIVEK:vivek@cluster0.culs8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
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








// Create a new lead C--
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









// Get all leads with filtering  R--
app.get("/leads", async (req, res) => {
  try {
    const { salesAgent, status, tags, source } = req.query;
    let filter = {};

    // Apply filters
    if (salesAgent) {
      filter.salesAgent = salesAgent;
    }

    if (status) {
      const validStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid input: 'status' must be one of ${JSON.stringify(validStatuses)}.`,
        });
      }
      filter.status = status;
    }

    if (source) {
      filter.source = source;
    }

    if (tags) {
      // Tags can be comma-separated
      const tagArray = tags.split(",");
      filter.tags = { $in: tagArray };
    }

    const leads = await Lead.find(filter).populate("salesAgent", "name");

    const formattedLeads = leads.map((lead) => ({
      id: lead._id,
      name: lead.name,
      source: lead.source,
      salesAgent: lead.salesAgent
        ? {
            id: lead.salesAgent._id,
            name: lead.salesAgent.name,
          }
        : null,
      status: lead.status,
      tags: lead.tags,
      timeToClose: lead.timeToClose,
      priority: lead.priority,
      createdAt: lead.createdAt,
    }));

    res.status(200).json(formattedLeads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







// Update a lead  U--
app.put("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, source, salesAgent, status, tags, timeToClose, priority } = req.body;

    // Check if lead exists
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        error: `Lead with ID '${id}' not found.`,
      });
    }

    // Validate inputs (same as create)
    if (source) {
      const validSources = ["Website", "Referral", "Cold Call", "Advertisement", "Email", "Other"];
      if (!validSources.includes(source)) {
        return res.status(400).json({
          error: `Invalid input: 'source' must be one of ${JSON.stringify(validSources)}.`,
        });
      }
    }

    if (status) {
      const validStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid input: 'status' must be one of ${JSON.stringify(validStatuses)}.`,
        });
      }
      
      // Set closedAt if status is Closed
      if (status === "Closed" && lead.status !== "Closed") {
        lead.closedAt = new Date();
      }
    }

    if (priority) {
      const validPriorities = ["High", "Medium", "Low"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: `Invalid input: 'priority' must be one of ${JSON.stringify(validPriorities)}.`,
        });
      }
    }

    if (timeToClose && timeToClose <= 0) {
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

    // Update fields
    if (name) lead.name = name;
    if (source) lead.source = source;
    if (salesAgent) lead.salesAgent = salesAgent;
    if (status) lead.status = status;
    if (tags) lead.tags = tags;
    if (timeToClose) lead.timeToClose = timeToClose;
    if (priority) lead.priority = priority;

    await lead.save();

    // Populate and return
    const updatedLead = await Lead.findById(id).populate("salesAgent", "name");

    res.status(200).json({
      id: updatedLead._id,
      name: updatedLead.name,
      source: updatedLead.source,
      salesAgent: updatedLead.salesAgent
        ? {
            id: updatedLead.salesAgent._id,
            name: updatedLead.salesAgent.name,
          }
        : null,
      status: updatedLead.status,
      tags: updatedLead.tags,
      timeToClose: updatedLead.timeToClose,
      priority: updatedLead.priority,
      updatedAt: updatedLead.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Delete a lead
app.delete("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return res.status(404).json({
        error: `Lead with ID '${id}' not found.`,
      });
    }

    // Also delete associated comments
    await Comment.deleteMany({ lead: id });

    res.status(200).json({
      message: "Lead deleted successfully.",
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



//Get all sales agents
app.get("/agents", async (req, res) => {
  try {
    const agents = await Agent.find();
    const formattedAgents = agents.map((agent) => ({
      id: agent._id,
      name: agent.name,
      email: agent.email,
    }));
    if(formattedAgents.length >0){

      res.status(200).json(formattedAgents);
    }else{
       res.status(404).json({error:"no agent found"});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





// COMMENTS ROUTES


// Add a comment to a lead
app.post("/leads/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { commentText, author } = req.body;

    // Validate input
    if (!commentText) {
      return res.status(400).json({
        error: "Invalid input: 'commentText' is required.",
      });
    }

    // Check if lead exists
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        error: `Lead with ID '${id}' not found.`,
      });
    }

    // Check if author exists (if provided)
    if (author) {
      const agentExists = await Agent.findById(author);
      if (!agentExists) {
        return res.status(404).json({
          error: `Author with ID '${author}' not found.`,
        });
      }
    }

    const comment = new Comment({
      lead: id,
      author: author,
      commentText,
    });

    await comment.save();

    // Populate author data
    const populatedComment = await Comment.findById(comment._id).populate("author", "name");

    res.status(201).json({
      id: populatedComment._id,
      commentText: populatedComment.commentText,
      author: populatedComment.author ? populatedComment.author.name : "Unknown",
      createdAt: populatedComment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all comments for a lead
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if lead exists
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        error: `Lead with ID '${id}' not found.`,
      });
    }

    const comments = await Comment.find({ lead: id }).populate("author", "name");

    const formattedComments = comments.map((comment) => ({
      id: comment._id,
      commentText: comment.commentText,
      author: comment.author ? comment.author.name : "Unknown",
      createdAt: comment.createdAt,
    }));

    res.status(200).json(formattedComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});









// TAGS ROUTES


// Create a new tag
app.post("/tags", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Invalid input: 'name' is required.",
      });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(409).json({
        error: `Tag with name '${name}' already exists.`,
      });
    }

    const tag = new Tag({ name });
    await tag.save();

    res.status(201).json({
      id: tag._id,
      name: tag.name,
      createdAt: tag.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
app.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find();
    const formattedTags = tags.map((tag) => ({
      id: tag._id,
      name: tag.name,
    }));
    res.status(200).json(formattedTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// REPORTING ROUTES


// Get leads closed last week
app.get("/report/last-week", async (req, res) => {
  try {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const closedLeads = await Lead.find({
      status: "Closed",
      closedAt: { $gte: lastWeek },
    }).populate("salesAgent", "name");

    const formattedLeads = closedLeads.map((lead) => ({
      id: lead._id,
      name: lead.name,
      salesAgent: lead.salesAgent ? lead.salesAgent.name : "Unknown",
      closedAt: lead.closedAt,
    }));

    res.status(200).json(formattedLeads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total leads in pipeline
app.get("/report/pipeline", async (req, res) => {
  try {
    const totalLeadsInPipeline = await Lead.countDocuments({
      status: { $ne: "Closed" },
    });

    res.status(200).json({
      totalLeadsInPipeline,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







app.listen(PORT, () => {
  console.log(`Server connected successfully on port http://localhost:${PORT}/`);
});