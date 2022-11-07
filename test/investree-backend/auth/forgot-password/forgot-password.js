const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const forgotPasswordUrl = '/auth/forgot-password';
const captcha = 'qa-bypass-captcha';
const usedCaptcha =
  '03AGdBq24B5460SgRaRJePSEbNjzfIkjbMYflLVq3kAUvXuIrH0SIpRxCimGisNFZoKdZ2FO_S_VWrUvb--SD5rQ8PFTSQoYDTmwgHATfzRVgkAEIAYt-iY_1MXE7jp-HBQibXUcv8Whs2eOYjeqNoxuc5zD9PjvGjVuRaCzvmP3oxNjoiej9vczYH8UMrvFWXl184b51D-Il6f6ZiIu-Lv3ymkcWmPLrfKdSOnj6y3xAOBrn7c9u65wl1mfAL1aYmEWKx-p5zcg6Mams8Y5htFWbCxIUh2t6t8IZDguf1q2XmWjEFfwDnbglpIznopC-sQAFCUY9wHahrJw6ohdYFeS9rHWJdESzTlXCgmEpDaAqkxgC0lV4ZChqLi1FadtxapxIQ2nl6qeoDQ5emEMJYEkTGP90H_ahBcqNVWzLwdSfzxmnyaakYa5U';

describe('Forgot Password', function () {
  describe('#smoke', function () {
    it('Borrower forgot password should succeed #TC-1569', async function () {
      this.slow(9000);

      const brwUser = await req.borrowerRegister();
      const body = {
        email: brwUser.emailAddress,
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('Borrower forgot password 30 seconds after last request should succeed #TC-1570', async function () {
      this.slow(42000);

      const brwUser = await req.borrowerRegister();
      const body = {
        email: brwUser.emailAddress,
        captcha: captcha
      };

      await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);

      await help.sleep(32000);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Borrower forgot password without email address should fail #TC-1571', async function () {
      const body = {
        email: '',
        captcha: captcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(400);
    });

    it('Borrower forgot password with used captcha token should fail #TC-1572', async function () {
      const brwUser = await req.borrowerRegister();
      const body = {
        email: brwUser.emailAddress,
        captcha: usedCaptcha
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(400);
    });

    it('Borrower forgot password without captcha token should return relevant error message (ID) #TC-1573', async function () {
      const brwUser = await req.borrowerRegister();
      const body = {
        email: brwUser.emailAddress
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'critical');

      expect(res.body.meta.message).to.equals('captcha tidak dapat kosong');
    });

    it('Borrower forgot password without captcha token should return relevant error message (EN) #TC-1574', async function () {
      const brwUser = await req.borrowerRegister();
      const body = {
        email: brwUser.emailAddress
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(forgotPasswordUrl)
        .set(req.createNewCoreHeaders())
        .set('accept-language', 'en_US')
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-540');
      report.setSeverity(this, 'critical');

      expect(res.body.meta.message).to.equals('captcha must not be empty');
    });
  });
});
