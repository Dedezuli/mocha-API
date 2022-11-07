const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const detailPageUrl = '/backoffice/cms/page/detail/';
const PAGE_SLUG = 'home-page';
let boAccessToken;

describe('Detail of CMS Landing Page', function () {
  before(async function () {
    const boLoginRes = await req.backofficeLogin();
    boAccessToken = boLoginRes.data.accessToken;
  });
  describe('#smoke', function () {
    it('Get ID content should success  #TC-1609', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + PAGE_SLUG + '/id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-661');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(200);
    });

    it('Get EN content should success  #TC-1610', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + PAGE_SLUG + '/en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-661');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Without accessToken should fail #TC-1611', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + PAGE_SLUG + '/en')
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-661');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(401);
    });
    it('With unformated lang should return ID content  #TC-1612', async function () {
      const getDetailRes = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + PAGE_SLUG + '/id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + PAGE_SLUG + `/${help.randomAlphaNumeric()}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-661');
      report.setSeverity(this, 'critical');

      expect(JSON.stringify(res.body.data)).to.equals(JSON.stringify(getDetailRes.body.data));
    });
    it('With unformated slug should fail  #TC-1613', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + help.randomAlphaNumeric() + '/id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-661');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(404);
    });
  });
});
