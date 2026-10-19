const db = require('../config/db');

function getAll() {
  return db('posts').select('*').orderBy('id');
}

function getById(id) {
  return db('posts').where({ id }).first();
}

async function create(post) {
  const [created] = await db('posts').insert(post).returning('*');
  return created;
}

async function update(id, post) {
  const [updated] = await db('posts').where({ id }).update(post).returning('*');
  return updated;
}

async function remove(id) {
  const [deleted] = await db('posts').where({ id }).delete().returning('id');
  return deleted;
}

module.exports = { getAll, getById, create, update, remove };