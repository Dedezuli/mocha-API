const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Login Backoffice', () => {
  const beBaseUrl = req.getBackendUrl();
  const loginUrl = '/auth/login/backoffice';

  describe('#smoke', () => {
    it('Login BO user should return loginToken #TC-1559', async function () {
      let body = {
        username: boUser.admin.username,
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
      report.setSeverity(this, 'blocker');

      expect(res.body.data.loginToken).to.be.not.null;
    });
  });

  describe('#negative', () => {
    it('Login BO with wrong password should fail #TC-1560', async function () {
      let body = {
        username: boUser.admin.username,
        password: help.getDefaultPassword() + 'WRONG'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res.body.meta.message).to.equals('Invalid Username or Password');
    });

    it('Get BO user list using loginToken should fail #TC-1561', async function () {
      let body = {
        username: boUser.admin.username,
        password: help.getDefaultPassword()
      };
      const loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send(body);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get('/backoffice/user?page=1&size=10')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': loginRes.body.data.loginToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(401);
    });
  });
});
