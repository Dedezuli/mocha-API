const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const boUsers = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = require('chai').expect;

const PROD_PREF_CONVENTIONAL = 1;
const PROD_PREF_SHARIA = 2;
const PROD_PREF_MIX = 3;
const PROD_SELECT_OSF = 1;
const PROD_SELECT_PROJECT_FINANCING = 2;
const PROD_SELECT_WCTL = 3;
const USER_CAT_INDIVIDUAL = 1;
const USER_CAT_INSTITUTIONAL = 2;

const svcBaseUrl = request.getSvcUrl();
describe('Get Borrower Product Preference', function () {
  const url = '/validate/customer/customer-information/product-preference/borrower';

  let boAccessToken;
  let accessToken;
  let customerId;

  before(async function () {
    report.setInfo(this, 'Login as backoffice admin');
    const boLoginRes = await request.backofficeLogin(
      boUsers.admin.username,
      boUsers.admin.password
    );

    boAccessToken = boLoginRes.data.accessToken;
    report.setInfo(this, `Logged in. Access token: ${boAccessToken}`);
  });

  beforeEach(async function () {
    report.setInfo(this, 'Attempting to register as frontoffice user');
    const registerRes = await request.frontofficeRegister();
    report.setPayload(this, registerRes);

    customerId = registerRes.body.data.customerId;
    accessToken = registerRes.body.data.accessToken;
    report.setInfo(this, `Registered with customerId ${customerId}`);
    await chai
      .request(svcBaseUrl)
      .post('/validate/notification/otp/verify')
      .set(
        request.createNewCoreHeaders({
          'X-Investree-token': accessToken
        })
      )
      .send({ otp: '123456' });
  });

  describe('#smoke', function () {
    it('Get product preference individual conventional should succeed #TC-208', async function () {
      const addBody = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        productSelection: PROD_SELECT_OSF
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference individual sharia should succeed #TC-209', async function () {
      const addBody = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_SHARIA,
        productSelection: PROD_SELECT_OSF
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference individual mix should succeed #TC-210', async function () {
      const addBody = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_MIX,
        productSelection: PROD_SELECT_OSF
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional conventional project financing should succeed #TC-211', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional sharia project financing should succeed #TC-212', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 2,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional mix project financing should succeed #TC-213', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional conventional WCTL should succeed #TC-214', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional sharia WCTL should succeed #TC-215', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 2,
        productSelection: PROD_SELECT_WCTL
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });

    it('Get product preference institutional mix WCTL should succeed #TC-216', async function () {
      const addBody = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(addBody);

      const getStartTime = help.startTime();
      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const getResponseTime = help.responseTime(getStartTime);

      report.setPayload(this, getRes, getResponseTime);

      assertProductPreference(addBody, getRes);
    });
  });
});

function assertProductPreference (body, response) {
  expect(
    response.body.data.userCategory.id,
    'Response user category doesn\'t equal to request body user category'
  ).to.eql(body.userCategory);
  if (body.userCategory === USER_CAT_INSTITUTIONAL) {
    expect(
      response.body.data.companyName,
      'Response company name doesn\'t equal to request body company name'
    ).to.eql(body.companyName);
    expect(
      response.body.data.legalEntity.id,
      'Response legal entity doesn\'t equal to request body legal entity'
    ).to.eql(body.legalEntity);
  }
  expect(
    response.body.data.productPreference.id,
    'Response product preference doesn\'t equal to body product preference'
  ).to.eql(body.productPreference);
  expect(
    response.body.data.productSelection.id,
    'Response product selection doesn\'t equal to body product selection'
  ).to.eql(body.productSelection);
}
