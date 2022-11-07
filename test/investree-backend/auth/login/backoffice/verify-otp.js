const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Verify OTP Backoffice', () => {
  const beBaseUrl = req.getBackendUrl();

  const loginUrl = '/auth/login/backoffice';
  const verifyOtpUrl = '/auth/login/backoffice/verify';

  describe('#smoke', () => {
    it('Verify OTP with valid loginToken should return accessToken #TC-1562', async function () {
      const loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: boUser.admin.username,
          password: help.getDefaultPassword()
        });
      const loginToken = loginRes.body.data.loginToken;

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(verifyOtpUrl)
        .set(req.createNewCoreHeaders())
        .send({
          loginToken: loginToken,
          otp: '123456'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res.body.data.accessToken).to.be.not.null;
    });

    it('Get BO user list using accessToken should success #TC-1563', async function () {
      const loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: boUser.admin.username,
          password: help.getDefaultPassword()
        });
      const loginToken = loginRes.body.data.loginToken;

      const verifyOtpRes = await chai
        .request(beBaseUrl)
        .post(verifyOtpUrl)
        .set(req.createNewCoreHeaders())
        .send({
          loginToken: loginToken,
          otp: '123456'
        });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get('/backoffice/user?page=1&size=10')
        .set(
          req.createNewCoreHeaders({
            'x-investree-token': verifyOtpRes.body.data.accessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', () => {
    it('Verifiy OTP with invalid code should fail #TC-1564', async function () {
      const loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: boUser.admin.username,
          password: help.getDefaultPassword()
        });
      const loginToken = loginRes.body.data.loginToken;

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(verifyOtpUrl)
        .set(req.createNewCoreHeaders())
        .send({
          loginToken: loginToken,
          otp: '123455'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Invalid otp.');
    });

    it('Verify OTP with used loginToken should fail #TC-1565', async function () {
      const loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: boUser.admin.username,
          password: help.getDefaultPassword()
        });
      const loginToken = loginRes.body.data.loginToken;
      await chai.request(beBaseUrl).post(verifyOtpUrl).set(req.createNewCoreHeaders()).send({
        loginToken: loginToken,
        otp: '123456'
      });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(verifyOtpUrl)
        .set(req.createNewCoreHeaders())
        .send({
          loginToken: loginToken,
          otp: '123456'
        });
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.code).to.equals(400);
    });
  });
});
