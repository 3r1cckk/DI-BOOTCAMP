exports.up = async (knex) => {
  await knex.schema.createTable('books', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.string('author').notNullable();
    table.integer('publishedYear').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('books');
};