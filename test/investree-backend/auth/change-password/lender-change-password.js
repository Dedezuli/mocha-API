const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const qs = require('qs');
const crypto = require('crypto');
const legacyDbConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDbConfig);
const dbFunction = require('@lib/dbFunction');
const redisConfig = dbFunction.redisConfig(req.getEnv(), { db: 2 });
const redis = require('redis').createClient(redisConfig);
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const feBaseUrl = req.getFrontendUrl();
const resetPasswordUrl = '/auth/change-password';
const NEW_PASSWORD = 'Asdf1234';

describe('Reset Password for Lender', function () {
  describe('#smoke', function () {
    it('Lender reset password should succeed #TC-1437', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: codeIdentifier,
        password: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD
      });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Lender reset password without code should fail #TC-1438', async function () {
      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: '',
        password: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD
      });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Lender reset password using invalid password format should return error message (ID) #TC-1439', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: codeIdentifier,
        password: 'asd1234',
        confirmPassword: 'asd1234'
      });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('Password harus meliputi angka, huruf besar dan 8-20 huruf');
    });

    it('Lender reset password using invalid password format should return error message (EN) #TC-1440', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(resetPasswordUrl)
        .set(req.createNewCoreHeaders())
        .set({
          'Accept-Language': 'en_US'
        })
        .send({
          code: codeIdentifier,
          password: 'asd12345',
          confirmPassword: 'asd12345'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('Password must contain number, alphabet, uppercase and 8-20 character');
    });

    it('Lender reset password without password should return error message (ID) #TC-1441', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: codeIdentifier,
        password: '',
        confirmPassword: NEW_PASSWORD
      });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('password tidak dapat kosong');
    });

    it('Lender reset password without password should return error message (EN) #TC-1442', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(resetPasswordUrl)
        .set(req.createNewCoreHeaders())
        .set({
          'Accept-Language': 'en_US'
        })
        .send({
          code: codeIdentifier,
          password: '',
          confirmPassword: NEW_PASSWORD
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('password must not be empty');
    });

    it('Lender reset password using mismatched password confirmation should return error message (ID) #TC-1443', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(resetPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send({
          code: codeIdentifier,
          password: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD + 'Asd'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('Password tidak sama');
    });

    it('Lender reset password using mismatched password confirmation should return error message (EN) #TC-1444', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(resetPasswordUrl)
        .set(req.createNewCoreHeaders())
        .set({
          'Accept-Language': 'en_US'
        })
        .send({
          code: codeIdentifier,
          password: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD + 'Asd'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.eql('Password not match');
    });

    it('Lender reset password without password confirmation should fail #TC-1445', async function () {
      const lenderRes = await registerLender();
      const codeIdentifier = await setForgotPasswordPrecondition(lenderRes.email, lenderRes.registrationId);

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: codeIdentifier,
        password: NEW_PASSWORD,
        confirmPassword: ''
      });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-570');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });
  });
});

async function getRegistrationId (emailAddress) {
  const registrationData = await legacyDb('registration_data')
    .select('rd_id')
    .where({
      rd_email_address: emailAddress
    })
    .first();

  return String(registrationData.rd_id);
}

async function setForgotPasswordPrecondition (emailAddress, registrationId) {
  const randomString = help.randomAlphaNumeric(32);
  const key = 'backend:forgot-password-session_' + randomString;
  await redis.setex(key, 1800, registrationId);
  await legacyDb('log_reset_password').insert({
    lrp_ip_address: `${help.randomInteger(3)}.${help.randomInteger(3)}.${help.randomInteger(2)}.${help.randomInteger(
      3
    )}`,
    lrp_email_address: emailAddress
  });

  return randomString;
}

async function registerLender () {
  const registerBody = {
    salutation: 'Mr.',
    fullname: help.randomFullName(),
    email: help.randomEmail(),
    mobilePrefix: '1',
    phoneNumber: help.randomPhoneNumber(10),
    password: help.getDefaultPassword(),
    referralCode: '',
    agreePrivacy: true,
    agreeSubscribe: true
  };

  await chai.request(beBaseUrl).post('/auth/registration/lender').set(req.createNewCoreHeaders()).send(registerBody);

  const rdId = await getRegistrationId(registerBody.email);

  const sha1Result = crypto.createHash('sha1').update(rdId).digest('hex');

  const secretKey = vars.legacy_app_key;
  const hmacSha1Result = crypto.createHmac('sha1', secretKey).update(rdId).digest('hex');

  const hashPattern = sha1Result + '-' + hmacSha1Result;

  const agent = chai.request.agent(feBaseUrl);
  const getLegacyRefreshToken = await agent.get('/refresh-token');
  const refreshToken = getLegacyRefreshToken.text.replace('\n', '');

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
    do_submit: 'true',
    know_other: '',
    know_investree_from: 'Google'
  });

  await agent
    .post('/email-activation/' + hashPattern)
    .type('form')
    .send(surveyBody);

  return {
    email: registerBody.email,
    registrationId: rdId
  };
}
