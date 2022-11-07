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

describe('Reset Password for Agent', function () {
  describe('#smoke', function () {
    it('Agent reset password should succeed #TC-1446', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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
    it('Agent reset password without code should fail #TC-1447', async function () {
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

    it('Agent reset password using invalid password format should return error message (ID) #TC-1448', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password using invalid password format should return error message (EN) #TC-1449', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password without password should return error message (ID) #TC-1450', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password without password should return error message (EN) #TC-1451', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password using mismatched password confirmation should return error message (ID) #TC-1452', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password using mismatched password confirmation should return error message (EN) #TC-1453', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

    it('Agent reset password without password confirmation should fail #TC-1454', async function () {
      const agentRes = await registerAgent();
      const codeIdentifier = await setForgotPasswordPrecondition(agentRes.email, agentRes.registrationId);

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

async function registerAgent () {
  const agent = chai.request.agent(feBaseUrl);
  const getLegacyRefreshToken = await agent.get('/refresh-token').send();
  const refreshToken = getLegacyRefreshToken.text.replace('\n', '');

  const registerBody = {
    _token: refreshToken,
    rd_customer_type: 4,
    rd_salutation: help.randomGender() ? 'Mrs.' : 'Mr.',
    rd_full_name: help.randomFullName(),
    rd_email_address: help.randomEmail(),
    rd_mobile_number: help.randomPhoneNumber(),
    rd_upasswd: help.getDefaultPassword(),
    confirm_password: help.getDefaultPassword(),
    rd_agree_subscribe: 'on',
    rd_agree_privacy: 'on'
  };

  await agent.post('/doreg').type('form').send(qs.stringify(registerBody));

  const rdId = await getRegistrationId(registerBody.rd_email_address);

  const sha1Result = crypto.createHash('sha1').update(rdId).digest('hex');

  const secretKey = vars.legacy_app_key;
  const hmacSha1Result = crypto.createHmac('sha1', secretKey).update(rdId).digest('hex');
  const hashPattern = sha1Result + '-' + hmacSha1Result;

  const activationBody = qs.stringify({
    _token: refreshToken,
    do_sms_verification: 'true',
    rd_id: hashPattern,
    sms_code: '111222'
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
    email: registerBody.rd_email_address,
    registrationId: rdId
  };
}
