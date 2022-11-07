/* eslint-disable no-console */

const chalk = require('chalk');
const { table, getBorderCharacters } = require('table');
const fs = require('fs').promises;
const glob = require('glob');

const tableConfig = {
  border: getBorderCharacters('void'),
  columnDefault: {
    paddingLeft: 0,
    paddingRight: 1
  },
  drawHorizontalLine: () => {
    return false;
  }
};

const TEST_FOLDER = 'test/**/*.js';
const TC_ID_PREFIX = '#TC-';
const DUPLICATE_TC_TITLE_MSG = chalk.red('Duplicate test case title');
const DUPLICATE_TC_ID_MSG = chalk.red('Duplicate test case ID');
const PASSED = chalk.green('PASSED');
const NOT_PASSED = chalk.red('NOT PASSED');

let isError = false;
let totalTestCases = 0;
let tcTitleTable = {};
const tcIdTable = {};

const testFiles = glob.sync(TEST_FOLDER);

(async function () {
  console.log('Checking test case titles...');

  for (const filePath of testFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const matched = content.toString().match(/(\s+)it(|\.skip)\(('|")+(.*)('|")/g);
    let errorList = [];

    // ignore non-test files
    if (!matched) continue;

    for (const title of matched) {
      totalTestCases += 1;

      let cleanedTitle = title.replace(/(\s+)it(|\.skip)\(('|")/, '');
      cleanedTitle = cleanedTitle.replace(/('|")/, '');

      if (cleanedTitle.indexOf(TC_ID_PREFIX) > 0) {
        const splitTitle = cleanedTitle.split(TC_ID_PREFIX);
        const titleOnly = splitTitle[0];
        const testCaseId = splitTitle[1];

        if (titleOnly in tcTitleTable) {
          errorList.push([cleanedTitle, DUPLICATE_TC_TITLE_MSG]);
          tcTitleTable[titleOnly] += 1;
        } else {
          tcTitleTable[titleOnly] = 1;
        }

        if (testCaseId in tcIdTable) {
          tcIdTable[testCaseId] += 1;
        } else {
          tcIdTable[testCaseId] = 1;
        }
      }
    }

    if (errorList.length > 0) {
      isError = true;
      console.log(`\nFile: ${chalk.underline(filePath)}`);
      console.log(table(errorList, tableConfig));
    }

    errorList = [];
    tcTitleTable = {};
  }

  const tcIdDuplicateErrorList = [];
  for (const [tcId, occurence] of Object.entries(tcIdTable)) {
    if (occurence > 1) {
      tcIdDuplicateErrorList.push([`${TC_ID_PREFIX}${tcId}`]);
    }
  }

  if (tcIdDuplicateErrorList.length > 0) {
    isError = true;
    console.log(DUPLICATE_TC_ID_MSG);
    console.log(table(tcIdDuplicateErrorList, tableConfig));
  }

  console.log(`Total test cases: ${totalTestCases}`);
  if (isError) {
    console.log(`Test case title check result: ${NOT_PASSED}`);
    console.log('Please resolve the problem\n');
    process.exit(0); // will change to 1 after refactor
  } else {
    console.log(`Test case title check result: ${PASSED}`);
    process.exit(0);
  }
})();
