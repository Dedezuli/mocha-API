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

describe('Completing Data Frontoffice Institutional Borrower', function () {
  const url = '/validate/customer/completing-data/frontoffice/borrower';
  const CUSTOMER_STATUS_COMPLETING_DATA = 2;
  const CUSTOMER_STATUS_PENDING_VERIFICATION = 3;
  const CUSTOMER_STATUS_ACTIVE = 4;
  const CUSTOMER_STATUS_REJECTED = 5;
  const CUSTOMER_STATUS_INACTIVE = 6;

  let accessTokenInstitutional;
  let customerIdInstitutional;
  let accessTokenAdmin;

  before(async function () {
    report.setInfo(this, 'Attempting to do institutional borrower registration');
    const registerResInstitutional = await request.borrowerRegister(true);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(
      this,
      `Institutional borrower registered with customerId ${customerIdInstitutional}`
    );

    report.setInfo(this, 'Attempting to do backoffice login as admin');
    const resAdmin = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    accessTokenAdmin = resAdmin.data.accessToken;

    report.setInfo(this, `Success to login as admin with access token : ${accessTokenAdmin}`);
  });

  describe('#smoke', function () {
    it('Get completing data FO institutional borrower should succeed #TC-126', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Institutional borrower completing data personal profile mandatory should be equal to 22 #TC-127', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
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

    it('Institutional borrower completing data business profile mandatory should be equal to 12 #TC-128', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
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

    it('Institutional borrower completing data legal information mandatory should be equal to 6 #TC-129', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const legalInformationCounter = advancedInfo.legalInformation.counter;
      expect(legalInformationCounter.total).to.eql(
        6,
        'Legal information total counter should be 6 excluding SKDU'
      );
    });

    it('Institutional borrower completing data bank information mandatory should be equal to 1 #TC-130', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const bankInformationCounter = advancedInfo.bankInformation.counter;
      expect(bankInformationCounter.total).to.eql(1, 'Bank information total counter should be 1');
    });

    it('Institutional borrower completing data financial information total should be equal to 8 #TC-131', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const financialInformationCounter = advancedInfo.financialInformation.counter;
      expect(financialInformationCounter.total).to.eql(
        8,
        'Financial information total counter should be 8'
      );
    });

    it('Institutional borrower completing data shareholder information mandatory should be equal to 1 #TC-132', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const shareHolderInformationCounter = advancedInfo.shareHolderInformation.counter;
      expect(shareHolderInformationCounter.total).to.eql(
        1,
        'Shareholder information total counter should be 1'
      );
    });

    it('Institutional borrower completing data product preference mandatory should be equal to 1 #TC-133', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
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

    it('Institutional borrower filled data completion should be at least equal to total if all mandatory fields have been filled #TC-134', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const advancedInfo = res.body.data.advancedInfo;
      const personalProfileCounter = advancedInfo.personalProfile.counter;
      const businessProfileCounter = advancedInfo.businessProfile.counter;
      const legalInfoCounter = advancedInfo.legalInformation.counter;
      const bankInfoCounter = advancedInfo.bankInformation.counter;
      const shareHolderInformationCounter = advancedInfo.shareHolderInformation.counter;
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
      expect(shareHolderInformationCounter.filled).to.be.at.least(
        shareHolderInformationCounter.total,
        'Shareholder information filled should be at least equal to total'
      );
      expect(productPrefCounter.filled).to.eql(
        productPrefCounter.total,
        'Product preference filled not equal to total'
      );
    });

    it('Institutional borrower first get completing data should change status to Completing Data #TC-135', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .get(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const crStatus = await getCustomerStatus(customerIdInstitutional);
      expect(crStatus).to.eql(CUSTOMER_STATUS_COMPLETING_DATA);
    });
  });

  describe('#negative', function () {
    it('Institutional borrower completing data legal information filled should be 0 if only SKDU #TC-136', async function () {
      const registerRes = await request.borrowerRegister(true, ['legal-information']);
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

    it('Institutional borrower get completing data should not change status to Completing Data if already Active #TC-137', async function () {
      const registerRes = await request.borrowerRegister(true);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Active',
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
        CUSTOMER_STATUS_ACTIVE,
        `cr_status should be ${CUSTOMER_STATUS_ACTIVE}, but got ${crStatus}`
      );
    });

    it('Institutional borrower get completing data should not change status to Completing Data if already Pending Verification #TC-138', async function () {
      const registerRes = await request.borrowerRegister(true);
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
        )
        .send({});

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

    it('Institutional borrower get completing data should not change status to Completing Data if already Inactive #TC-139', async function () {
      const registerRes = await request.borrowerRegister(true);
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

    it('Institutional borrower get completing data should not change status to Completing Data if already Rejected #TC-140', async function () {
      const registerRes = await request.borrowerRegister(true);
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
async function getCustomerStatus (customerId) {
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
      console.log(err);
    })
    .finally(() => {
      knex.destroy();
    });
}
