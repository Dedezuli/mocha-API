module.exports = {
  qa_report: {
    client: 'pg',
    connection: {
      host: 'investree-management.pgsql.ap-southeast-5.rds.aliyuncs.com',
      port: 3433,
      database: 'qa',
      user: 'qa',
      password: 'iaNiTyRaTeRNIzAR',
      charset: 'utf8'
    },
    useNullAsDefault: true
  },

  dev: {
    client: 'mysql',
    connection: {
      host: 'investree-devel.mysql.ap-southeast-5.rds.aliyuncs.com',
      port: 3306,
      database: 'new_core',
      user: 'qa-test',
      password: 'Q1234'
    },
    useNullAsDefault: true
  },

  stg: {
    client: 'mysql',
    connection: {
      host: 'investree-staging.mysql.ap-southeast-5.rds.aliyuncs.com',
      port: 3306,
      database: 'new_core',
      user: 'panca',
      password: 'Ninvtreewow88_'
    },
    useNullAsDefault: true
  },

  dev_legacy: {
    client: 'mysql',
    connection: {
      host: '149.129.243.221',
      port: 3306,
      database: 'invtree_dev',
      user: 'qa_invtree',
      password: 'qwerty123456'
    },
    useNullAsDefault: true
  },

  stg_legacy: {
    client: 'mysql',
    connection: {
      host: '192.168.20.123',
      port: 3306,
      database: 'staging_invtree',
      user: 'qa_invtree',
      password: 'qwerty123456'
    },
    useNullAsDefault: true
  },
}