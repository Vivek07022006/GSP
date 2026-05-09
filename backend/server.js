require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcryptjs");
const multer    = require("multer");
const fs        = require("fs");
const path      = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/photos",  express.static(path.join(__dirname, "Photos")));  // Faculty passport photos in backend/Photos/

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + "-" + safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// ─────────────────────────────────────────────
// DB CONNECTION
// ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ MongoDB error:", err.message); process.exit(1); });

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// ─────────────────────────────────────────────
// SCHEMAS & MODELS
// ─────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ["student", "faculty", "admin"], default: "student" },
  registerNumber: { type: String, default: "", trim: true },
  staffId:        { type: String, default: "", trim: true },   // faculty staff ID
  phone:          { type: String, default: "" },
  specialization: { type: String, default: '' },
  photoFile:      { type: String, default: '' },  // filename in /Photos folder
  maxTeams:       { type: Number, default: 10 },   // only for faculty
}, { timestamps: true });

// Hash password before save
UserSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", UserSchema);

// ── Team ──
const CommentSchema = new mongoose.Schema({
  text:      String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  projectTitle:  { type: String, default: "" },
  members:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  guideId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status:        { type: String, enum: ["pending", "guide_approved", "guide_rejected"], default: "pending" },
  currentReview: { type: Number, default: 0 },   // 0=Zeroth … 4=Final
}, { timestamps: true });

const Team = mongoose.model("Team", TeamSchema);

// ── Review ──
const ReviewSchema = new mongoose.Schema({
  teamId:        { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  reviewStage:   { type: Number, required: true, min: 1, max: 4 },  // Stage 0 = guide selection (not submittable)
  submissionFile:{ type: String, default: "" },   // general doc (stage 3 & 4)
  pptFileName:   { type: String, default: "" },   // stage 1 & 2
  patentStatus:  { type: String, enum: ["", "Acceptance", "In-Progress", "Applied"], default: "" },
  patentFileName:{ type: String, default: "" },   // acceptance letter or applied mail screenshot
  comments:      [CommentSchema],
  status:        { type: String, enum: ["pending", "approved", "changes"], default: "pending" },
  submittedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

const Review = mongoose.model("Review", ReviewSchema);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const makeToken = (user) =>
  jwt.sign({ _id: user._id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

const protect = (req, res, next) => {
  const auth  = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const photoUrl = (f) => f?.photoFile ? `${BACKEND_URL}/photos/${encodeURIComponent(f.photoFile)}` : '';

const safeUser = (u) => u ? {
  _id: u._id, name: u.name, email: u.email, role: u.role,
  registerNumber: u.registerNumber, phone: u.phone, specialization: u.specialization,
  maxTeams: u.maxTeams, staffId: u.staffId, photo: photoUrl(u),
} : null;

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, registerNumber } = req.body;
    let user;

    if (registerNumber) {
      // Student login via register number
      user = await User.findOne({ registerNumber: registerNumber.trim(), role: "student" });
    }
    if (!user && email) {
      // Staff / Admin login via email
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials. Please check your details." });

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      registerNumber: user.registerNumber,
      staffId: user.staffId || '',
      phone: user.phone || '',
      specialization: user.specialization || '',
      photo: photoUrl(user),
      maxTeams: user.maxTeams || 10,
      token: makeToken(user)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/register", protect, adminOnly, async (req, res) => {
  // Only admins can create accounts
  try {
    const { name, email, password, role, registerNumber, phone, specialization } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already exists." });

    if (role === "student" && registerNumber) {
      const regExists = await User.findOne({ registerNumber: registerNumber.trim() });
      if (regExists) return res.status(400).json({ message: "Register number already exists." });
    }

    const user = await User.create({ name, email, password, role: role || "student", registerNumber: registerNumber || "", phone: phone || "", specialization: specialization || "" });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: makeToken(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/auth/users", protect, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users.map(safeUser));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────
// TEAM ROUTES
// ─────────────────────────────────────────────
// Check if current user already in a team
app.get("/api/teams/check-mine", protect, async (req, res) => {
  try {
    const team = await Team.findOne({ members: req.user._id })
      .populate("members", "-password")
      .populate("guideId", "-password");
    res.json({ hasTeam: !!team, team: team || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/teams", protect, async (req, res) => {
  try {
    const teams = await Team.find().populate("members", "-password").populate("guideId", "-password");
    res.json(teams);
  } catch (err) { res.status(500).json({ message: err.message }); } 
});


app.get("/api/teams/:id", protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("members", "-password").populate("guideId", "-password");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/teams", protect, async (req, res) => {
  try {
    const { projectTitle, member2RegisterNumber } = req.body;

    // Member 1 = the logged-in student
    const member1 = await User.findById(req.user._id);
    if (!member1 || member1.role !== "student")
      return res.status(403).json({ message: "Only students can create teams." });

    // Check if member 1 already has a team
    const m1Team = await Team.findOne({ members: member1._id });
    if (m1Team) return res.status(400).json({ message: "You already belong to a team." });

    const members = [member1._id];

    // Optional: Member 2 by register number
    if (member2RegisterNumber && member2RegisterNumber.trim()) {
      const member2 = await User.findOne({ registerNumber: member2RegisterNumber.trim(), role: "student" });
      if (!member2) return res.status(404).json({ message: `No student found with register number ${member2RegisterNumber}.` });
      if (member2._id.toString() === member1._id.toString())
        return res.status(400).json({ message: "Member 2 cannot be the same as Member 1." });

      const m2Team = await Team.findOne({ members: member2._id });
      if (m2Team) return res.status(400).json({ message: `Student ${member2RegisterNumber} already belongs to another team.` });

      members.push(member2._id);
    }

    const team = await Team.create({ members, projectTitle: projectTitle?.trim() || "" });
    const populated = await team.populate([{ path: "members", select: "-password" }, { path: "guideId", select: "-password" }]);
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/teams/:id/select-guide", protect, async (req, res) => {
  try {
    const { guideId } = req.body;
    const team  = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const guide = await User.findById(guideId);
    if (!guide || guide.role !== "faculty") return res.status(404).json({ message: "Guide not found" });

    // Count how many teams already assigned to this guide
    const assignedCount = await Team.countDocuments({ guideId: guide._id, status: { $ne: "guide_rejected" } });
    if (assignedCount >= guide.maxTeams)
      return res.status(400).json({ message: `Guide has reached the maximum of ${guide.maxTeams} teams.` });

    team.guideId = guideId;
    team.status  = "pending";
    await team.save();

    const populated = await Team.findById(team._id).populate("members", "-password").populate("guideId", "-password");
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────
// GUIDE ROUTES
// ─────────────────────────────────────────────
app.get("/api/guides", protect, async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" }).select("-password");
    const withCapacity = await Promise.all(faculty.map(async (f) => {
      const assigned = await Team.countDocuments({
        guideId: f._id,
        status: { $ne: "guide_rejected" }
      });
      return {
        _id:            f._id,
        name:           f.name,
        email:          f.email,
        staffId:        f.staffId || "",
        specialization: f.specialization,
        maxTeams:       f.maxTeams || 10,
        assignedTeams:  assigned,
        availableSlots: (f.maxTeams || 10) - assigned,
        photo:          photoUrl(f),
      };
    }));
    res.json(withCapacity);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/guides/team/:teamId/status", protect, async (req, res) => {
  try {
    if (req.user.role !== "faculty") return res.status(403).json({ message: "Faculty only" });
    const { status } = req.body;  // guide_approved | guide_rejected

    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.guideId?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your team" });

    team.status = status;
    if (status === "guide_approved" && team.currentReview === 0) {
      team.currentReview = 1; // unlock First review
    }
    await team.save();

    const populated = await Team.findById(team._id).populate("members", "-password").populate("guideId", "-password");
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────
// REVIEW ROUTES
// ─────────────────────────────────────────────
app.get("/api/reviews/:teamId", protect, async (req, res) => {
  try {
    const reviews = await Review.find({ teamId: req.params.teamId })
      .populate("comments.createdBy", "name role");
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/reviews/:teamId/submit", protect, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'patentFile', maxCount: 1 }]), async (req, res) => {
  try {
    const { patentStatus } = req.body;
    const team  = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const stage = team.currentReview;
    if (stage < 1 || stage > 4)
      return res.status(400).json({ message: "No review stage currently open for submission." });

    let review = await Review.findOne({ teamId: team._id, reviewStage: stage });
    if (!review) review = new Review({ teamId: team._id, reviewStage: stage });

    review.status      = "pending";
    review.submittedAt = new Date();
    if (patentStatus !== undefined) review.patentStatus = patentStatus;

    if (req.files) {
      if (req.files.document) {
        if (stage === 1 || stage === 2) review.pptFileName = req.files.document[0].filename;
        else review.submissionFile = req.files.document[0].filename;
      }
      if (req.files.patentFile) {
        review.patentFileName = req.files.patentFile[0].filename;
      }
    }
    await review.save();
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/reviews/:reviewId/feedback", protect, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin")
      return res.status(403).json({ message: "Faculty only" });

    const { text, status } = req.body;
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (text) review.comments.push({ text, createdBy: req.user._id });
    if (status) {
      review.status = status;
      if (status === "approved") {
        const team = await Team.findById(review.teamId);
        if (team && team.currentReview <= review.reviewStage) {
          team.currentReview = Math.min(review.reviewStage + 1, 4);
          await team.save();
        }
      }
    }
    await review.save();
    const populated = await Review.findById(review._id).populate("comments.createdBy", "name role");
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Faculty can submit feedback for EXACTLY the current active stage
app.post("/api/reviews/:teamId/stage-feedback", protect, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "admin")
      return res.status(403).json({ message: "Faculty only" });

    const { text, status } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const stageNum = team.currentReview;
    if (stageNum < 1 || stageNum > 4) 
      return res.status(400).json({ message: "No active review stage to evaluate." });

    // ⛔ BLOCK: student must submit first before faculty can comment/approve
    const review = await Review.findOne({ teamId: team._id, reviewStage: stageNum });
    if (!review || (!review.submissionFile && !review.pptFileName)) {
      return res.status(400).json({ message: "Student has not submitted any files for this review stage yet. Please wait for the student to submit." });
    }

    if (text && text.trim()) review.comments.push({ text: text.trim(), createdBy: req.user._id });
    if (status) {
      review.status = status;
      if (status === "approved") {
        team.currentReview = Math.min(stageNum + 1, 5); // 5 means all done
        await team.save();
      }
    }
    await review.save();
    const populated = await Review.findById(review._id).populate("comments.createdBy", "name role");
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────
app.get("/api/admin/stats", protect, adminOnly, async (req, res) => {
  try {
    const [students, faculty, teams] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "faculty" }),
      Team.countDocuments(),
    ]);
    res.json({ students, faculty, teams });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/admin/export", protect, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find().populate("members", "-password").populate("guideId", "-password");
    res.json(teams);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted." });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
app.get("/", (req, res) => res.send("GuideSelect API running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n✅ Server running on http://localhost:${PORT}`));
