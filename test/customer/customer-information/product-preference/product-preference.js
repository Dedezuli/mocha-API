/*
 *  Table involved
 *  Parameter:
 *  - customer_information (ci_id)
 *
 *  Result:
 *  - customer_information
 *  - customer_role
 *    userType  1 = borrower, 2 = investor
 *    userCategory 1 = individual 2 = instiutional
 */

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
const PROD_PREF_LEGACY_MIX = '1,2';
const PROD_SELECT_OSF = 1;
const PROD_SELECT_PROJECT_FINANCING = 2;
const PROD_SELECT_WCTL = 3;
const USER_CAT_INDIVIDUAL = 1;
const USER_CAT_INSTITUTIONAL = 2;

const svcBaseUrl = request.getSvcUrl();
const apiSyncBaseUrl = request.getApiSyncUrl();
const headerNewcore = request.createNewCoreHeaders();

describe('Product Preference Add', function () {
  const url = '/validate/customer/customer-information/product-preference/borrower';
  const urlLogin = '/validate/users/auth/login';

  let boAccessToken;
  let accessToken;
  let customerId;
  let emailAddress;

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
    const body = {
      email: help.randomEmail()
    };
    emailAddress = body.email;

    report.setInfo(this, 'Attempting to register as frontoffice user');
    const registerRes = await request.frontofficeRegister(body);
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
    it('Add product preference individual conventional should succeed #TC-217', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference individual sharia should succeed #TC-218', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_SHARIA,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference individual mix should succeed #TC-219', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_MIX,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional wctl conventional should succeed #TC-220', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional wctl sharia should succeed #TC-221', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 2,
        productSelection: PROD_SELECT_WCTL
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional wctl mix should succeed #TC-222', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional project financing conventional should succeed #TC-223', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional project financing sharia should succeed #TC-224', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 2,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference institutional project financing mix should succeed #TC-225', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add product preference individual OSF mix should sync between new core and legacy #TC-226', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_MIX,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreference(body, getRes);

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      const epdData = await chai
        .request(apiSyncBaseUrl)
        .get('/epd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][epd_migration_id]': customerId
        });
      expect(bpdData.body[0].bpd_loan_type).to.eql(PROD_PREF_LEGACY_MIX);
      expect(bpdData.body[0].bpd_company_type).to.eql(4);
      expect(epdData.body[0].epd_migration_id, 'epd_migration_id not found').to.eql(customerId);
    });

    it('Add product preference institutional project financing sharia should sync between new core and legacy #TC-227', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreference(body, getRes);

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      const epdData = await chai
        .request(apiSyncBaseUrl)
        .get('/epd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][epd_migration_id]': customerId
        });

      expect(bpdData.body[0].bpd_loan_type).to.eql(PROD_PREF_SHARIA.toString());
      expect(bpdData.body[0].bpd_company_type).to.not.eql(4);
      expect(bpdData.body[0].bpd_company_name).to.eql(body.companyName);
      expect(epdData.body).to.be.an('array').that.is.empty;
    });

    it('Add product preference institutional WCTL conventional should sync between new core and legacy #TC-228', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreference(body, getRes);

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      const epdData = await chai
        .request(apiSyncBaseUrl)
        .get('/epd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][epd_migration_id]': customerId
        });

      expect(bpdData.body[0].bpd_loan_type).to.eql(PROD_PREF_CONVENTIONAL.toString());
      expect(bpdData.body[0].bpd_company_type).to.not.eql(4);
      expect(bpdData.body[0].bpd_company_name).to.eql(body.companyName);
      expect(epdData.body[0].epd_migration_id, 'epd_migration_id not found').to.eql(customerId);
    });
  });

  describe('#negative', function () {
    it('Should fail when add product preference using customerId of different user #TC-229', async function () {
      const otherRegisterRes = await request.frontofficeRegister();

      const otherCustomerId = otherRegisterRes.body.data.customerId;
      const otherAccessToken = otherRegisterRes.body.data.accessToken;

      await chai
        .request(svcBaseUrl)
        .post('/validate/notification/otp/verify')
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': otherAccessToken
          })
        )
        .send({ otp: '123456' });

      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${otherCustomerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Legal entity should not be filled for individual product preference #TC-230', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_SHARIA,
        legalEntity: 1,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Company name should not be filled for individual product preference #TC-231', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should fail when product prefrence without user category #TC-232', async function () {
      const body = {
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with user category empty string #TC-233', async function () {
      const body = {
        userCategory: '',
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with user category null #TC-234', async function () {
      const body = {
        userCategory: null,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference without product preference field #TC-235', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with product preference field empty string #TC-236', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: '',
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when user category 2 with product preference field null #TC-237', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: null,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when user category 1 with product preference field null #TC-238', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: null,
        companyName: null,
        legalEntity: null,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference without company name #TC-239', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with company name empty string #TC-240', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: '',
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with company name null #TC-241', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: null,
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference without legal entity #TC-242', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with legal entity empty string #TC-243', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: '',
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when product preference with legal entity null #TC-244', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_MIX,
        companyName: help.randomCompanyName(),
        legalEntity: null,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when apply individual with product selection is empty #TC-245', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        productSelection: ''
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when apply individual with product selection is null #TC-246', async function () {
      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        productSelection: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when apply institutional with product selection is empty #TC-247', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        legalEntity: '1',
        companyName: help.randomCompanyName(),
        productSelection: ''
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when apply institutional with product selection is null #TC-248', async function () {
      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        legalEntity: '1',
        companyName: help.randomCompanyName(),
        productSelection: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add product preference individual OSF mix should not save data if failed to sync if failed to sync with legacy #TC-249', async function () {
      const modifyEmailBody = {
        oldEmailAddress: emailAddress,
        newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
      };

      await modifyEmail(modifyEmailBody, boAccessToken);
      const loginRes = await chai.request(svcBaseUrl).post(urlLogin).set(headerNewcore).send({
        username: modifyEmailBody.newEmailAddress,
        password: help.getDefaultPassword(),
        flag: 1
      });
      const reloginAccessToken = loginRes.body.data.accessToken;

      const body = {
        userCategory: USER_CAT_INDIVIDUAL,
        productPreference: PROD_PREF_MIX,
        productSelection: PROD_SELECT_OSF
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': reloginAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreferenceToBeNull(getRes);
      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdData.body[0].bpd_loan_type).to.be.null;
      expect(bpdData.body[0].bpd_company_type).to.be.null;
    });

    it('Add product preference institutional project financing sharia should not save data if failed to sync with legacy #TC-250', async function () {
      const modifyEmailBody = {
        oldEmailAddress: emailAddress,
        newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
      };

      await modifyEmail(modifyEmailBody, boAccessToken);

      const loginRes = await chai.request(svcBaseUrl).post(urlLogin).set(headerNewcore).send({
        username: modifyEmailBody.newEmailAddress,
        password: help.getDefaultPassword(),
        flag: 1
      });
      const reloginAccessToken = loginRes.body.data.accessToken;

      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_SHARIA,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_PROJECT_FINANCING
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': reloginAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreferenceToBeNull(getRes);

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdData.body[0].bpd_loan_type).to.be.null;
      expect(bpdData.body[0].bpd_company_type).to.be.null;
      expect(bpdData.body[0].bpd_company_name).to.be.null;
    });

    it('Add product preference institutional WCTL conventional should sync between new core and legacy #TC-251', async function () {
      const modifyEmailBody = {
        oldEmailAddress: emailAddress,
        newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
      };

      await modifyEmail(modifyEmailBody, boAccessToken);

      const loginRes = await chai.request(svcBaseUrl).post(urlLogin).set(headerNewcore).send({
        username: modifyEmailBody.newEmailAddress,
        password: help.getDefaultPassword(),
        flag: 1
      });
      const reloginAccessToken = loginRes.body.data.accessToken;

      const body = {
        userCategory: USER_CAT_INSTITUTIONAL,
        productPreference: PROD_PREF_CONVENTIONAL,
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        productSelection: PROD_SELECT_WCTL
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': reloginAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);

      const getRes = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      assertProductPreferenceToBeNull(getRes);

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdData.body[0].bpd_loan_type).to.be.null;
      expect(bpdData.body[0].bpd_company_type).to.be.null;
      expect(bpdData.body[0].bpd_company_name).to.be.null;
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

function assertProductPreferenceToBeNull (response) {
  expect(response.body.data.userCategory, 'Response user category should be null').to.be.null;
  expect(response.body.data.companyName, 'Response company name should be null').to.be.null;
  expect(response.body.data.legalEntity, 'Response legal entity should be null').to.be.null;
  expect(response.body.data.productPreference, 'Response product preference should be null').to.be
    .null;
  expect(response.body.data.productSelection, 'Response product selection should be null').to.be
    .null;
}

async function modifyEmail (body, accessToken) {
  const url = '/validate/users/qa/change-email';

  const res = await chai
    .request(svcBaseUrl)
    .put(url)
    .set(
      request.createNewCoreHeaders({
        'X-Investree-token': accessToken
      })
    )
    .send(body);

  return res.body;
}
