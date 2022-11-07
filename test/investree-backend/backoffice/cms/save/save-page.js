const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const newCoreDBConfig = require('@root/knexfile.js')[req.getEnv()];
const newCoreDB = require('knex')(newCoreDBConfig);

const beBaseUrl = req.getBackendUrl();
const editPageUrl = '/backoffice/cms/save/';
const detailPageUrl = '/backoffice/cms/page/detail/';
const INSERT_CONTENT_SLUG = help.randomAlphaNumeric();
let updateContentSlug;
let boAccessToken;
let samplePageSlug;
describe('Save Content of CMS Landing Page', function () {
  before(async function () {
    const boLoginRes = await req.backofficeLogin();
    boAccessToken = boLoginRes.data.accessToken;
    const getSampleData = await newCoreDB('mr_page_list').select('*').first().where({
      mpl_slug: 'home-page'
    });
    samplePageSlug = getSampleData.mpl_slug + '-test';
    updateContentSlug = JSON.parse(getSampleData.mpl_value)[0].slug;
    await newCoreDB('mr_page_list').insert({
      mpl_name: getSampleData.mpl_name,
      mpl_slug: samplePageSlug,
      mpl_category: getSampleData.mpl_category,
      mpl_url: getSampleData.mpl_url,
      mpl_value: getSampleData.mpl_value,
      mpl_value_en: getSampleData.mpl_value_en,
      mpl_created_at: getSampleData.mpl_created_at,
      mpl_created_by: getSampleData.mpl_created_by,
      mpl_updated_at: getSampleData.mpl_updated_at,
      mpl_updated_by: getSampleData.mpl_updated_by,
      mpl_deleted_at: getSampleData.mpl_deleted_at,
      mpl_deleted_by: getSampleData.mpl_deleted_by
    });
  });

  after(async function () {
    await newCoreDB('mr_page_list')
      .where({
        mpl_slug: samplePageSlug
      })
      .del();
  });
  describe('#smoke', function () {
    it('Insert ID content should success #TC-1594', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: INSERT_CONTENT_SLUG,
        value: JSON.stringify({ background: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      const getDetailPage = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + samplePageSlug + '/id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const getInsertedValue = getDetailPage.body.data.filter(function (el) {
        return el.slug === INSERT_CONTENT_SLUG;
      });
      expect(getInsertedValue[0].value).to.equals(body.value);
    });

    it('Insert EN content should success #TC-1595', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: INSERT_CONTENT_SLUG,
        value: JSON.stringify({ test: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      const getDetailPage = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + samplePageSlug + '/en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const getInsertedValue = getDetailPage.body.data.filter(function (el) {
        return el.slug === INSERT_CONTENT_SLUG;
      });
      expect(getInsertedValue[0].value).to.equals(body.value);
    });
    it('Update ID content should success #TC-1596', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: updateContentSlug,
        value: JSON.stringify({ test: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      const getDetailPage = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + samplePageSlug + '/id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const getInsertedValue = getDetailPage.body.data.filter(function (el) {
        return el.slug === updateContentSlug;
      });
      expect(getInsertedValue[0].value).to.equals(body.value);
    });
    it('Update EN content should success #TC-1597', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: updateContentSlug,
        value: JSON.stringify({ test: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      const getDetailPage = await chai
        .request(beBaseUrl)
        .get(detailPageUrl + samplePageSlug + '/en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send();
      const getInsertedValue = getDetailPage.body.data.filter(function (el) {
        return el.slug === updateContentSlug;
      });
      expect(getInsertedValue[0].value).to.equals(body.value);
    });
  });

  describe('#negative', function () {
    it('Without accessToken should fail #TC-1598', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: updateContentSlug,
        value: JSON.stringify({ test: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(401);
    });

    it('With undefined pageSlug should fail #TC-1599', async function () {
      const body = {
        pageSlug: help.randomAlphaNumeric(),
        contentSlug: updateContentSlug,
        value: JSON.stringify({ test: help.randomAlphaNumeric() })
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(404);
    });

    it('Update ID content with unformated JSON value should fail #TC-1701', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: updateContentSlug,
        value: help.randomAlphaNumeric()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(400);
    });

    it('Update EN content with unformated JSON value should fail #TC-1702', async function () {
      const body = {
        pageSlug: samplePageSlug,
        contentSlug: updateContentSlug,
        value: help.randomAlphaNumeric()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(400);
    });

    it('Update Banner ID using pdf value should fail #TC-1703', async function () {
      const body = {
        pageSlug: 'home-page',
        contentSlug: 'banner',
        value: JSON.stringify([
          {
            background: help.randomAlphaNumeric() + '.pdf',
            backgroundMobile: help.randomAlphaNumeric() + '.pdf'
          }
        ])
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'id')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(400);
    });

    it('Update Banner EN using pdf value should fail #TC-1704', async function () {
      const body = {
        pageSlug: 'home-page',
        contentSlug: 'banner',
        value: JSON.stringify([
          {
            background: help.randomAlphaNumeric() + '.pdf',
            backgroundMobile: help.randomAlphaNumeric() + '.pdf'
          }
        ])
      };

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .post(editPageUrl + 'en')
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-640');
      report.setSeverity(this, 'critical');

      expect(res).to.have.status(400);
    });
  });
});
