const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
const qs = require("qs");
const crypto = require('crypto');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const verifyUrl = '/auth/verify-login-session/';
const loginUrl = '/auth/login/frontoffice';
const feBaseUrl = req.getFrontendUrl();
const legacyDbConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDbConfig);
const captcha = 'qa-bypass-captcha';
let emailAgent;
let emailBorrower;
let emailLender;

describe('Verify Login Session', () => {

  before(async () => {
    emailAgent = await registerAgent();
    emailLender = await registerLender();
    const borrowerRegister = await req.borrowerRegister();
    emailBorrower = borrowerRegister.emailAddress;

  });

  describe('#smoke', () => {
    it('Agent verify sessionId should success #TC-1478', async function () {
      const sessionId = await login(emailAgent);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Agent verify sessionId should return userId #TC-1479', async function () {
      const sessionId = await login(emailAgent);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userId).to.not.be.null;
    });

    it('Agent verify sessionId should return primaryId #TC-1480', async function () {
      const sessionId = await login(emailAgent);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.primaryId).to.not.be.null;
    });

    it('Agent verify sessionId should return agent userType #TC-1481', async function () {
      const sessionId = await login(emailAgent);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userType.name).to.equals("Agent");
    });

    it('Borrower verify sessionId should success #TC-1482', async function () {
      const sessionId = await login(emailBorrower);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Borrower verify sessionId should return userId #TC-1483', async function () {
      const sessionId = await login(emailBorrower);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userId).to.not.be.null;
    });

    it('Borrower verify sessionId should return primaryId #TC-1484', async function () {
      const sessionId = await login(emailBorrower);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.primaryId).to.not.be.null;
    });

    it('Borrower verify sessionId should return borrower userType #TC-1485', async function () {
      const sessionId = await login(emailBorrower);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userType.name).to.equals("Borrower");
    });

    it('Lender verify sessionId should success #TC-1486', async function () {
      const sessionId = await login(emailLender);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Lender verify sessionId should return userId #TC-1487', async function () {
      const sessionId = await login(emailLender);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userId).to.not.be.null;
    });

    it('Lender verify sessionId should return primaryId #TC-1488', async function () {
      const sessionId = await login(emailLender);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.primaryId).to.not.be.null;
    });

    it('Lender verify sessionId should return lender userType #TC-1489', async function () {
      const sessionId = await login(emailLender);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.data.userType.name).to.equals("Lender");
    });

  });

  describe('#negative', () => {
    it('Verify same sessionId more than 1 time should fail #TC-1490', async function () {
      const sessionId = await login(emailLender);
      await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + sessionId)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(404);
    });

    it('Verify sessionId with random identifier should return relevant error message (ID) #TC-1491', async function () {
      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + help.randomAlphaNumeric(4))
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Data session tidak ditemukan");
    });

    it('Verify sessionId with random identifier should return relevant error message (EN) #TC-1492', async function () {
      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .get(verifyUrl + help.randomAlphaNumeric(4))
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-627");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Data session not found");
    });

  });
});

async function registerAgent() {
  let agent = chai.request.agent(feBaseUrl);
  let getLegacyRefreshToken = await agent
    .get('/refresh-token')
    .send();
  const refreshToken = getLegacyRefreshToken.text.replace("\n", "");

  const registerBody = {
    _token: refreshToken,
    rd_customer_type: 4,
    rd_salutation: help.randomGender() ? "Mrs." : "Mr.",
    rd_full_name: help.randomFullName(),
    rd_email_address: help.randomEmail(),
    rd_mobile_number: help.randomPhoneNumber(),
    rd_upasswd: help.getDefaultPassword(),
    confirm_password: help.getDefaultPassword(),
    rd_agree_subscribe: "on",
    rd_agree_privacy: "on"
  };

  await agent.post('/doreg')
    .type('form')
    .send(qs.stringify(registerBody));

  const registerId = await legacyDb('registration_data')
    .select('rd_id')
    .first()
    .where({
      rd_email_address: registerBody.rd_email_address
    });

  const sha1Result = crypto.createHash('sha1')
    .update(String(registerId.rd_id))
    .digest('hex');

  const secretKey = vars.legacy_app_key;
  const hmacSha1Result = crypto.createHmac('sha1', secretKey)
    .update(String(registerId.rd_id))
    .digest('hex');
  const hashPattern = sha1Result + '-' + hmacSha1Result;

  const activationBody = qs.stringify({
    _token: refreshToken,
    do_sms_verification: "true",
    rd_id: hashPattern,
    sms_code: "111222"
  });
  await agent
    .post('/email-activation/' + hashPattern)
    .type('form')
    .send(activationBody);

  const surveyBody = qs.stringify({
    _token: refreshToken,
    do_submit: "true",
    know_other: "",
    know_investree_from: "Google"
  });
  await agent
    .post('/email-activation/' + hashPattern)
    .type('form')
    .send(surveyBody);

  return registerBody.rd_email_address
}

async function registerLender() {
  const registerBody = {
    "salutation": "Mr.",
    "fullname": help.randomFullName(),
    "email": help.randomEmail(),
    "mobilePrefix": "1",
    "phoneNumber": help.randomPhoneNumber(10),
    "password": help.getDefaultPassword(),
    "referralCode": "",
    "agreePrivacy": true,
    "agreeSubscribe": true
  };

  await chai.request(beBaseUrl)
    .post('/auth/registration/lender')
    .set(req.createNewCoreHeaders())
    .send(registerBody);

  const rdData = await legacyDb('registration_data')
    .select('rd_id')
    .first()
    .where({
      rd_email_address: registerBody.email
    });

  const sha1Result = crypto.createHash('sha1')
    .update(String(rdData.rd_id))
    .digest('hex');

  const secretKey = vars.legacy_app_key;
  const hmacSha1Result = crypto.createHmac('sha1', secretKey)
    .update(String(rdData.rd_id))
    .digest('hex');

  const hashPattern = sha1Result + '-' + hmacSha1Result;

  let agent = chai.request.agent(feBaseUrl);
  let getLegacyRefreshToken = await agent
    .get('/refresh-token');
  let refreshToken = getLegacyRefreshToken.text.replace("\n", "");

  const activationBody = qs.stringify({
    do_sms_verification: 'true',
    rd_id: hashPattern,
    sms_code: '111222',
    _token: refreshToken
  });

  await agent
    .post('/email-activation/' + hashPattern)
    .type('form')
    .send(activationBody);

  const surveyBody = qs.stringify({
    _token: refreshToken,
    do_submit: "true",
    know_other: "",
    know_investree_from: "Google"
  });

  await agent
    .post('/email-activation/' + hashPattern)
    .type('form')
    .send(surveyBody);

  return registerBody.email;
}

async function login(email) {
  const body = {
    "email": email,
    "password": help.getDefaultPassword(),
    "captcha": captcha
  };
  const loginRes = await chai.request(beBaseUrl)
    .post(loginUrl)
    .set(req.createNewCoreHeaders())
    .send(body);

  return loginRes.body.data.sessionId
}