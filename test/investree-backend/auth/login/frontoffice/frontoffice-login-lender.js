const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const qs = require('qs');
const chai = require('chai');
const chaiHttp = require('chai-http');
const crypto = require('crypto');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const loginUrl = '/auth/login/frontoffice';
const feBaseUrl = req.getBOLegacyUrl();
const legacyDbConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDbConfig);
let lenderEmail;
const captcha = "qa-bypass-captcha";

describe('Frontoffice Login as Lender', () => {
  before(async () => {
      lenderEmail = await registerLender();
  });

  describe('#smoke', () => {
    it('Lender login should succeed #TC-1277', async function() {
      let body = {
        "email": lenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Lender login should have accessToken #TC-1278', async function() {
      let body = {
        "email": lenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.data.accessToken).to.not.be.null;
    });

    it('Lender login should have legacyLoginData #TC-1279', async function() {
      let body = {
        "email": lenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.data.legacyLoginData).to.not.be.null;
    });

    it('Lender login should have legacyAuthUser #TC-1280', async function() {
      let body = {
        "email": lenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.data.legacyAuthUser).to.not.be.null;
    });

    it('Lender login should have legacyMobileToken #TC-1281', async function() {
      let body = {
        "email": lenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.data.legacyMobileToken).to.not.be.null;
    });

    it('Lender login should have sessionId #TC-1455', async function () {
      let body = {
        "email": lenderEmail,
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

    it.skip('Lender login using valid credential after 9 fails should succeed #TC-1282', async function() {
      let body = {
        "email": lenderEmail,
        "password": "salahDong17",
        "captcha": captcha
      };

      for (let i = 0; i < 9; i++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      let startTime = help.startTime();
      let res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it.skip('Lender login using valid credential after unblock account and reset password should succeed #TC-1283', async function() {
      const newLenderEmail = await registerLender();

      const lenderLoginRes = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
            "email": newLenderEmail,
            "password": help.getDefaultPassword(),
            "captcha": captcha
        });
      const registrationId = lenderLoginRes.body.data.registrationId;

      // Blocking user
      for (let i = 0; i < 10; i++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send({
            'email': newLenderEmail,
            'password': 'Salahpassword123' ,
            "captcha": captcha
          });
      }

      let agent = chai.request.agent(feBaseUrl);
      let getLegacyRefreshToken = await agent
        .get('/refresh-token')
        .send();
      let refreshToken = getLegacyRefreshToken.text.replace("\n", "");

      const boLoginPayload = qs.stringify({
        username: "erna",
        password: help.getDefaultPassword().toLowerCase(),
        _token: refreshToken
      });

      await agent
        .post('/dologin')
        .type('form')
        .send(boLoginPayload);

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

      const secretKey = vars.legacy_app_key;
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
        .post(`/change-password-to-unblock/${sha1Result}-${hmacSha1Result}`)
        .type('form')
        .send(resetPasswordPayload);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          'email': email,
          'password': newPassword
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', () => {
    it('Lender login using invalid password should fail #TC-1456', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        "email": newLenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender login using invalid password should return relevant error message (ID) #TC-1284', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        "email": newLenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("username dan password tidak tepat");
    });

    it('Lender login using invalid password should return relevant error message (EN) #TC-1285', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        "email": newLenderEmail,
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
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Incorrect username or password");
    });

    it('Lender login using invalid password 10 times should fail #TC-1457', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        'email': newLenderEmail,
        'password': 'salahDong17',
        "captcha": captcha
      };

      for (let i = 0; i < 10; i++) {
        let x = await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("Accept-Language", "id_ID")
        .send({
          'email': newLenderEmail,
          'password': help.getDefaultPassword(),
          "captcha": captcha
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender login using invalid password 10 times should return relevant error message (ID) #TC-1286', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        'email': newLenderEmail,
        'password': 'salahDong17',
        "captcha": captcha
      };

      for (let i = 0; i < 10; i++) {
        let x = await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("Accept-Language", "id_ID")
        .send({
          'email': newLenderEmail,
          'password': help.getDefaultPassword(),
          "captcha": captcha
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Mohon maaf akun Anda terblokir. Silakan hubungi Customer Support kami di 1500886 untuk membuka blokir akun Anda.");
    });

    it('Lender login using invalid password 10 times should return relevant error message (EN) #TC-1287', async function() {
      let newLenderEmail = await registerLender();
      
      let body = {
        'email': newLenderEmail,
        'password': 'salahDong17',
        "captcha": captcha
      };

      for (let i = 0; i < 10; i++) {
        await chai.request(beBaseUrl)
          .post(loginUrl)
          .set(req.createNewCoreHeaders())
          .send(body);
      }

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set("accept-language", "en_US")
        .send({
          'email': newLenderEmail,
          'password': help.getDefaultPassword(),
          "captcha": captcha
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-548");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.equals("Sorry your account is blocked. Please call our Customer Service at 1500886 to unblock your account");
    });
  });
});

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