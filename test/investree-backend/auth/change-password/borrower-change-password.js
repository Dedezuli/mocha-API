const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
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
const resetPasswordUrl = '/auth/change-password';
const NEW_PASSWORD = 'Asdf1234';

describe('Reset Password for Borrower', function () {
  describe('#smoke', function () {
    it('Borrower reset password should succeed #TC-1428', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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
    it('Borrower reset password without code should fail #TC-1429', async function () {
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

    it('Borrower reset password using invalid password format should return error message (ID) #TC-1430', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password using invalid password format should return error message (EN) #TC-1431', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password without password should return error message (ID) #TC-1432', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password without password should return error message (EN) #TC-1433', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password using mismatched password confirmation should return error message (ID) #TC-1434', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password using mismatched password confirmation should return error message (EN) #TC-1435', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

    it('Borrower reset password without password confirmation should fail #TC-1436', async function () {
      const borrowerEmail = help.randomEmail();
      await req.frontofficeRegister({
        email: borrowerEmail
      });
      const registrationId = await getRegistrationId(borrowerEmail);
      const codeIdentifier = await setForgotPasswordPrecondition(borrowerEmail, registrationId);

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

async function getRegistrationId (emailAddress) {
  const registrationData = await legacyDb('registration_data')
    .select('rd_id')
    .where({
      rd_email_address: emailAddress
    })
    .first();

  return String(registrationData.rd_id);
}
