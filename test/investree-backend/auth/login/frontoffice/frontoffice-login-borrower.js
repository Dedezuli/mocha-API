'use strict';
const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
const qs = require('qs');
const crypto = require('crypto');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const loginUrl = '/auth/login/frontoffice';
const boLegacyBaseUrl = req.getBOLegacyUrl();
const boUser = require('@fixtures/backoffice_user');
let emailBorrower;
const captcha = 'qa-bypass-captcha';
const usedCaptcha =
  '03AGdBq24B5460SgRaRJePSEbNjzfIkjbMYflLVq3kAUvXuIrH0SIpRxCimGisNFZoKdZ2FO_S_VWrUvb--SD5rQ8PFTSQoYDTmwgHATfzRVgkAEIAYt-iY_1MXE7jp-HBQibXUcv8Whs2eOYjeqNoxuc5zD9PjvGjVuRaCzvmP3oxNjoiej9vczYH8UMrvFWXl184b51D-Il6f6ZiIu-Lv3ymkcWmPLrfKdSOnj6y3xAOBrn7c9u65wl1mfAL1aYmEWKx-p5zcg6Mams8Y5htFWbCxIUh2t6t8IZDguf1q2XmWjEFfwDnbglpIznopC-sQAFCUY9wHahrJw6ohdYFeS9rHWJdESzTlXCgmEpDaAqkxgC0lV4ZChqLi1FadtxapxIQ2nl6qeoDQ5emEMJYEkTGP90H_ahBcqNVWzLwdSfzxmnyaakYa5U';

describe('Frontoffice Login as Borrower', function () {
  before(async function () {
    const borrowerRegister = await req.borrowerRegister();
    emailBorrower = borrowerRegister.emailAddress;
  });

  describe('#smoke', function () {
    it('Borrower login should succeed #TC-1350', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('Successful login should return relevant message (ID) #TC-1494', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Login Berhasil');
    });

    it('Successful login should return relevant message (EN) #TC-1495', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Authentication successful');
    });

    it('Borrower login should have accessToken #TC-1351', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.accessToken).to.not.be.null;
    });

    it('Borrower login should have legacyAuthUser #TC-1352', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.legacyAuthUser).to.not.be.null;
    });

    it('Borrower login should have sessionId #TC-1461', async function () {
      const body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-626');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.sessionId).to.not.be.null;
    });

    it('Borrower login using valid credential after 9 fails should succeed #TC-1353', async function () {
      let body = {
        email: emailBorrower,
        password: 'salahDong17',
        captcha: captcha
      };
      for (let index = 0; index < 9; index++) {
        await chai.request(beBaseUrl).post(loginUrl).set(req.createNewCoreHeaders()).send(body);
      }

      body = {
        email: emailBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('Borrower login using valid credential after unblock account and reset password should succeed #TC-1354', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;

      const loginBorrower = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          email: emailAddressBorrower,
          password: help.getDefaultPassword(),
          captcha: captcha
        });
      const registrationId = loginBorrower.body.data.registrationId;
      const userId = loginBorrower.body.data.userId;

      // blocking account
      let body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };
      for (let index = 1; index <= 10; index++) {
        await chai.request(beBaseUrl).post(loginUrl).set(req.createNewCoreHeaders()).send(body);
      }

      const agent = chai.request.agent(boLegacyBaseUrl);
      const getLegacyRefreshToken = await agent.get('/refresh-token').send();
      const refreshToken = getLegacyRefreshToken.text.replace('\n', '');

      const boLoginPayload = qs.stringify({
        username: 'erna',
        password: help.getDefaultPassword().toLowerCase(),
        _token: refreshToken
      });
      await agent.post('/dologin').type('form').send(boLoginPayload);

      const unblockPayload = qs.stringify({
        id: registrationId,
        crud: 'reset-pass-to-unblock-user',
        _token: refreshToken
      });
      await agent.post('/registration-list').type('form').send(unblockPayload);

      const boNewCoreToken = await loginBOUser(boUser.admin.username, boUser.admin.password);
      await chai
        .request(req.getSvcUrl())
        .post('/validate/users/auth/change-user-status/' + userId + '/1')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boNewCoreToken
          })
        )
        .send({
          id: userId,
          status: 1
        });

      const legacyDBConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];
      const legacyDb = require('knex')(legacyDBConfig);
      const unblockData = await legacyDb('unblock_user_data')
        .select('uud_id', 'uud_user_id')
        .first()
        .where({
          uud_status: 'D',
          uud_user_id: registrationId
        });
      const sha1Result = crypto.createHash('sha1').update(String(unblockData.uud_id)).digest('hex');

      const secretKey = vars.legacy_app_key;
      const hmacSha1Result = crypto
        .createHmac('sha1', secretKey)
        .update(String(unblockData.uud_user_id))
        .digest('hex');

      const newPassword = 'Asdf1234';
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
        email: emailAddressBorrower,
        password: newPassword,
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Login as backoffice user should fail #TC-1355', async function () {
      const body = {
        email: boUser.admin.email,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using invalid password format should fail #TC-1356', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'abcd1234',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using invalid password format should return relevant error message (ID) #TC-1462', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'abcd1234',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('username dan password tidak tepat');
    });

    it('Login using invalid password format should return relevant error message (EN) #TC-1463', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'abcd1234',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Incorrect username or password');
    });

    it('Login using invalid email format should fail #TC-1464', async function () {
      const body = {
        email: help.randomAlphaNumeric(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using invalid email format should return relevant error message (ID) #TC-1357', async function () {
      const body = {
        email: help.randomAlphaNumeric(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Alamat email tidak valid');
    });

    it('Login using invalid email format should return relevant error message (EN) #TC-1465', async function () {
      const body = {
        email: help.randomAlphaNumeric(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Invalid email address');
    });

    it('Login without email should fail #TC-1358', async function () {
      const body = {
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login without password should fail #TC-1359', async function () {
      const body = {
        email: help.randomEmail(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using non existing email should fail #TC-1360', async function () {
      const body = {
        email: help.randomEmail(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using non existing email should return relevant error message (EN) #TC-1466', async function () {
      const body = {
        email: help.randomEmail(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Incorrect username or password');
    });

    it('Login using non existing email should return relevant error message (ID) #TC-1361', async function () {
      const body = {
        email: help.randomEmail(),
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'id_ID')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('username dan password tidak tepat');
    });

    it('Borrower login using invalid password should fail #TC-1467', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'id_ID')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Borrower login using invalid password should return relevant error message (ID) #TC-1362', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'id_ID')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('username dan password tidak tepat');
    });

    it('Borrower login using invalid password should return relevant error message (EN) #TC-1363', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      const body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('Accept-Language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Incorrect username or password');
    });

    it('Borrower login using invalid password 10 times should fail #TC-1468', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      let body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };
      for (let index = 0; index <= 9; index++) {
        await chai.request(beBaseUrl).post(loginUrl).set(req.createNewCoreHeaders()).send(body);
      }

      body = {
        email: emailAddressBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Borrower login using invalid password 10 times should return relevant error message (ID) #TC-1364', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      let body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };
      for (let index = 0; index <= 9; index++) {
        await chai.request(beBaseUrl).post(loginUrl).set(req.createNewCoreHeaders()).send(body);
      }

      body = {
        email: emailAddressBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals(
        'Mohon maaf akun Anda terblokir. Silakan hubungi Customer Support kami di 1500886 untuk membuka blokir akun Anda.'
      );
    });

    it('Borrower login using invalid password 10 times should relevant error message (EN) #TC-1365', async function () {
      const registerBorrower = await req.borrowerRegister();
      const emailAddressBorrower = registerBorrower.emailAddress;
      let body = {
        email: emailAddressBorrower,
        password: 'salahDong17',
        captcha: captcha
      };
      for (let index = 1; index <= 10; index++) {
        await chai.request(beBaseUrl).post(loginUrl).set(req.createNewCoreHeaders()).send(body);
      }

      body = {
        email: emailAddressBorrower,
        password: help.getDefaultPassword(),
        captcha: captcha
      };
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals(
        'Sorry your account is blocked. Please call our Customer Service at 1500886 to unblock your account'
      );
    });

    it('Login without captcha should fail #TC-1469', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login without captcha should return relevant error message (ID) #TC-1470', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('captcha tidak dapat kosong');
    });

    it('Login without captcha should return relevant error message (EN) #TC-1471', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-626');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('captcha must not be empty');
    });

    it('Login using invalid format captcha should fail #TC-1472', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: 'captcha'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using invalid format captcha should return relevant error message (ID) #TC-1473', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: 'captcha'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Login Gagal');
    });

    it('Login using invalid format captcha should return relevant error message (EN) #TC-1474', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: 'captcha'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Authentication failed');
    });

    it('Login using used captcha value should fail #TC-1475', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: usedCaptcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-626');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Login using used captcha value should return relevant error message (ID) #TC-1476', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: usedCaptcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Login Gagal');
    });

    it('Login using used captcha value should return relevant error message (EN) #TC-1477', async function () {
      const body = {
        email: 'email@mail.id',
        password: help.getDefaultPassword(),
        captcha: usedCaptcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-496');
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Authentication failed');
    });
  });
});

async function loginBOUser (username, password) {
  const bodyLogin = {
    username: username,
    password: password,
    flag: 2
  };
  const login = await chai
    .request(req.getSvcUrl())
    .post('/validate/users/auth/login')
    .set(req.createNewCoreHeaders())
    .send(bodyLogin);
  const bodyVerifyOTP = {
    otp: 123456
  };
  await chai
    .request(req.getSvcUrl())
    .post('/validate/notification/otp/verify')
    .set(
      req.createNewCoreHeaders({
        'X-Investree-Token': login.body.data.accessToken
      })
    )
    .send(bodyVerifyOTP);
  return login.body.data.accessToken;
}
