const db = require('../config/db');

function getAll() {
  return db('books').select('*').orderBy('id');
}

function getById(id) {
  return db('books').where({ id }).first();
}

async function create(book) {
  const [created] = await db('books').insert(book).returning('*');
  return created;
}

async function update(id, book) {
  const [updated] = await db('books').where({ id }).update(book).returning('*');
  return updated;
}

async function remove(id) {
  const [deleted] = await db('books').where({ id }).delete().returning('id');
  return deleted;
}

module.exports = { getAll, getById, create, update, remove };