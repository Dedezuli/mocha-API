const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
const qs = require('qs');
const crypto = require('crypto');
const dbFunction = require('@lib/dbFunction');
chai.use(chaiHttp);
const expect = chai.expect;

const legacyDbConfig = require('@root/knexfile')[req.getEnv() + '_legacy'];
const legacyDb = require('knex')(legacyDbConfig);
const redisConfig = dbFunction.redisConfig(req.getEnv(), { db: 2 });
const redis = require('redis').createClient(redisConfig);
const beBaseUrl = req.getBackendUrl();
const verifyUrl = '/auth/verify-forgot-password/';
const resetPasswordUrl = '/auth/change-password';
const feBaseUrl = req.getFrontendUrl();

describe('Verify Link Forgot Password', function () {
  describe('#smoke', function () {
    it('Agent verify using valid identifier should succeed #TC-1544', async function () {
      const agentEmail = await registerAgent();
      const identifier = await setForgotPasswordPrecondition(agentEmail);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('Lender verify using valid identifier should succeed #TC-1545', async function () {
      const lenderEmail = await registerLender();
      const identifier = await setForgotPasswordPrecondition(lenderEmail);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('Borrower verify using valid identifier should succeed #TC-1546', async function () {
      const brwUser = await req.borrowerRegister();
      const identifier = await setForgotPasswordPrecondition(brwUser.emailAddress);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Verify with used identifier should fail #TC-1547', async function () {
      const brwUser = await req.borrowerRegister();
      const identifier = await setForgotPasswordPrecondition(brwUser.emailAddress);
      await chai.request(beBaseUrl).post(resetPasswordUrl).set(req.createNewCoreHeaders()).send({
        code: identifier,
        password: 'Asdf1234',
        confirmPassword: 'Asdf1234'
      });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Verify invalid identifier should return relevant error message (ID) #TC-1548', async function () {
      const identifier = help.randomAlphaNumeric();

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals(
        'link telah kadaluarsa, silakan akses lupa kata sandi lagi'
      );
    });

    it('Verify invalid identifier should return relevant error message (EN) #TC-1549', async function () {
      const identifier = help.randomAlphaNumeric();

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals(
        'link has expired, please access forgot password again'
      );
    });

    it('Verify old identifier after request forgot password should fail #TC-1558', async function () {
      const agentEmail = await registerAgent();
      const identifier = await setForgotPasswordPrecondition(agentEmail);
      await chai
        .request(beBaseUrl)
        .post('/auth/forgot-password')
        .set(req.createNewCoreHeaders())
        .send({
          email: agentEmail,
          captcha: 'qa-bypass-captcha'
        });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(verifyUrl + identifier)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-649');
      report.setSeverity(this, 'critical');

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

async function setForgotPasswordPrecondition (emailAddress) {
  const randomString = help.randomAlphaNumeric(32);
  const key = 'backend:forgot-password-session_' + randomString;
  const value = await getRegistrationId(emailAddress);
  await legacyDb('log_reset_password').insert({
    lrp_ip_address: `${help.randomInteger(3)}.${help.randomInteger(3)}.${help.randomInteger(
      2
    )}.${help.randomInteger(3)}`,
    lrp_email_address: emailAddress,
    lrp_datetime: new Date(Date.now() - 35000)
  });

  await redis.setex(key, 1800, value);

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

  return registerBody.rd_email_address;
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

  await chai
    .request(beBaseUrl)
    .post('/auth/registration/lender')
    .set(req.createNewCoreHeaders())
    .send(registerBody);

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

  return registerBody.email;
}
