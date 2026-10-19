exports.up = async (knex) => {
  await knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('content').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('posts');
};