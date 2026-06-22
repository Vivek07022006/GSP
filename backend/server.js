require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcryptjs");
const multer    = require("multer");
const fs        = require("fs");
const path      = require("path");
const ExcelJS   = require("exceljs");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/photos",  express.static(path.join(__dirname, "Photos")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const exportsDir = path.join(__dirname, "exports");
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir);
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
  limits: { fileSize: 15 * 1024 * 1024 },
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
  teamId:        { type: String, unique: true, sparse: true },
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
  reviewStage:   { type: Number, required: true, min: 0, max: 4 },
  title:         { type: String, default: "" },
  submissionFile:{ type: String, default: "" },   // general doc (stage 3 & 4)
  pptFileName:   { type: String, default: "" },   // stage 1 & 2
  patentStatus:  { type: String, enum: ["", "Patent", "Publication"], default: "" },
  patentSubStatus:{ type: String, enum: ["", "Pending", "Doing", "Applied", "Confirmed"], default: "" },
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

const SECTION_RANGES = [
  { key: 'A1', ranges: [[43120001, 43120062], [43120307, 43120307]] },
  { key: 'A2', ranges: [[43120063, 43120122], [43120702, 43120702], [43120705, 43120705]] },
  { key: 'A3', ranges: [[43120123, 43120184], [43120308, 43120308]] },
  { key: 'A4', ranges: [[43120185, 43120244], [43120701, 43120701], [43120703, 43120703], [43120704, 43120704]] },
  { key: 'A5', ranges: [[43120245, 43120306]] },
];

const findSectionByRegister = (registerNumber) => {
  if (!registerNumber) return null;
  const digits = registerNumber.toString().trim();
  if (!/^[0-9]+$/.test(digits)) return null;
  const value = parseInt(digits, 10);
  const section = SECTION_RANGES.find(({ ranges }) =>
    ranges.some(([min, max]) => value >= min && value <= max)
  );
  return section?.key || null;
};

const formatTeamId = (index) => `BTECH-IT-${String(index + 1).padStart(3, '0')}`;

const generateNextTeamId = async () => {
  const teams = await Team.find({ teamId: { $regex: /^BTECH-IT-\d{3}$/ } }).lean();
  let maxIndex = 0;
  teams.forEach((team) => {
    const match = (team.teamId || '').match(/BTECH-IT-(\d{3})$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (!Number.isNaN(idx) && idx > maxIndex) {
        maxIndex = idx;
      }
    }
  });
  return formatTeamId(maxIndex + 1);
};

const buildSectionTeams = (teams) => {
  const sectionTeams = SECTION_RANGES.reduce((carry, section) => {
    carry[section.key] = [];
    return carry;
  }, {});
  const unknownTeams = [];

  teams.forEach((team) => {
    const members = (team.members || [])
      .map((member) => ({
        name: member?.name || '',
        registerNumber: member?.registerNumber || '',
        numericRegister: parseInt((member?.registerNumber || '').replace(/[^0-9]/g, ''), 10) || Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.numericRegister - b.numericRegister);

    const firstMember = members[0];
    const sectionKey = firstMember ? findSectionByRegister(firstMember.registerNumber) : null;
    const teamData = {
      team,
      section: sectionKey || 'Unknown',
      members,
      minRegister: firstMember?.numericRegister || Number.MAX_SAFE_INTEGER,
    };

    if (sectionKey && sectionTeams[sectionKey]) {
      sectionTeams[sectionKey].push(teamData);
    } else {
      unknownTeams.push(teamData);
    }
  });

  Object.keys(sectionTeams).forEach((sectionKey) => {
    sectionTeams[sectionKey].sort((a, b) => a.minRegister - b.minRegister);
  });
  if (unknownTeams.length) {
    unknownTeams.sort((a, b) => a.minRegister - b.minRegister);
    sectionTeams.Unknown = unknownTeams;
  }

  return sectionTeams;
};

const flattenSectionOrderedTeams = (teams) => {
  const sectionTeams = buildSectionTeams(teams);
  const sectionOrder = SECTION_RANGES.map((section) => section.key).concat(['Unknown']);
  return sectionOrder.flatMap((sectionKey) => (sectionTeams[sectionKey] || []).map((row) => row.team));
};

const REVIEW_STAGE_LABELS = {
  0: 'Zeroth Review',
  1: 'First Review',
  2: 'Second Review',
  3: 'Model Review',
  4: 'Final Review',
  5: 'Completed all reviews',
};

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

    const teamId = await generateNextTeamId();
    const team = await Team.create({ members, projectTitle: projectTitle?.trim() || "", teamId });
    const populated = await team.populate([{ path: "members", select: "-password" }, { path: "guideId", select: "-password" }]);
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const MAX_TEAMS = 8;  // hard cap per guide

app.post("/api/teams/:id/select-guide", protect, async (req, res) => {
  try {
    const { guideId } = req.body;

    // Validate team belongs to this user and has no guide yet
    const team = await Team.findOne({ _id: req.params.id, members: req.user._id, guideId: null });
    if (!team) return res.status(400).json({ message: "Team not found or guide already selected." });

    const guide = await User.findById(guideId);
    if (!guide || guide.role !== "faculty") return res.status(404).json({ message: "Guide not found" });

    const cap = Math.min(guide.maxTeams || MAX_TEAMS, MAX_TEAMS);

    const session = await mongoose.startSession();
    let populated;
    try {
      await session.withTransaction(async () => {
        const currentCount = await Team.countDocuments({ guideId: guide._id }).session(session);
        if (currentCount >= cap) {
          throw { _isSlotFull: true, cap };
        }
        team.guideId = guideId;
        team.status = "guide_approved";
        await team.save({ session });
      });
      populated = await Team.findById(team._id)
        .populate("members", "-password")
        .populate("guideId", "-password");
      res.json(populated);
    } catch (txErr) {
      if (txErr._isSlotFull) {
        return res.status(400).json({ message: `Sorry! ${guide.name} has no slots left. Please choose another guide.` });
      }
      throw txErr;
    } finally {
      session.endSession();
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─────────────────────────────────────────────
// GUIDE ROUTES
// ─────────────────────────────────────────────
app.get("/api/guides", protect, async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" }).select("-password");
    const withCapacity = await Promise.all(faculty.map(async (f) => {
      const assigned = await Team.countDocuments({ guideId: f._id });
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
    if (status === "guide_rejected") {
      team.currentReview = 0;
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
    const { title, patentStatus, patentSubStatus } = req.body;
    const team  = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const stage = team.currentReview;
    if (stage < 0 || stage > 4)
      return res.status(400).json({ message: "No review stage currently open for submission." });

    if (stage === 0 && !title?.trim()) {
      return res.status(400).json({ message: "Please provide the project title for Zeroth Review." });
    }

    let review = await Review.findOne({ teamId: team._id, reviewStage: stage });
    if (!review) review = new Review({ teamId: team._id, reviewStage: stage });

    review.status      = "pending";
    review.submittedAt = new Date();
    if (stage === 0) {
      review.title = title.trim();
      team.projectTitle = title.trim();
      await team.save();
    }
    if (patentStatus    !== undefined) review.patentStatus    = patentStatus;
    if (patentSubStatus !== undefined) review.patentSubStatus = patentSubStatus;

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
    if (stageNum < 0 || stageNum > 4) 
      return res.status(400).json({ message: "No active review stage to evaluate." });

    const review = await Review.findOne({ teamId: team._id, reviewStage: stageNum });
    if (!review) {
      return res.status(400).json({ message: "Student has not submitted the current review stage yet. Please wait for the student to submit." });
    }

    if (stageNum >= 1 && !review.submissionFile && !review.pptFileName) {
      return res.status(400).json({ message: "Student has not submitted any files for this review stage yet. Please wait for the student to submit." });
    }

    if (text && text.trim()) review.comments.push({ text: text.trim(), createdBy: req.user._id });
    if (status) {
      review.status = status;
      if (status === "approved") {
        if (stageNum === 0) {
          team.status = "guide_approved";
        }
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
    const teams = await Team.find().populate("members", "-password").populate("guideId", "-password").lean();

    const reviewGroups = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };
    const singleStudentTeams = [];

    teams.forEach((team) => {
      const stage = Math.min(Math.max(team.currentReview ?? 0, 0), 4);
      reviewGroups[stage].push(team);
      if ((team.members || []).length === 1) {
        singleStudentTeams.push(team);
      }
    });

    // Sort teams by teamId to maintain consistent ordering
    Object.keys(reviewGroups).forEach((stage) => {
      reviewGroups[stage].sort((a, b) => (a.teamId || '').localeCompare(b.teamId || ''));
    });
    singleStudentTeams.sort((a, b) => (a.teamId || '').localeCompare(b.teamId || ''));

    const workbook = new ExcelJS.Workbook();
    const workbooks = [
      { number: 5, label: REVIEW_STAGE_LABELS[0], stage: 0 },
      { number: 4, label: REVIEW_STAGE_LABELS[1], stage: 1 },
      { number: 3, label: REVIEW_STAGE_LABELS[2], stage: 2 },
      { number: 2, label: REVIEW_STAGE_LABELS[3], stage: 3 },
      { number: 1, label: REVIEW_STAGE_LABELS[4], stage: 4 },
    ];

    const header = ['Team ID', 'Project Title', 'Member Name', 'Register Number', 'Guide', 'Current Review'];

    workbooks.forEach(({ number, label, stage }) => {
      const sheet = workbook.addWorksheet(`${number} - ${label}`);
      sheet.columns = [
        { header: 'Team ID', key: 'teamId', width: 16 },
        { header: 'Project Title', key: 'projectTitle', width: 55 },
        { header: 'Member Name', key: 'memberName', width: 28 },
        { header: 'Register Number', key: 'registerNumber', width: 18 },
        { header: 'Guide', key: 'guide', width: 28 },
        { header: 'Current Review', key: 'currentReview', width: 20 },
      ];
      sheet.addRow(header);
      reviewGroups[stage].forEach((team) => {
        const guide = team.guideId?.name || '';
        const reviewLabel = REVIEW_STAGE_LABELS[team.currentReview ?? 0] || '';
        const members = team.members || [];
        if (members.length === 0) {
          sheet.addRow([team.teamId || '', team.projectTitle || '', '', '', guide, reviewLabel]);
        } else {
          members.forEach((member) => {
            sheet.addRow([team.teamId || '', team.projectTitle || '', member.name || '', member.registerNumber || '', guide, reviewLabel]);
          });
        }
      });
    });

    const singleWorkbook = new ExcelJS.Workbook();
    const singleSheet = singleWorkbook.addWorksheet('Single Student Teams');
    singleSheet.columns = [
      { header: 'Team ID', key: 'teamId', width: 16 },
      { header: 'Project Title', key: 'projectTitle', width: 55 },
      { header: 'Member Name', key: 'memberName', width: 28 },
      { header: 'Register Number', key: 'registerNumber', width: 18 },
      { header: 'Guide', key: 'guide', width: 28 },
      { header: 'Current Review', key: 'currentReview', width: 20 },
    ];
    singleSheet.addRow(header);
    singleStudentTeams.forEach((team) => {
      const guide = team.guideId?.name || '';
      const reviewLabel = REVIEW_STAGE_LABELS[team.currentReview ?? 0] || '';
      const member = team.members?.[0] || {};
      singleSheet.addRow([team.teamId || '', team.projectTitle || '', member.name || '', member.registerNumber || '', guide, reviewLabel]);
    });

    const reviewExportPath = path.join(exportsDir, 'review_export.xlsx');
    const singleExportPath = path.join(exportsDir, 'single_student_teams.xlsx');
    await workbook.xlsx.writeFile(reviewExportPath);
    await singleWorkbook.xlsx.writeFile(singleExportPath);

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    
    res.download(reviewExportPath, 'review_export.xlsx', (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        res.status(500).json({ message: downloadErr.message });
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/admin/export/sections", protect, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find().populate('members', '-password').populate('guideId', '-password').lean();
    const sectionTeams = buildSectionTeams(teams);

    const workbook = new ExcelJS.Workbook();
    const sectionKeys = SECTION_RANGES.map((section) => section.key);

    let globalTeamIndex = 0;
    sectionKeys.forEach((sectionKey) => {
      const rows = sectionTeams[sectionKey] || [];
      const sheet = workbook.addWorksheet(sectionKey);
      sheet.columns = [
        { header: 'Team ID', key: 'teamId', width: 18 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Project Title', key: 'projectTitle', width: 40 },
        { header: 'Member Name', key: 'memberName', width: 28 },
        { header: 'Register Number', key: 'registerNumber', width: 18 },
        { header: 'Guide', key: 'guide', width: 28 },
      ];
      sheet.addRow(['Team ID', 'Section', 'Project Title', 'Member Name', 'Register Number', 'Guide']);

      rows.forEach((teamData) => {
        const teamId = teamData.team.teamId || formatTeamId(globalTeamIndex);
        globalTeamIndex += 1;
        const guideName = teamData.team.guideId?.name || '';
        const projectTitle = teamData.team.projectTitle || '';

        if (teamData.members.length === 0) {
          sheet.addRow([teamId, sectionKey, projectTitle, '', '', guideName]);
          return;
        }

        teamData.members.forEach((member) => {
          sheet.addRow([
            teamId,
            sectionKey,
            projectTitle,
            member.name || '',
            member.registerNumber || '',
            guideName,
          ]);
        });
      });
    });

    if (sectionTeams.Unknown) {
      const unknownSheet = workbook.addWorksheet('Unknown');
      unknownSheet.columns = [
        { header: 'Team ID', key: 'teamId', width: 18 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Project Title', key: 'projectTitle', width: 40 },
        { header: 'Member Name', key: 'memberName', width: 28 },
        { header: 'Register Number', key: 'registerNumber', width: 18 },
        { header: 'Guide', key: 'guide', width: 28 },
      ];
      unknownSheet.addRow(['Team ID', 'Section', 'Project Title', 'Member Name', 'Register Number', 'Guide']);
      sectionTeams.Unknown.forEach((teamData) => {
        const teamId = teamData.team.teamId || formatTeamId(globalTeamIndex);
        globalTeamIndex += 1;
        const guideName = teamData.team.guideId?.name || '';
        const projectTitle = teamData.team.projectTitle || '';
        teamData.members.forEach((member) => {
          unknownSheet.addRow([
            teamId,
            'Unknown',
            projectTitle,
            member.name || '',
            member.registerNumber || '',
            guideName,
          ]);
        });
      });
    }

    const exportPath = path.join(exportsDir, 'class_section_teams.xlsx');
    await workbook.xlsx.writeFile(exportPath);

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    res.download(exportPath, 'class_section_teams.xlsx', (downloadErr) => {
      if (downloadErr && !res.headersSent) {
        res.status(500).json({ message: downloadErr.message });
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/admin/fix-team-ids", protect, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'registerNumber name')
      .populate('guideId', 'name')
      .lean();

    const orderedTeams = flattenSectionOrderedTeams(teams);
    const updates = orderedTeams.map((team, index) => {
      const teamId = formatTeamId(index);
      return {
        updateOne: {
          filter: { _id: team._id },
          update: { $set: { teamId } },
        },
      };
    });

    if (updates.length > 0) {
      await Team.bulkWrite(updates);
    }
    res.json({ message: `Assigned ${updates.length} teams canonical IDs in section order.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/admin/reset-title-review", protect, adminOnly, async (req, res) => {
  try {
    await Review.deleteMany({});
    await Team.updateMany({}, {
      $set: {
        projectTitle: "",
        currentReview: 0,
        status: "pending",
      },
    });
    res.json({ message: "Cleared all titles and reset every team to Zeroth Review." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
