import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import config from '../config/index.js'
import pool from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 确保数据库与表结构存在 */
export async function initDatabase() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password
  })

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`
       DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  } finally {
    await conn.end()
  }

  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')
  const statements = schema
    .split(';')
    .map((s) => s.replace(/--.*$/gm, '').trim())
    .filter((s) => /^CREATE TABLE/i.test(s))

  for (const sql of statements) {
    await pool.query(sql)
  }

  console.log(`数据库已就绪：${config.db.database}`)
}
