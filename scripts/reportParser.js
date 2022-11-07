require('module-alias/register');
const fs = require('fs');
const http = require('http');
const help = require('@lib/helper');
const os = require('os');
const qaDb = require('@root/knexfile')['qa_report'];
const knex = require('knex')(qaDb);
process.setMaxListeners(0);

const BUILD = process.env.BUILD || null;
const ENV = process.env.ENV;
const WHERE = process.env.WHERE;
const TESTER_NAME = process.env.TESTER;

if (ENV === undefined || ENV === null) {
  console.log('[Report Scraper] No ENV variable. Aborting process.');
  process.exit(-1);
}

if (TESTER_NAME === undefined || TESTER_NAME === null) {
  console.log('[Report Scraper] No TESTER variable. Aborting process.');
  process.exit(-1);
}

const DEFAULT_REPORT_LOCATION = 'mochawesome-report/mochawesome.json';

let argv = process.argv.slice(2);
let REPORT_LOCATION = argv[0] === '--json-report' ? argv[1] : DEFAULT_REPORT_LOCATION;

/** Main script */
const main = async () => {
  console.log('[Report Scraper] Starting...');
  let startTime = help.startTime();

  const mochawesomeReport = JSON.parse(fs.readFileSync(REPORT_LOCATION));
  const reportChecksum = require('crypto')
    .createHash('sha256')
    .update(JSON.stringify(mochawesomeReport))
    .digest('hex');

  let suiteList = mochawesomeReport.results[0].suites;
  let chaiHttpPackageFile = require('@root/node_modules/chai-http/package');
  let defaultUserAgent = 'node-superagent/' + chaiHttpPackageFile
    .dependencies["@types/superagent"]
    .replace('^', '');

  let testerId = await getTesterId(TESTER_NAME);
  if (!testerId) {
    console.log(`[Report Scraper] User with tester name ${TESTER_NAME} not found. Aborting process.`)
    process.exit(-1);
  }

  let testRunSessionId = await addTestRunSession({
    "trs_u_id": testerId,
    "trs_started_at": mochawesomeReport.stats.start,
    "trs_ended_at": mochawesomeReport.stats.end,
    "trs_build_number": BUILD,
    "trs_env": ENV,
    "trs_req_origin": WHERE ? WHERE : await getPublicIp(),
    "trs_hostname": os.userInfo().username + '@' + os.hostname(),
    "trs_checksum": reportChecksum,
    "trs_created_at": knex.fn.now()
  });

  if (testRunSessionId === 'exist') {
    console.log('[Report Scraper] Report with the same checksum is already in database. Aborting process.')
    process.exit(-1);
  }

  for (let mainSuite of suiteList) {
    let serviceName = mainSuite.file.split('/')[2];

    let serviceListId = await addServiceList({
      "sl_name": serviceName.toLowerCase(),
      "sl_type": "backend",
      "sl_created_at": knex.fn.now(),
      "sl_updated_at": knex.fn.now()
    });

    let testSuiteId = await addTestSuite({
      "ts_sl_id": serviceListId,
      "ts_title": mainSuite.title.toLowerCase(),
      "ts_created_at": knex.fn.now(),
      "ts_updated_at": knex.fn.now()
    });

    let beforeHooksDuration = 0;
    let afterHooksDuration = 0;
    let tcsDuration = 0;

    for (let hook of mainSuite.beforeHooks) {
      beforeHooksDuration += hook.duration;
    }

    for (let hook of mainSuite.afterHooks) {
      afterHooksDuration += hook.duration;
    }

    let testSuiteRunTimeId = await addTestSuiteRunTime({
      "tsrt_ts_id": testSuiteId,
      "tsrt_trs_id": testRunSessionId,
      "tsrt_sl_id": serviceListId,
      "tsrt_duration": 0,
      "tsrt_before_hooks": beforeHooksDuration,
      "tsrt_after_hooks": afterHooksDuration,
      "tsrt_created_at": knex.fn.now()
    });

    for (let suite of mainSuite.suites) {
      tcsDuration += suite.duration;

      for (let tc of suite.tests) {
        let tcTitle = tc.title.toLowerCase();
        let fullTitle = tc.fullTitle.toLowerCase();
        let tcType; // smoke, negative
        let tcIsManual = false;
        let tcJiraId = null;
        let tcSeverity = '-';
        let trStatus = tc.state; // possibility: passed, failed, skipped
        let trRunTime = tc.duration;
        let trUserAgent;

        if (fullTitle.includes('#smoke')) {
          tcType = 'smoke';
        } else if (fullTitle.includes('#negative')) {
          tcType = 'negative';
        }

        if (tcTitle.includes('#manual')) {
          tcIsManual = true;
        }

        let trResponseTime = null;
        let tcContext = null;

        // No context for pending test
        if (tc.pending || tcIsManual) {
          trStatus = 'pending';
        } else if (tc.fail && tc.err.message.match(/AssertionError/g)) {
          trStatus = 'failed';
        } else if (!tc.pass) {
          trStatus = 'broken';
        }

        if (tc.context) {
          tcContext = JSON.parse(tc.context);
          let length = tcContext.length;

          let foundResponseTime = false;
          let foundJiraIssue = false;
          let foundSeverity = false;
          let foundUserAgent = false;

          while (length--) {
            if (foundResponseTime &&
              foundJiraIssue &&
              foundSeverity &&
              foundUserAgent)
              break;

            if (typeof tcContext[length] !== 'object')
              continue;

            // Get last response time of this testcase 
            // to represent "action" response time
            if (tcContext[length].title.match(/Response Time/)) {
              trResponseTime = tcContext[length].value.split(' ')[0];
              foundResponseTime = true;
            } else if (tcContext[length].title.match(/JIRA Issue/)) {
              tcJiraId = tcContext[length].value;
              foundJiraIssue = true;
            } else if (tcContext[length].title.match(/Severity/)) {
              tcSeverity = tcContext[length].value;
              foundSeverity = true;
            } else if (tcContext[length].title.match(/Request Payload/)) {
              if (tcContext[length].value !== 'undefined') {
                trUserAgent = tcContext[length].value.headers['user-agent'];
                foundUserAgent = true;
              }
            }
          }
          tcContext = JSON.stringify(tcContext);
        } else {
          tcContext = JSON.stringify(tc.err);
        }

        let psId;
        if (tcJiraId) {
          tcJiraId = tcJiraId.toUpperCase().trim();
          if (tcJiraId.split('-').length !== 2) {
            let strPart = tcJiraId.match(/\D/g).join('');
            tcJiraId = tcJiraId.replace(/\D/g, '');
            tcJiraId = strPart + '-' + tcJiraId;
          }

          psId = await addParentStory({
            "ps_jira_id": tcJiraId,
            "ps_created_at": knex.fn.now(),
            "ps_updated_at": knex.fn.now()
          });
        }

        let testCaseId = await addTestCase({
          "tc_ts_id": testSuiteId,
          "tc_ps_id": psId,
          "tc_title": tcTitle,
          "tc_type": tcType,
          "tc_is_manual": tcIsManual,
          "tc_severity": tcSeverity,
          "tc_created_at": knex.fn.now(),
          "tc_updated_at": knex.fn.now()
        });

        await addTestResult({
          "tr_tc_id": testCaseId,
          "tr_tsrt_id": testSuiteRunTimeId,
          "tr_status": trStatus,
          "tr_response_time": trResponseTime,
          "tr_run_time": trRunTime,
          "tr_browser": tcIsManual ? null : trUserAgent || defaultUserAgent,
          "tr_context": tcContext,
          "tr_created_at": knex.fn.now(),
          "tr_updated_at": knex.fn.now()
        });
      };
    };

    await updateTestSuitesRunTimeDuration(testSuiteRunTimeId, tcsDuration);
  };
  console.log('[Report Scraper] Finished');
  console.log('[Report Scraper] Elapsed time: ' +
    help.responseTime(startTime) + ' ms');
}

main()
  .then(() => knex.destroy());
/** End of main script */

async function getTesterId(testerName) {
  return knex.select('u_id')
    .from('users')
    .where({
      u_tester_name: testerName
    })
    .first()
    .then((row) => {
      if (row) {
        return row.u_id;
      }
    });
}

async function addServiceList(values) {
  return knex.select('sl_id')
    .from('service_list')
    .where({
      sl_name: values.sl_name
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('service_list')
          .returning('sl_id')
          .insert(values)
          .then(slId => slId[0]);
      } else {
        return row.sl_id;
      }
    });
}

async function addTestSuite(values) {
  return knex.select('ts_id')
    .from('test_suites')
    .where({
      ts_title: values.ts_title
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('test_suites')
          .returning('ts_id')
          .insert(values)
          .then(tsId => tsId[0]);
      } else {
        return row.ts_id;
      }
    });
}

async function addTestSuiteRunTime(values) {
  return knex.select('tsrt_id')
    .from('test_suites_run_time')
    .where({
      tsrt_ts_id: values.tsrt_ts_id,
      tsrt_trs_id: values.tsrt_trs_id
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('test_suites_run_time')
          .returning('tsrt_id')
          .insert(values)
          .then(tsrtId => tsrtId[0]);
      } else {
        return row.tsrt_id;
      }
    });
}

async function addTestCase(values) {
  return knex.select('tc_id')
    .from('test_cases')
    .where({
      tc_title: values.tc_title,
      tc_ts_id: values.tc_ts_id
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('test_cases')
          .returning('tc_id')
          .insert(values)
          .then(tsId => tsId[0]);
      } else {
        return row.tc_id;
      }
    });
}

async function addTestResult(values) {
  return knex('test_results')
    .insert(values);
}

async function addParentStory(values) {
  return knex.select('ps_id')
    .from('parent_story')
    .where({
      ps_jira_id: values.ps_jira_id
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('parent_story')
          .returning('ps_id')
          .insert(values)
          .then(psId => psId[0]);
      } else {
        return row.ps_id;
      }
    });
}

async function addTestRunSession(values) {
  return knex.select('trs_id')
    .from('test_run_session')
    .where({
      trs_checksum: values.trs_checksum
    })
    .first()
    .then((row) => {
      if (row === undefined) {
        return knex('test_run_session')
          .returning('trs_id')
          .insert(values)
          .then(trsId => trsId[0]);
      } else {
        return "exist";
      }
    });
}

async function updateTestSuitesRunTimeDuration(tsrtId, value) {
  return knex('test_suites_run_time')
    .where('tsrt_id', tsrtId)
    .update({
      tsrt_duration: value
    });
}

async function getPublicIp() {
  const data = [];
  return new Promise((resolve, reject) => {
    const req = http.get({
      host: 'ipv4bot.whatismyipaddress.com',
      port: 80,
      path: '/'
    }, function(res) {
      res.on("data", function(chunk) {
        data.push(chunk);
      });

      res.on('end', () => resolve(Buffer.concat(data).toString()));
    });

    req.on('error', function(e) {
      reject("[Report Scraper] Can't get external IP" + e.message);
    });

    req.end();
  });
}