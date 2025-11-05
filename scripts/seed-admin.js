import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/dbConnect.js';
import User from '../models/User.js';

// Lightweight .env.local loader (avoids extra dependency)
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch {}

async function main() {
  const [, , usernameArg, passwordArg, roleArg] = process.argv;
  const username = usernameArg || 'admin';
  const password = passwordArg || 'Admin12345!';
  const role = roleArg || 'admin';

  if (!username || !password) {
    console.error('Usage: node scripts/seed-admin.js <username> <password> [role]');
    process.exit(1);
  }

  await dbConnect();

  const count = await User.countDocuments();
  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`User "${username}" already exists with role ${existing.role}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const finalRole = count === 0 ? 'admin' : (role === 'admin' || role === 'editor' ? role : 'editor');
  const user = await User.create({ username, password: hashed, role: finalRole });
  console.log(`Created user: ${user.username} (role: ${user.role})`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
