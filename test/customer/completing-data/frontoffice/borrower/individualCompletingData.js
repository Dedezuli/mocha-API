const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];
const boUser = require('@fixtures/backoffice_user');
const svcBaseUrl = request.getSvcUrl();

describe('Completing Data Frontoffice Individual Borrower', function () {
  const url = '/validate/customer/completing-data/frontoffice/borrower';
  const CUSTOMER_STATUS_COMPLETING_DATA = 2;
  const CUSTOMER_STATUS_PENDING_VERIFICATION = 3;
  const CUSTOMER_STATUS_ACTIVE = 4;
  const CUSTOMER_STATUS_REJECTED = 5;
  const CUSTOMER_STATUS_INACTIVE = 6;

  let accessTokenIndividual;
  let customerIdIndividual;
  let accessTokenAdmin;

  before(async function () {
    report.setInfo(this, 'Attempting to do individual borrower registration');
    const registerResIndividual = await request.borrowerRegister(false);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to do backoffice login as admin');
    const resAdmin = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    accessTokenAdmin = resAdmin.data.accessToken;

    report.setInfo(this, `Success to login as admin with access token : ${accessTokenAdmin}`);
  });

  describe('#smoke', function () {
    it('Get completing data FO individual borrower should succeed #TC-111', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Individual borrower completing data personal profile mandatory should be equal to 22 #TC-112', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const personalProfileCounter = advancedInfo.personalProfile.counter;
      expect(personalProfileCounter.total).to.eql(
        22,
        'Personal profile total counter should be 22'
      );
    });

    it('Individual borrower completing data business profile mandatory should be equal to 12 #TC-113', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const businessProfileCounter = advancedInfo.businessProfile.counter;
      expect(businessProfileCounter.total).to.eql(
        12,
        'Business profile total counter should be 12'
      );
    });

    it('Individual borrower completing data legal information mandatory should be equal to 1 #TC-114', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const legalInformationCounter = advancedInfo.legalInformation.counter;
      expect(legalInformationCounter.total).to.eql(
        1,
        'Legal information total counter should be 1'
      );
    });

    it('Individual borrower completing data bank information mandatory should be equal to 1 #TC-115', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const bankInformationCounter = advancedInfo.bankInformation.counter;
      expect(bankInformationCounter.total).to.eql(1, 'Bank information total counter should be 1');
    });

    it('Individual borrower completing data financial information total should be equal to 0 #TC-116', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const financialInformationCounter = advancedInfo.financialInformation.counter;
      expect(financialInformationCounter.total).to.eql(
        0,
        'Financial information for individual borrower is optional. Total counter should be 0.'
      );
    });

    it('Individual borrower completing data emergency contact mandatory should be equal to 1 #TC-117', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const emergencyContactCounter = advancedInfo.emergencyContact.counter;
      expect(emergencyContactCounter.total).to.eql(
        1,
        'Emergency contact total counter should be 1'
      );
    });

    it('Individual borrower completing data product preference mandatory should be equal to 1 #TC-118', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const productPreferenceCounter = advancedInfo.productPreference.counter;
      expect(productPreferenceCounter.total).to.eql(
        1,
        'Product preference total counter should be 1'
      );
    });

    it('Individual borrower filled data completion should be at least equal to total if all mandatory fields have been filled #TC-119', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const personalProfileCounter = advancedInfo.personalProfile.counter;
      const businessProfileCounter = advancedInfo.businessProfile.counter;
      const legalInfoCounter = advancedInfo.legalInformation.counter;
      const bankInfoCounter = advancedInfo.bankInformation.counter;
      const emergencyContactCounter = advancedInfo.emergencyContact.counter;
      const productPrefCounter = advancedInfo.productPreference.counter;

      expect(personalProfileCounter.filled).to.eql(
        personalProfileCounter.total,
        'Personal profile filled not equal to total'
      );
      expect(businessProfileCounter.filled).to.eql(
        businessProfileCounter.total,
        'Business profile filled not equal to total'
      );
      expect(legalInfoCounter.filled).to.eql(
        legalInfoCounter.total,
        'Legal information filled not equal to total'
      );
      expect(bankInfoCounter.filled).to.be.at.least(
        bankInfoCounter.total,
        'Bank information filled should be at least equal to total'
      );
      expect(emergencyContactCounter.filled).to.be.at.least(
        emergencyContactCounter.total,
        'Emergency contact filled should be at least equal to total'
      );
      expect(productPrefCounter.filled).to.eql(
        productPrefCounter.total,
        'Product preference filled not equal to total'
      );
    });

    it('Individual borrower first get completing data should change status to Completing Data #TC-120', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const crStatus = await getCustomerStatus(customerIdIndividual);
      expect(crStatus).to.eql(CUSTOMER_STATUS_COMPLETING_DATA);
    });
  });

  describe('#negative', function () {
    it('Individual borrower completing data legal information filled should be 0 if only SKDU #TC-121', async function () {
      const registerRes = await request.borrowerRegister(false, ['legal-information']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomInteger = help.randomInteger(3);
      const body = {
        customerId: customerId,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: `skdu_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

      const legalInfoUrl = '/validate/customer/legal-information';
      await chai
        .request(svcBaseUrl)
        .post(legalInfoUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const legalInformationCounter = advancedInfo.legalInformation.counter;
      expect(legalInformationCounter.filled).to.eql(
        0,
        'Legal information filled counter should be 0 since only SKDU filled'
      );
    });

    it('Individual borrower get completing data should not change status to Completing Data if already Active #TC-122', async function () {
      const registerRes = await request.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenAdmin
          })
        )
        .send(changeStatusBody);
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const crStatus = await getCustomerStatus(customerId);
      expect(crStatus).to.eql(
        CUSTOMER_STATUS_ACTIVE,
        `cr_status should be ${CUSTOMER_STATUS_ACTIVE}, but got ${crStatus}`
      );
    });

    it('Individual borrower get completing data should not change status to Completing Data if already Pending Verification #TC-123', async function () {
      const registerRes = await request.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const crStatus = await getCustomerStatus(customerId);
      expect(crStatus).to.eql(
        CUSTOMER_STATUS_PENDING_VERIFICATION,
        `cr_status should be ${CUSTOMER_STATUS_PENDING_VERIFICATION}, but got ${crStatus}`
      );
    });

    it('Individual borrower get completing data should not change status to Completing Data if already Inactive #TC-124', async function () {
      const registerRes = await request.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenAdmin
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const crStatus = await getCustomerStatus(customerId);
      expect(crStatus).to.eql(
        CUSTOMER_STATUS_INACTIVE,
        `cr_status should be ${CUSTOMER_STATUS_INACTIVE}, but got ${crStatus}`
      );
    });

    it('Individual borrower get completing data should not change status to Completing Data if already Rejected #TC-125', async function () {
      const registerRes = await request.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenAdmin
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const crStatus = await getCustomerStatus(customerId);
      expect(crStatus).to.eql(
        CUSTOMER_STATUS_REJECTED,
        `cr_status should be ${CUSTOMER_STATUS_REJECTED}, but got ${crStatus}`
      );
    });
  });
});

function getCustomerStatus (customerId) {
  const knex = require('knex')(newcoreDbConfig);

  return knex('customer_role')
    .select('cr_status')
    .where({
      cr_ci_id: customerId,
      cr_type: 1
    })
    .first()
    .then((row) => {
      return row.cr_status;
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      knex.destroy();
    });
}
