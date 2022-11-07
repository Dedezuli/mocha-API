const req = require('@lib/request');
const newcoreDbConfig = require('@root/knexfile.js')[req.getEnv()];
const help = require('@lib/helper');

async function changeEmailByUsername(username) {
  const knex = require('knex')(newcoreDbConfig);

  return knex('login_data')
    .where('ld_username', username)
    .update('ld_email_address', `testqa${help.randomAlphaNumeric()}@investree.investree`);
}

function redisConfig(env, config) {
  const redisConfig = require('@root/redisConfig')[env];
  return {
    ...redisConfig,
    ...config
  };
}

module.exports = {
  changeEmailByUsername: changeEmailByUsername,
  redisConfig
}