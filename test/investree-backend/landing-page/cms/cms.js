const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const landingPageUrl = '/landing-page/cms/';

describe('GET Landing Page Content', function () {
  describe('Home Page', function () {
    describe('#smoke', function () {
      it('Get ID content should success #TC-1591', async function () {
        this.slow(3000);

        const startTime = help.startTime();
        const res = await chai
          .request(beBaseUrl)
          .get(landingPageUrl + 'home-page')
          .set(req.createNewCoreHeaders())
          .set('Accept-Language', 'id_ID')
          .send();
        const responseTime = help.responseTime(startTime);

        report.setPayload(this, res, responseTime);
        report.setIssue(this, 'NH-635');
        report.setSeverity(this, 'critical');

        expect(res).to.have.status(200);
      });

      it('Get EN content should success #TC-1592', async function () {
        this.slow(3000);

        const startTime = help.startTime();
        const res = await chai
          .request(beBaseUrl)
          .get(landingPageUrl + 'home-page')
          .set(req.createNewCoreHeaders())
          .set('Accept-Language', 'en_US')
          .send();
        const responseTime = help.responseTime(startTime);

        report.setPayload(this, res, responseTime);
        report.setIssue(this, 'NH-635');
        report.setSeverity(this, 'critical');

        expect(res).to.have.status(200);
      });
    });
  });

  describe('#negative', function () {
    it('With undefined slug should fail #TC-1593', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl + help.randomAlphaNumeric())
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-635');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(404);
    });
  });
});
