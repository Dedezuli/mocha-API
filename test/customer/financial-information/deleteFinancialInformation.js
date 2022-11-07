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

describe('Financial Information Delete', function () {
  const url = '/validate/customer/financial-information/borrower';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const loginUrl = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;
  let usernameInstitutional;

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

    const registerResInstitutional = await req.borrowerRegister(true, [
      'e-statement',
      'financial-statement'
    ]);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Delete financial information individual e-statement should succeed #TC-686', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Delete financial information institutional financial statement should succeed #TC-687', async function () {
      const body = generateBody(customerIdIndividual, 10);
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const financialId = addRes.body.data.id;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should succeed to delete in db new core when delete financial information individual e-statement #TC-688', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );
      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
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

      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to delete in db new core when delete financial information institutional financial statement #TC-689', async function () {
      const body = generateBody(customerIdIndividual, 10);
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const financialId = addRes.body.data.id;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
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
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to delete in db legacy when delete financial information individual e-statement #TC-690', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );
      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedInLegacy(getData.body, body);
    });

    it('Should succeed to delete in db legacy when delete financial information institutional financial statement #TC-691', async function () {
      const body = generateBody(customerIdIndividual, 10);
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const financialId = addRes.body.data.id;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedInLegacy(getData.body, body);
    });

    it('Should succeed to delete and replace statement url with second latest statement file in db legacy when delete financial information institutional financial statement #TC-692', async function () {
      const bodyOne = generateBody(customerIdIndividual, 10);
      await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(bodyOne);

      const bodyTwo = generateBody(customerIdIndividual, 10);
      bodyTwo.statementFileDate = help.backDateByYear(4);
      const addResTwo = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(bodyTwo);
      const financialIdTwo = addResTwo.body.data.id;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialIdTwo}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedAndReplaceInLegacy(getData.body, bodyOne);
    });
  });

  describe('#negative', function () {
    it('Should fail when delete financial information using financial id owned by different user #TC-693', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(404);
    });

    it('Should fail when delete financial information if borrower status is active #TC-694', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
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

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete financial information if borrower status is pending verification #TC-695', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
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

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete financial information if borrower status is inactive #TC-696', async function () {
      const financialId = await createFinancialInformation(
        url,
        customerIdIndividual,
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

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail to delete in db when delete financial information if borrower status is inactive #TC-697', async function () {
      const body = await generateBody(customerIdIndividual);
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);

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

      const financialId = addRes.body.data.id;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
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
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should failed to delete in db new core when failed to sync delete financial statement #TC-698', async function () {
      const body = generateBody(customerIdInstitutional, '10');
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const financialId = addRes.body.data.id;

      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );

      await assertNotSavedInNewCore(getData, body);
    });

    it('Should failed to delete in db legacy when failed to sync delete financial statement #TC-699', async function () {
      const body = generateBody(customerIdInstitutional, 10);
      const addRes = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const financialId = addRes.body.data.id;

      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${financialId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });

      await assertNotSavedDataInLegacy(getData.body, body);
    });
  });
});

async function createFinancialInformation (url, customerId, accessToken) {
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

function generateBody (customerId, statementFileType = '30') {
  const body = {
    customerId: customerId,
    statementFileType: statementFileType,
    statementUrl: help.randomUrl(),
    statementFileDate: help.backDateByYear(5)
  };

  return body;
}

function assertNotSavedInNewCore (getData, bodyRequest) {
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
    `statement file type should be ${statementFileType}`
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

function assertSavedDataInNewCore (getData, bodyRequest) {
  let statementData;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementData = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  } else {
    statementData = getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  }
  expect(statementData, 'Failed to delete').to.be.empty;
}

function assertNotSavedDataInLegacy (getData, bodyRequest) {
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

function assertSavedInLegacy (getData, bodyRequest) {
  const statementData = getData[0];
  let statementUrl;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementUrl = statementData.bpd_cdoc_rekening_koran;
  } else {
    statementUrl = statementData.bpd_cdoc_laporan_keuangan;
  }
  expect(statementUrl, 'Failed to delete statement url').to.be.null;
}

function assertSavedAndReplaceInLegacy (getData, bodyRequest) {
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
