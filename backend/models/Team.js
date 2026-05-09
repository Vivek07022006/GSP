const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    projectTitle: { type: String },
    currentReview: { 
      type: Number, 
      default: 0 // 0: Zeroth, 1: First, etc.
    },
    status: {
      type: String,
      enum: ["pending", "guide_approved", "guide_rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
