require('dotenv').config();

const connection = process.env.DATABASE_URL || {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres'
};

module.exports = {
  development: {
    client: 'pg',
    connection,
    pool: { min: 0, max: 10 },
    migrations: { directory: './server/migrations' }
  }
};