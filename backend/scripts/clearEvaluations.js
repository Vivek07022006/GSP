#!/usr/bin/env node
/**
 * clearEvaluations.js
 *
 * Run this script to clear guide evaluation fields from teams.
 * It will reset `projectType`, `assuredOutcome` and `studentMarks`.
 *
 * Usage:
 *   node clearEvaluations.js --all
 *   node clearEvaluations.js --ids=<id1,id2,...>
 *   node clearEvaluations.js            (defaults: clear teams that have any evaluation data)
 *
 * The script reads `MONGO_URI` from your environment (.env supported).
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
// Try to load .env from repository root (two levels up from this script)
const envPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback to CWD
}

const mongoose = require('mongoose');
const readline = require('readline');

let MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gsp';

const args = process.argv.slice(2);
let idsArg = null;
let clearAllFlag = false;
args.forEach(arg => {
  if (arg.startsWith('--ids=')) idsArg = arg.split('=')[1];
  if (arg === '--all') clearAllFlag = true;
  if (arg.startsWith('--uri=')) MONGO_URI = arg.split('=')[1];
  if (arg.startsWith('--mongoUri=')) MONGO_URI = arg.split('=')[1];
});

const ids = idsArg ? idsArg.split(',').map(s => s.trim()).filter(Boolean) : [];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function main() {
  console.log('Connecting to DB...');
  // Show where URI came from (mask credentials)
  try {
    const uriHost = (MONGO_URI.split('@').pop() || MONGO_URI).split('/')[0];
    console.log(`Using Mongo URI host: ${uriHost}`);
  } catch (e) {
    console.log('Using Mongo URI from environment');
  }
  // Use default options; some mongoose versions no longer accept connection option flags
  await mongoose.connect(MONGO_URI);

  // Loose schema so we can update whatever shape exists
  const Team = mongoose.model('Team', new mongoose.Schema({}, { strict: false }));

  let filter = {};
  if (ids.length > 0) {
    // Support either ObjectId strings or teamId tokens
    const objectIds = [];
    const otherIds = [];
    ids.forEach((id) => {
      if (/^[0-9a-fA-F]{24}$/.test(id)) objectIds.push(mongoose.Types.ObjectId(id));
      else otherIds.push(id);
    });
    const ors = [];
    if (objectIds.length) ors.push({ _id: { $in: objectIds } });
    if (otherIds.length) ors.push({ teamId: { $in: otherIds } });
    filter = ors.length === 1 ? ors[0] : { $or: ors };
  } else if (clearAllFlag) {
    filter = {}; // all teams
  } else {
    // Default: only teams that appear to have evaluation data
    filter = {
      $or: [
        { projectType: { $ne: '' } },
        { assuredOutcome: { $ne: '' } },
        { studentMarks: { $exists: true, $ne: [] } },
      ],
    };
  }

  const toClear = await Team.countDocuments(filter).exec();
  if (!toClear) {
    console.log('No teams found matching the selected filter. Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${toClear} team(s) that would be cleared.`);
  rl.question('Proceed and clear evaluation fields for these teams? (y/N): ', async (answer) => {
    const ok = String(answer || '').trim().toLowerCase() === 'y';
    if (!ok) {
      console.log('Aborted by user. No changes made.');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    try {
      const res = await Team.updateMany(filter, { $set: { projectType: '', assuredOutcome: '', studentMarks: [] } });
      const modified = res.modifiedCount ?? res.nModified ?? 0;
      console.log(`Cleared evaluation fields for ${modified} team(s).`);
    } catch (err) {
      console.error('Error while clearing evaluations:', err.message || err);
    } finally {
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }
  });
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
