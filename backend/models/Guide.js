const mongoose = require("mongoose");

const guideSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    maxTeams: { type: Number, default: 7 },
    assignedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guide", guideSchema);
