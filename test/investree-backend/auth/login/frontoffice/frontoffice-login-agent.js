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
const loginUrl = '/auth/login/frontoffice';
const feBaseUrl = req.getBOLegacyUrl();
const legacyDBConfig = require("@root/knexfile.js")[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDBConfig);
let emailAgent;
const captcha = "qa-bypass-captcha";

describe('Frontoffice Login as Agent', () => {

  before(async () => {
    const registerAgent = await agentRegistration();
    emailAgent = registerAgent.email;
  });

  describe('#smoke', () => {
    it('Agent login should succeed #TC-1366', async function () {
      let body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Agent login should have accessToken #TC-1367', async function () {
      let body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.data.accessToken).to.not.be.null;
    });

    it('Agent login should have legacyLoginData #TC-1368', async function () {
      let body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.data.legacyLoginData).to.not.be.null;
    });

    it('Agent login should have legacyAuthUser #TC-1369', async function () {
      let body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.data.legacyAuthUser).to.not.be.null;
    });

    it('Agent login should have sessionId #TC-1458', async function () {
      let body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-626");
      report.setSeverity(this, "blocker");

      expect(res.body.data.sessionId).to.not.be.null;
    });

    it('Agent login using valid credential after 9 fails should succeed #TC-1370', async function () {
      let body = {
        "email": emailAgent,
        "password": "salahDong17",
        "captcha": captcha
      };
      for (let index = 0; index < 9; index++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      body = {
        "email": emailAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Agent login using valid credential after unblock account and reset password should succeed #TC-1371', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;

      const loginAgent = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          "email": emailAddressAgent,
          "password": help.getDefaultPassword(),
          "captcha": captcha
        });
      const registrationId = loginAgent.body.data.registrationId;

      //blocking account
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };
      for (let index = 0; index <= 9; index++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      let agent = chai.request.agent(feBaseUrl)
      let getLegacyRefreshToken = await agent
        .get('/refresh-token')
        .send();
      const refreshToken = getLegacyRefreshToken.text.replace("\n", "");

      const loginBoPayload = qs.stringify({
        username: "erna",
        password: help.getDefaultPassword().toLowerCase(),
        _token: refreshToken
      });

      const login = await agent
        .post('/dologin')
        .type('form')
        .send(loginBoPayload);
      
      const unblockPayload = qs.stringify({
        id: registrationId,
        crud: "reset-pass-to-unblock-user",
        _token: refreshToken
      });
      
      await agent
        .post('/registration-list')
        .type('form')
        .send(unblockPayload);

      let unblockData = await legacyDb('unblock_user_data')
        .select('uud_id', 'uud_user_id')
        .first()
        .where({
          uud_status: 'D',
          uud_user_id: registrationId
        });

      const sha1Result = crypto.createHash('sha1')
        .update(String(unblockData.uud_id))
        .digest('hex');

      const secretKey = 'KvoiLoApRyPIgWRmDfiIQ3Gn9IYZJqhf';
      const hmacSha1Result = crypto.createHmac('sha1', secretKey)
        .update(String(unblockData.uud_user_id))
        .digest('hex');

      const newPassword = "Asdf1234";
      const resetPasswordPayload = qs.stringify({
        _token: refreshToken,
        rd_upasswd: newPassword,
        confirm_password: newPassword
      });
      await agent
        .post('/change-password-to-unblock/' + sha1Result + '-' + hmacSha1Result)
        .type('form')
        .send(resetPasswordPayload);

      body = {
        "email": emailAddressAgent,
        "password": newPassword,
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

  });

  describe('#negative', () => {
    it('Agent login using invalid password should fail #TC-1459', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Agent login using invalid password should return relevant error message (ID) #TC-1372', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("Accept-Language", "id_ID")
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("username dan password tidak tepat");
    });

    it('Agent login using invalid password should return relevant error message (EN) #TC-1373', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("Accept-Language", "en_US")
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Incorrect username or password");
    });

    it('Agent login using invalid password 10 times should fail #TC-1460', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };
      for (let index = 1; index <= 10; index++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      body = {
        "email": emailAddressAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Agent login using invalid password 10 times should return relevant error message (ID) #TC-1374', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };
      for (let index = 1; index <= 10; index++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      body = {
        "email": emailAddressAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Mohon maaf akun Anda terblokir. Silakan hubungi Customer Support kami di 1500886 untuk membuka blokir akun Anda.");
    });

    it('Agent login using invalid password 10 times should return relevant error message (EN) #TC-1375', async function () {
      const registAgent = await agentRegistration();
      const emailAddressAgent = registAgent.email;
      let body = {
        "email": emailAddressAgent,
        "password": "salahDong17",
        "captcha": captcha
      };
      for (let index = 1; index <= 10; index++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      body = {
        "email": emailAddressAgent,
        "password": help.getDefaultPassword(),
        "captcha": captcha
      };
      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("accept-language", "en_US")
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-547");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Sorry your account is blocked. Please call our Customer Service at 1500886 to unblock your account");
    });
  });
});

async function agentRegistration() {
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

  return {
    email: registerBody.rd_email_address
  };
}