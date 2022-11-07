const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars')
const chai = require('chai');
const chaiHttp = require('chai-http');
const qs = require("qs");
const crypto = require('crypto');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const feBaseUrl = req.getFrontendUrl();
const loginUrl = '/auth/login/frontoffice';
const logoutUrl = '/auth/logout';
const legacyDBConfig = require("@root/knexfile.js")[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDBConfig);
const captcha = "qa-bypass-captcha";

describe('Logout via Investree Backend', () => {

  describe('#smoke', () => {
    it('Agent logout should succeed #TC-1386', async function () {
      const register = await agentRegistration();
      const body = {
        "email": register.emailAddress,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };
      const loginResponse = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
        
      const startTime = help.startTime();
      const logoutResponse = await chai.request(beBaseUrl)
        .get(logoutUrl)
        .set(req.createNewCoreHeaders({
          'X-Investree-Token': loginResponse.body.data.accessToken
        }))
        .send();
      responseTime = help.responseTime(startTime);
      report.setPayload(this, logoutResponse, responseTime);
      report.setIssue(this, "NH-573");
      report.setSeverity(this, "blocker");

      expect(logoutResponse).to.have.status(200);
    });

    it('Borrower logout should succeed #TC-1387', async function () {
      const register = await req.borrowerRegister();
      const body = {
        "email": register.emailAddress,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };
      const loginResponse = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);

      const startTime = help.startTime();
      const logoutResponse = await chai.request(beBaseUrl)
        .get(logoutUrl)
        .set(req.createNewCoreHeaders({
          'X-Investree-Token': loginResponse.body.data.accessToken
        }))
        .send();
      responseTime = help.responseTime(startTime);
      report.setPayload(this, logoutResponse, responseTime);
      report.setIssue(this, "NH-573");
      report.setSeverity(this, "blocker");

      expect(logoutResponse).to.have.status(200);
    })

    it('Lender logout should succeed #TC-1388', async function () {
      const register = await lenderRegistration();
      const body = {
        "email": register.emailAddress,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };
      const loginResponse = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);

      const startTime = help.startTime();
      const logoutResponse = await chai.request(beBaseUrl)
        .get(logoutUrl)
        .set(req.createNewCoreHeaders({
          'X-Investree-Token': loginResponse.body.data.accessToken
        }))
        .send();
      responseTime = help.responseTime(startTime);
      report.setPayload(this, logoutResponse, responseTime);
      report.setIssue(this, "NH-573");
      report.setSeverity(this, "blocker");

      expect(logoutResponse).to.have.status(200);
    })

  });
});

async function agentRegistration() {
  let agent = chai.request.agent(feBaseUrl);
  const getLegacyRefreshToken = await agent
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

  await agent
    .post('/doreg')
    .type('form')
    .send(qs.stringify(registerBody));
  await emailVerification(registerBody.rd_email_address)

  return {
    emailAddress: registerBody.rd_email_address
  };
}

async function lenderRegistration() {
  let gender = help.randomGender();
  const registerBody = {
    "salutation": gender ? "Mrs." : "Mr.",
    "fullname": help.randomFullName(gender),
    "email": help.randomEmail(),
    "mobilePrefix": "1",
    "phoneNumber": help.randomPhoneNumber(),
    "password": help.getDefaultPassword(),
    "referralCode": "",
    "agreePrivacy": true,
    "agreeSubscribe": true
  };

  await chai.request(beBaseUrl)
    .post('/auth/registration/lender')
    .set(req.createNewCoreHeaders())
    .send(registerBody);

  await emailVerification(registerBody.email)

  return {
    emailAddress: registerBody.email
  };
}

async function emailVerification(emailAddress) {
  let agent = chai.request.agent(feBaseUrl);
  const getLegacyRefreshToken = await agent
    .get('/refresh-token')
    .send();
  const refreshToken = getLegacyRefreshToken.text.replace("\n", "");

  const registerId = await legacyDb('registration_data')
    .select('rd_id')
    .first()
    .where({
      rd_email_address: emailAddress
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
}