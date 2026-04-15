import { pool } from '../config/database';

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50)  UNIQUE,
  password_hash   VARCHAR(255),
  name            VARCHAR(100) NOT NULL DEFAULT '',
  email           VARCHAR(255),
  role_key        VARCHAR(50)  NOT NULL DEFAULT 'sales_manager',
  github_id       VARCHAR(100) UNIQUE,
  github_login    VARCHAR(100),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id              VARCHAR(20)  PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20)  NOT NULL,
  status          VARCHAR(10)  NOT NULL DEFAULT '在线',
  capacity        NUMERIC      NOT NULL,
  energy_capacity NUMERIC,
  current_power   NUMERIC      NOT NULL DEFAULT 0,
  location        VARCHAR(200),
  last_update     VARCHAR(30),
  soc             NUMERIC,
  extra_data      JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Demand response tasks
CREATE TABLE IF NOT EXISTS demand_response_tasks (
  id              VARCHAR(20)  PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  type            VARCHAR(10)  NOT NULL,
  status          VARCHAR(10)  NOT NULL DEFAULT '待响应',
  target_power    NUMERIC      NOT NULL,
  current_power   NUMERIC      NOT NULL DEFAULT 0,
  start_time      VARCHAR(30),
  end_time        VARCHAR(30),
  progress        INTEGER      NOT NULL DEFAULT 0,
  reward          NUMERIC      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Monthly revenue
CREATE TABLE IF NOT EXISTS revenue (
  id              SERIAL PRIMARY KEY,
  year            INTEGER      NOT NULL,
  month           VARCHAR(10)  NOT NULL,
  peak_revenue    NUMERIC      NOT NULL DEFAULT 0,
  freq_revenue    NUMERIC      NOT NULL DEFAULT 0,
  aux_revenue     NUMERIC      NOT NULL DEFAULT 0,
  total_revenue   NUMERIC      NOT NULL DEFAULT 0,
  UNIQUE (year, month)
);

-- News
CREATE TABLE IF NOT EXISTS news (
  id              VARCHAR(20)  PRIMARY KEY,
  title           VARCHAR(500) NOT NULL,
  summary         TEXT,
  source          VARCHAR(200),
  date            DATE,
  category        VARCHAR(20),
  tags            JSONB        NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Agent chat history
CREATE TABLE IF NOT EXISTS agent_chat_history (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  agent_key   VARCHAR(50)  NOT NULL,
  messages    JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, agent_key)
);

-- Agent file uploads
CREATE TABLE IF NOT EXISTS agent_uploads (
  id          UUID         PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  agent_key   VARCHAR(50)  NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  parsed_data JSONB        NOT NULL DEFAULT '[]',
  row_count   INTEGER      NOT NULL DEFAULT 0,
  columns     JSONB        NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('✅ Database migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
