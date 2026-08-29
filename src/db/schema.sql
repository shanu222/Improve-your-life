-- Daily local schema. All private rows are owned by userId.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  email TEXT,
  authProvider TEXT NOT NULL DEFAULT 'local'
);

CREATE TABLE IF NOT EXISTS profiles (
  userId TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  userId TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_prefs (
  userId TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  localDate TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(userId, localDate);
CREATE INDEX IF NOT EXISTS idx_entries_user_type ON entries(userId, type);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  habitId TEXT NOT NULL,
  userId TEXT NOT NULL,
  localDate TEXT NOT NULL,
  completed INTEGER NOT NULL,
  occurredAt TEXT NOT NULL,
  UNIQUE(habitId, localDate),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  UNIQUE(userId, kind),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  localDate TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  badgeKey TEXT NOT NULL,
  earnedAt TEXT NOT NULL,
  UNIQUE(userId, badgeKey),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  localDate TEXT NOT NULL,
  score INTEGER NOT NULL,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(userId, localDate),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  weekStart TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(userId, weekStart),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
