const qaDb = require('../knexfile')['qa_report'];
const knex = require('knex')(qaDb);
const TESTER_NAME = process.env.TESTER;

if (!TESTER_NAME) {
  console.log('NO_TESTER_NAME');
  process.exit(-1);
}

knex('users')
  .where({
    u_tester_name: TESTER_NAME
  })
  .first()
  .then((row) => {
    if (row) {
      console.log('EXIST');
    } else {
      console.log('NOT_EXIST');
    }
  })
  .finally(() => knex.destroy());