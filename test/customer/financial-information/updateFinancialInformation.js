const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Financial Information Update', function () {
  const url = '/validate/customer/financial-information/borrower';
  const urlPut = '/validate/customer/financial-information';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const loginUrl = '/validate/users/auth/login';
  const MAXIMUM_FILE_YEAR_DATE = 5;

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;
  let usernameIndividual;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false, [
      'e-statement',
      'financial-statement'
    ]);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    usernameIndividual = registerResIndividual.userName;

    const registerResInstitutional = await req.borrowerRegister(true, [
      'e-statement',
      'financial-statement'
    ]);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
  });

  describe('#smoke', function () {
    it('Update individual borrower e-statement should succeed #TC-700', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );
      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Update institutional borrower e-statement should succeed #TC-701', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdInstitutional,
        30,
        accessTokenInstitutional
      );
      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Update institutional borrower financial statement should succeed #TC-702', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdInstitutional,
        10,
        accessTokenInstitutional
      );
      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should success to save in db new core when Update institutional borrower e-statement #TC-703', async function () {
      const body = generateBody(customerIdInstitutional, '30');
      const resAdd = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const financialId = resAdd.body.data.id;

      const bodyOfUpdate = generateBody(customerIdInstitutional, '30');

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(bodyOfUpdate);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      await assertSavedDataInNewCore(getData, bodyOfUpdate);
    });

    it('Should success to save in db new core when update individual borrower financial statement #TC-704', async function () {
      const body = generateBody(customerIdIndividual, '10');
      const resAdd = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const financialId = resAdd.body.data.id;

      const bodyOfUpdate = generateBody(customerIdIndividual, '10');

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(bodyOfUpdate);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      await assertSavedDataInNewCore(getData, bodyOfUpdate);
    });

    it('Should success to save in db legacy when Update institutional borrower e-statement #TC-705', async function () {
      const body = generateBody(customerIdInstitutional, 30);
      const resAdd = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const financialId = resAdd.body.data.id;

      const bodyOfUpdate = generateBody(customerIdInstitutional, 30);
      bodyOfUpdate.statementFileDate = help.backDateByYear(4);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(bodyOfUpdate);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertDataInLegacy(getData.body, bodyOfUpdate);
    });

    it('Should success to save in db legacy when update individual borrower financial statement #TC-706', async function () {
      const body = generateBody(customerIdIndividual, 10);
      const resAdd = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const financialId = resAdd.body.data.id;

      const bodyOfUpdate = generateBody(customerIdIndividual, 10);
      bodyOfUpdate.statementFileDate = help.backDateByYear(4);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(bodyOfUpdate);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertDataInLegacy(getData.body, bodyOfUpdate);
    });
  });

  describe('#negative', function () {
    it('Should fail when update financial information using customerId of different user #TC-707', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        10,
        accessTokenIndividual
      );
      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(404);
    });

    it('Should fail when update financial information file type other than e-statement 30 and financial statement 10 #TC-708', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );
      const body = generateBody(customerIdIndividual, 1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql(
        'Data not valid. Please check following field: Statement File Type'
      );
    });

    it('Update financial information statement date should not be future date #TC-709', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.futureDate()
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than today');
    });

    it('Update financial information user should not update statement date without statement file type #TC-710', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement FileType cannot be blank');
    });

    it('Update financial information user should not update statement date without statement file url #TC-711', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Update financial information with statement file type empty string should fail #TC-712', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement FileType cannot be blank');
    });

    it('Update financial information with statement file type null should fail #TC-713', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: null,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement FileType cannot be blank');
    });

    it('Update financial information with statement file url empty string should fail #TC-714', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: '',
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Update financial information with statement file url null should fail #TC-715', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: null,
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Update financial information individual e-statement 6 years before this year should fail #TC-716', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Update financial information individual financial statement 6 years before this year should fail #TC-717', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '10',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Update financial information institutional e-statement 6 years before this year should fail #TC-718', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdInstitutional,
        30,
        accessTokenInstitutional
      );

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Update financial information institutional financial statement 6 years before this year should fail #TC-719', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '10',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Should fail when update financial information if borrower status is active #TC-720', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update financial information if borrower status is pending verification #TC-721', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send({});

      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update financial information if borrower status is inactive #TC-722', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed to save in db new core when update financial information institutional e-statement 6 years before this year #TC-723', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdInstitutional,
        30,
        accessTokenInstitutional
      );

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should failed to save in db legacy when update financial information institutional e-statement 6 years before this year #TC-724', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdInstitutional,
        30,
        accessTokenInstitutional
      );

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('should failed to update e-statement of borrower when failed to sync data #TC-725', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        30,
        accessTokenIndividual
      );

      await dbFun.changeEmailByUsername(usernameIndividual);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameIndividual,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${urlPut}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});

async function createFinancialInformation (url, customerId, statementFileType, accessToken) {
  const body = generateBody(customerId, statementFileType);
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

function generateBody (customerId, statementFileType = 30) {
  const body = {
    customerId: customerId,
    statementFileType: statementFileType,
    statementUrl: help.randomUrl(),
    statementFileDate: help.backDateByYear(5)
  };

  return body;
}

function assertSavedDataInNewCore (getData, bodyRequest) {
  let statementData;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementData = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  } else {
    statementData = getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  }
  const arrayData = statementData.length - 1;
  const statementFileType = statementData[arrayData].statementFileType;
  const statementUrl = statementData[arrayData].statementUrl;
  const statementFileAt = statementData[arrayData].statementFileAt;
  expect(bodyRequest).to.have.property(
    'statementFileType',
    `${statementFileType}`,
    `statement file type should be${statementFileType}`
  );
  expect(bodyRequest).to.have.property(
    'statementUrl',
    statementUrl,
    `statement url should be ${statementUrl}`
  );
  expect(bodyRequest).to.have.property(
    'statementFileDate',
    statementFileAt,
    `statement file at should be ${statementFileAt}`
  );
}

function assertNotSavedInNewCore (getData, bodyRequest) {
  let statementData;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementData = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  } else {
    statementData = getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  }
  const arrayData = statementData.length - 1;
  const statementUrl = statementData[arrayData].statementUrl;
  const statementFileAt = statementData[arrayData].statementFileAt;
  expect(bodyRequest).not.equal(statementUrl, `statement url should be ${statementUrl}`);
  expect(bodyRequest).not.equal(statementFileAt, `statement file at should be ${statementFileAt}`);
}

function assertDataInLegacy (getData, bodyRequest) {
  const statementData = getData[0];
  let statementUrl;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementUrl = statementData.bpd_cdoc_rekening_koran;
  } else {
    statementUrl = statementData.bpd_cdoc_laporan_keuangan;
  }
  expect(bodyRequest).to.have.property(
    'statementUrl',
    statementUrl,
    `statement url should be ${statementUrl}`
  );
}

function assertNotSavedInLegacy (getData, bodyRequest) {
  const statementData = getData[0];
  let statementUrl;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementUrl = statementData.bpd_cdoc_rekening_koran;
  } else {
    statementUrl = statementData.bpd_cdoc_laporan_keuangan;
  }
  expect(bodyRequest.statementUrl).not.equal(
    statementUrl,
    `statement url should be ${statementUrl}`
  );
}
