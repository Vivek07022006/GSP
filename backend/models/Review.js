const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    reviewStage: { type: Number, required: true }, // 0 to 6
    submissionFile: { type: String }, // Path or URL to the file
    comments: [
      {
        text: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "changes"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
