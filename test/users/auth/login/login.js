const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const crypto = require('crypto');
const legacyDbConf = require('@root/knexfile.js')[request.getEnv() + '_legacy'];
const newcoreDbConf = require('@root/knexfile.js')[request.getEnv()];

describe('Login', function () {
  const verifyOtpUrl = '/validate/notification/otp/verify';
  const productPrefUrl = '/validate/customer/customer-information/product-preference';
  const maxLoginAttempts = 10;
  const urlLogin = '/validate/users/auth/login';
  let username;

  before(async function () {
    const registerRes = await request.frontofficeRegister();
    username = registerRes.body.data.userName;
  });

  describe('#smoke', function () {
    it('Login as borrower should succeed #TC-322', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Login as borrower should return access token #TC-323', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('accessToken');
    });

    it('Login as backoffice user should succeed #TC-324', async function () {
      const body = {
        username: boUser.admin.username,
        password: boUser.admin.password,
        flag: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Login as backoffice user should return access token #TC-325', async function () {
      const body = {
        username: boUser.admin.username,
        password: boUser.admin.password,
        flag: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('accessToken');
    });

    it('Login user with unverified OTP should have otpVerificationStatus false #TC-326', async function () {
      const regRes = await request.frontofficeRegister();
      const newUsername = regRes.body.data.userName;
      const body = {
        username: newUsername,
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('otpVerificationStatus', false);
    });

    it('Login borrower who had filled product preference should have userPreferenceStatus true #TC-327', async function () {
      const regRes = await request.frontofficeRegister();
      const accessToken = regRes.body.data.accessToken;
      const customerId = regRes.body.data.customerId;
      const newUsername = regRes.body.data.userName;
      const loginBody = {
        username: newUsername,
        password: help.getDefaultPassword(),
        flag: 1
      };
      const verifyOtpRes = await chai
        .request(request.getSvcUrl())
        .post(verifyOtpUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({
          otp: 123456
        });
      report.setInfo(this, `Verify OTP for ${loginBody.username}`, 'Step 1');
      report.setPayload(this, verifyOtpRes);

      const productPrefBody = {
        userCategory: 1,
        productPreference: 3,
        productSelection: 1
      };

      const productPrefRes = await chai
        .request(request.getSvcUrl())
        .post(`${productPrefUrl}/borrower/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(productPrefBody);
      report.setInfo(this, `Set Product Preference for ${customerId}`, 'Step 2');
      report.setPayload(this, productPrefRes);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(loginBody);
      const responseTime = await help.responseTime(startTime);

      report.setInfo(this, `Login as ${loginBody.username}`, 'Step 3');
      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('userPreferenceStatus', true);
    });

    it('Login as individual borrower with is_reset_password N (using SHA1) should succeed #TC-328', async function () {
      const legacyDb = require('knex')(legacyDbConf);
      const newcoreDb = require('knex')(newcoreDbConf);

      const registerRes = await request.borrowerRegister();
      const emailAddress = registerRes.emailAddress;

      return legacyDb('borrower_primary_data')
        .where('bpd_email_address', emailAddress)
        .update({
          bpd_is_reset_password: 'N',
          bpd_upasswd: sha1(help.getDefaultPassword())
        })
        .then(() => {
          return legacyDb('registration_data')
            .where('rd_email_address', emailAddress)
            .update({
              rd_is_reset_password: 'N',
              rd_upasswd: sha1(help.getDefaultPassword())
            });
        })
        .then(() => {
          return newcoreDb('login_data')
            .where('ld_email_address', emailAddress)
            .update({
              ld_is_reset_password: 'N',
              ld_password: sha1(help.getDefaultPassword())
            });
        })
        .then(async () => {
          const startTime = help.startTime();
          const loginRes = await chai
            .request(request.getSvcUrl())
            .post(urlLogin)
            .set(request.createNewCoreHeaders())
            .send({
              username: emailAddress,
              password: help.getDefaultPassword(),
              flag: 1
            });
          const responseTime = help.responseTime(startTime);

          report.setPayload(this, loginRes, responseTime);
          expect(loginRes.body.meta).to.have.property('code', 200);
        });
    });
  });

  describe('#negative', function () {
    it(`Deactivate user after maximum ${maxLoginAttempts} login attempts should failed and get error message #TC-329`, async function () {
      const regRes = await request.frontofficeRegister();
      const accessToken = regRes.body.data.accessToken;
      const newUsername = regRes.body.data.userName;
      await chai
        .request(request.getSvcUrl())
        .post(verifyOtpUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({
          otp: 123456
        });

      const body = {
        username: newUsername,
        password: 'Asdasda123',
        flag: 1
      };

      for (let attempt = 1; attempt < maxLoginAttempts; attempt++) {
        const startTime = await help.startTime();
        const attemptRes = await chai
          .request(request.getSvcUrl())
          .post(urlLogin)
          .set(request.createNewCoreHeaders())
          .send(body);
        const responseTime = await help.responseTime(startTime);

        report.setPayload(this, attemptRes, responseTime);
        report.setInfo(this, `Attempt: ${attempt}`);
        expect(attemptRes.body.meta).to.have.property('code', 400);
      }

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login using inactive user should fail #TC-330', async function () {
      const regBody = {
        email: help.randomEmail()
      };
      const regRes = await request.frontofficeRegister(regBody);
      const newUsername = regRes.body.data.userName;
      const customerId = regRes.body.data.customerId;
      let loginId;
      const boLoginRes = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send({
          username: boUser.admin.username,
          password: boUser.admin.password,
          flag: 2
        });
      const boAccessToken = boLoginRes.body.data.accessToken;

      const newcoreDb = require('knex')(newcoreDbConf);
      return newcoreDb
        .select('ld_id')
        .from('login_data')
        .whereIn('ld_id', function () {
          this.select('ci_created_by').from('customer_information').where({
            ci_id: customerId
          });
        })
        .first()
        .then((row) => {
          loginId = row.ld_id;
        })
        .then(async () => {
          const changeStatusUrl = '/validate/users/auth/change-user-status/{}/0';
          await chai
            .request(request.getSvcUrl())
            .post(changeStatusUrl.replace('{}', loginId))
            .set(
              request.createNewCoreHeaders({
                'X-Investree-Token': boAccessToken
              })
            )
            .send({
              id: loginId,
              status: 0
            });

          const startTime = help.startTime();
          const res = await chai
            .request(request.getSvcUrl())
            .post(urlLogin)
            .set(request.createNewCoreHeaders())
            .send({
              username: newUsername,
              password: help.getDefaultPassword(),
              flag: 1
            });

          const responseTime = help.responseTime(startTime);
          report.setPayload(this, res, responseTime);
          expect(res.body.meta).to.have.property('code', 400);
        })
        .finally(() => {
          newcoreDb.destroy();
        });
    });

    it('Login to backoffice using frontoffice user should fail #TC-331', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword(),
        flag: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Login to frontoffice using backoffice user should fail #TC-332', async function () {
      const body = {
        username: boUser.admin.username,
        password: boUser.admin.password,
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Login without username should fail #TC-333', async function () {
      const body = {
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with username null should fail #TC-334', async function () {
      const body = {
        username: null,
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with username empty string should fail #TC-335', async function () {
      const body = {
        username: '',
        password: help.getDefaultPassword(),
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login without password should fail #TC-336', async function () {
      const body = {
        username: username,
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with password empty string should fail #TC-337', async function () {
      const body = {
        username: username,
        password: '',
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with password null should fail #TC-338', async function () {
      const body = {
        username: username,
        password: null,
        flag: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login without flag should fail #TC-339', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword()
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with flag empty string should fail #TC-340', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword(),
        flag: ''
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Login with flag null should fail #TC-341', async function () {
      const body = {
        username: username,
        password: help.getDefaultPassword(),
        flag: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});

function sha1 (str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}
