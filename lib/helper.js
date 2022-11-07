const faker = require('faker/locale/id_ID');
const { Random } = require('random-js');
const moment = require('moment');
const convertHrtime = require('convert-hrtime');
const vars = require('@fixtures/vars');
const config = require('@root/config');

function randomFullName(gender, uppercase = true) {
  // 0 = male, 1 = female
  let fullName = faker.name.firstName(gender) + " " + faker.name.lastName(gender);
  if (uppercase) {
    fullName = fullName.toUpperCase()
  }
  return fullName;
}

function randomInteger(length, options) {
  const pool = "1234567890";
  if (length === "KTP") {
    length = 16;
  } else if (length === "NPWP") {
    length = 15;
  }

  let result = new Random().string(length, pool);

  if (result.charAt(0) === '0') {
    let randomNum = new Random().integer(1, 9);
    result = randomNum + result.slice(1, result.length);
  }

  if (options && options.formatNpwp === true) {
    let firstPart = result.slice(0, 2);
    let secondPart = result.slice(2, 5);
    let thirdPart = result.slice(5, 8);
    let fourthPart = result.slice(8, 9);
    let fifthPart = result.slice(9, 12);
    let sixthPart = result.slice(12, 15);
    result = firstPart + '.' + secondPart +
      '.' + thirdPart + '.' + fourthPart +
      '-' + fifthPart + '.' + sixthPart;
  }

  return result;
}

function randomPhoneNumber(length = 9) {
  const pool = "1234567890";

  let result = new Random().string(length, pool);
  if (result.charAt(0) === '0') {
    let randomNum = new Random().integer(1, 9);
    result = randomNum + result.slice(1, result.length);
  }

  return result;
}

function timestamp() {
  let dateObj = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta"
  });
  dateObj = new Date(dateObj);
  return dateObj;
}

function startTime() {
  return process.hrtime();
}

function responseTime(startTime) {
  return Math.floor(convertHrtime(process.hrtime(startTime))['milliseconds']);
}

function setSalutation(gender) {
  // 0 = male, 1 = female
  let salutation;
  if (gender === 0) {
    salutation = "Mr.";
  } else {
    salutation = Math.random() <= 0.5 ? "Mrs." : "Ms.";
  }
  return salutation;
}

function randomGender() {
  return new Random().integer(0, 1);
}

function randomAlphaNumeric(length = 12) {
  return faker.random.alphaNumeric(length);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomAddress() {
  const addressPool = require('@fixtures/indonesia_region.json');
  const random = new Random().die(addressPool.length);
  return addressPool[random - 1];
}

function randomDate(endYear = null, startYear = 1970) {
  let startDate = new Date(`${startYear}-01-01`);
  let endDate = '';
  if (endYear === null) {
    endDate = new Date();
  } else {
    endDate = new Date(`${endYear}-01-01`);
  }
  return formatDate(new Random().date(startDate, endDate));
}

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD');
}


function randomCompanyName(wordCount = 2) {
  return faker.lorem.words(wordCount).toUpperCase();
}

function randomDescription(paragraphCount = 1) {
  return `${faker.company.bs()}. ${faker.lorem.paragraphs(paragraphCount)}`;
}

function futureDate(years = 1) {
  return formatDate(faker.date.future(years));
}

function dateUnder17YearsOld() {
  let date = new Date();
  date.setFullYear(date.getFullYear() - 17);
  date.setDate(date.getDate() + 1);
  return formatDate(date);
}


function randomDecimal(decimalPoint = 2, min = 10, max = 80) {
  let decimal = new Random().real(min, max).toString().split('.');
  decimal[1] = decimal[1].slice(0, decimalPoint);
  let result = `${decimal[0]}.${decimal[1]}`;
  return parseFloat(result);
}

function randomUrl(format = "jpg") {
  return `https://investree.id/${new Random().uuid4()}.${format}`;
}

function randomEmail() {
  return `test.${randomAlphaNumeric()}@investree.id`;
}

function getRootDir() {
  let currentDir = __dirname.split('/');
  currentDir.pop();
  return currentDir.join('/');
}

function getFullPath(fileOrFolder) {
  let target = fileOrFolder.split('/');
  if (target[0] === '') {
    target.shift();
  }

  target = target.join('/');
  target = '/' + target;

  return getRootDir() + target;
}

function isUrl(url) {
  let exp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  let regex = new RegExp(exp);
  return url.match(regex) ? true : false;
}

function backDateByYear(yearCount) {
  let date = new Date();
  date.setFullYear(date.getFullYear() - yearCount);
  return formatDate(date);
}

function getDefaultPassword(options) {
  if (options && options.hash && options.hash === 'sha1')
    return 'c061effd8549cbd3eb9b4b32aa3bad23646e5b7a';
  else if (options && options.hash && options.hash === 'hmac')
    return '23aaf26abb7c7224c4d1cb687d78aca368f3b29d';
  else
    return vars.default_password;
}

function backDateByDays(days) {
  let date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function futureDateByDays(days) {
  let date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function getMbizKey(type = 'DM') {
  if (type == 'DM') {
    return vars.keyMbizDM;
  } else if (type == 'QR') {
    return vars.keyMbizQR
  } else {
    console.error('[ERROR] Key is not defined')
  }

}

function getMbizAccessToken() {
  return 1;
}

function getBilltreeKey() {
  return vars.keyBilltree;
}

function dateAbove17YearsOld() {
  let date = new Date();
  date.setFullYear(date.getFullYear() - 17);
  date.setDate(date.getDate() - 1);
  return formatDate(date);

}

function randomLoanAmount() {
  return (Math.floor(Math.random() * (1000 - 2)) + 2) * 1000000;
}
module.exports = {
  randomFullName: randomFullName,
  randomInteger: randomInteger,
  randomPhoneNumber: randomPhoneNumber,
  timestamp: timestamp,
  startTime: startTime,
  responseTime: responseTime,
  setSalutation: setSalutation,
  randomGender: randomGender,
  randomAlphaNumeric: randomAlphaNumeric,
  sleep: sleep,
  randomAddress: randomAddress,
  randomDate: randomDate,
  formatDate: formatDate,
  randomCompanyName: randomCompanyName,
  randomDescription: randomDescription,
  futureDate: futureDate,
  dateUnder17YearsOld: dateUnder17YearsOld,
  randomDecimal: randomDecimal,
  randomUrl: randomUrl,
  randomEmail: randomEmail,
  getRootDir: getRootDir,
  getFullPath: getFullPath,
  isUrl: isUrl,
  backDateByYear: backDateByYear,
  getDefaultPassword: getDefaultPassword,
  backDateByDays: backDateByDays,
  futureDateByDays: futureDateByDays,
  getMbizKey: getMbizKey,
  getMbizAccessToken: getMbizAccessToken,
  dateAbove17YearsOld: dateAbove17YearsOld,
  randomLoanAmount: randomLoanAmount,
  getBilltreeKey: getBilltreeKey
}
