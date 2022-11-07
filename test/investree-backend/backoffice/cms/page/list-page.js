const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const beBaseUrl = req.getBackendUrl();
const landingPageUrl = '/backoffice/cms/page';
const DEFAULT_LIMIT = 5;
const DEFAULT_CURRENT_PAGE = 1;
let boAccessToken;

describe('GET List of Landing Page', function () {
  before(async function () {
    const boLoginRes = await req.backofficeLogin();
    boAccessToken = boLoginRes.data.accessToken;
  });
  describe('#smoke', function () {
    it('with page and limit should return requested current page  #TC-1600', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          page: 1,
          limit: 1
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.currentPage).to.equals(1);
    });

    it('With page and limit should return requested total pagingData  #TC-1601', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          page: 1,
          limit: 1
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.pagingData.length <= 1).to.equals(true);
    });
  });

  describe('#negative', function () {
    it('Without accessToken should fail #TC-1602', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(req.createNewCoreHeaders())
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(401);
    });
    it('With invalid page format should return default currentPage  #TC-1603', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          page: help.randomAlphaNumeric()
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.currentPage).to.equals(DEFAULT_CURRENT_PAGE);
    });

    it('With invalid page format should return default total pagingData  #TC-1604', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          page: help.randomAlphaNumeric()
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.pagingData.length <= DEFAULT_LIMIT).to.equals(true);
    });

    it('With invalid limit format should return default currentPage  #TC-1605', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          limit: help.randomAlphaNumeric()
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.currentPage).to.equals(DEFAULT_CURRENT_PAGE);
    });

    it('With invalid limit format should return default total pagingData  #TC-1606', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .query({
          limit: help.randomAlphaNumeric()
        })
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.pagingData.length <= DEFAULT_LIMIT).to.equals(true);
    });

    it('Without page and limit should return default currentPage  #TC-1607', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.currentPage).to.equals(DEFAULT_CURRENT_PAGE);
    });

    it('Without page and limit should return default total pagingData  #TC-1608', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(landingPageUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-643');
      report.setSeverity(this, 'critical');

      expect(res.body.data.pagingData.length <= DEFAULT_LIMIT).to.equals(true);
    });
  });
});
