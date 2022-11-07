const help = require('@lib/helper');
const req = require('@lib/request');
const vars = require('@fixtures/vars');
const dbFun = require('@lib/dbFunction');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Shareholder Information Delete', function () {
  const url = '/validate/customer/shareholders-information';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const loginUrl = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdInstitutional;
  let usernameInstitutional;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['shareholders-information']);
    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['shareholders-information']);
    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Delete shareholder information should succeed #TC-849', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should success delete shareholder information and should sync to legacy #TC-850', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });

      report.setPayload(this, res, responseTime);

      await assertGetData(getData, getDataLegacy.body);
    });
  });

  describe('#negative', function () {
    it('Should fail when delete shareholder information owned by other user #TC-851', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(404);
    });

    it('Should fail when delete shareholder information if borrower status is active #TC-852', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete shareholder information if borrower status is pending verification #TC-853', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send({});

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete shareholder information if borrower status is inactive #TC-854', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };
      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail to delete shareholder information if the borrower email contain restricted email #TC-855', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: usernameInstitutional,
          password: vars.default_password,
          flag: 1
        });
      const newAccessToken = loginRes.body.data.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/borrower/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': newAccessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});

async function createShareholderInformation (url, customerId, accessToken) {
  const body = generateBody(customerId);

  const res = await chai
    .request(svcBaseUrl)
    .post(url)
    .set(
      req.createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(body);

  return res.body.data.id;
}

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    position: 5,
    fullName: help.randomFullName(),
    mobilePrefix: 1,
    mobileNumber: help.randomPhoneNumber(12),
    emailAddress: help.randomEmail(),
    stockOwnership: 1.11,
    dob: help.randomDate(2000),
    identificationCardUrl: help.randomUrl(),
    identificationCardNumber: help.randomInteger('KTP'),
    identificationCardExpiryDate: help.futureDate(),
    selfieUrl: help.randomUrl(),
    taxCardUrl: help.randomUrl(),
    taxCardNumber: help.randomInteger('NPWP'),
    isLss: true,
    isPgs: true,
    isTss: true
  };

  return body;
}

function assertGetData (getData, getDataLegacy) {
  const shareholderIdNewCore = getData.body.data.advancedInfo.shareHolderInformation.field;

  expect(shareholderIdNewCore).to.be.empty;
  expect(getDataLegacy).to.be.empty;
}
