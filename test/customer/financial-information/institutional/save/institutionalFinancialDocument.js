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

describe('Financial Information Add', function () {
  const url = '/validate/customer/financial-information/institutional/save';
  const urlGetData = '/validate/customer/completing-data/backoffice/borrower';

  let accessTokenBoAdmin;
  let customerIdInstitutional;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResInstitutional = await req.borrowerRegister(true);

    customerIdInstitutional = registerResInstitutional.customerId;
  });

  describe('#smoke', function () {
    it('Should succeed when update financial document #TC-592', async function () {
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(customerIdInstitutional, getData);
      body.financialStatement[0].statementFileAt = help.backDateByYear(1);
      body.bankStatement[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should succeed to save in db new core when update financial document institutional #TC-593', async function () {
      let getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(customerIdInstitutional, getData);
      body.financialStatement[0].statementFileAt = help.backDateByYear(1);
      body.bankStatement[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db legacy when update financial information institutional e-statement #TC-594', async function () {
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(customerIdInstitutional, getData);
      body.financialStatement[0].statementFileAt = help.backDateByYear(1);
      body.bankStatement[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });

      await assertSavedDataInLegacy(getDataLegacy.body[0], body);
    });

    it('Should succeed to replace data in db legacy when delete latest statement file date of financial information #TC-595', async function () {
      let getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      let body = generateBodyOfUpdate(customerIdInstitutional, getData);
      body.financialStatement[1].statementFileAt = help.backDateByYear(1);
      body.bankStatement[1].statementFileAt = help.backDateByYear(1);
      body.financialStatement[0].statementFileAt = help.backDateByYear(2);
      body.bankStatement[0].statementFileAt = help.backDateByYear(2);

      await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      body = generateBodyOfUpdate(customerIdInstitutional, getData);
      body.financialStatement[1].isDelete = true;
      body.bankStatement[1].isDelete = true;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedDataInLegacy(getDataLegacy.body[0], body);
    });

    it('Add financial information institutional financial statement should succeed #TC-596', async function () {
      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Should fail when add financial information file type other than e-statement 30 and financial statement 10 #TC-597', async function () {
      const body = generateBody(customerIdInstitutional);
      body.bankStatement[0].statementFileType = 1;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql(
        'Data not valid. Please check following field: Statement File Type'
      );
    });

    it('Add financial information statement date should not be future date #TC-598', async function () {
      const body = generateBody(customerIdInstitutional);
      body.bankStatement[0].statementFileAt = help.futureDate();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than today');
    });

    it('Add financial information institutional e-statement 6 years before this year should fail #TC-599', async function () {
      const body = generateBody(customerIdInstitutional);
      body.bankStatement[0].statementFileAt = help.backDateByYear(6);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional financial statement 6 years before this year should fail #TC-600', async function () {
      const body = generateBody(customerIdInstitutional);
      body.financialStatement[0].statementFileAt = help.backDateByYear(6);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional financial statement 5 years 1 month before this year should fail #TC-601', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = generateBody(customerIdInstitutional);
      body.financialStatement[0].statementFileAt = help.formatDate(date);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional e-statement 5 years 1 month before this year should fail #TC-602', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = generateBody(customerIdInstitutional);
      body.bankStatement[0].statementFileAt = help.formatDate(date);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Should failed to save in DB legacy when failed to sync add financial information institutional user #TC-603', async function () {
      const resRegis = await req.borrowerRegister(true, ['e-statement', 'financial-statement']);
      const username = resRegis.userName;
      const customerId = resRegis.customerId;

      await dbFun.changeEmailByUsername(username);

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
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
          'filter[where][bpd_migration_id]': customerId
        });
      await assertNotSavedInLegacy(getData.body[0]);
    });

    it('Should failed to save in DB newcore when failed to sync add financial information institutional user #TC-604', async function () {
      const resRegis = await req.borrowerRegister(true, ['e-statement', 'financial-statement']);
      const username = resRegis.userName;
      const customerId = resRegis.customerId;

      await dbFun.changeEmailByUsername(username);

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      await assertNotSavedInNewCore(getData);
    });
  });
});

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    financialStatement: [
      {
        statementId: '',
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileAt: help.backDateByYear(5),
        isDelete: false
      }
    ],
    bankStatement: [
      {
        statementId: '',
        statementFileType: 30,
        statementUrl: help.randomUrl(),
        statementFileAt: help.backDateByYear(5),
        isDelete: false
      }
    ],
    averageMonthlySales: '',
    profitMargin: '',
    financialStatementDetail: [],
    financialTrend: [],
    financialRatio: [],
    balanceSheet: [],
    salesTransaction: [],
    customerNotes: {
      customerNotesId: '',
      name: 'immanuelyoo',
      customerType: '2',
      remarks: ''
    }
  };
  return body;
}

function generateBodyOfUpdate (customerId, getData) {
  const body = generateBody(customerId);
  body.financialStatement = [];
  body.bankStatement = [];
  const dataFinancialStatements =
    getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  const dataEStatements = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  for (let i = 0; i < dataFinancialStatements.length; i++) {
    const data = {
      statementId: dataFinancialStatements[i].statementId,
      statementFileType: dataFinancialStatements[i].statementFileType,
      statementUrl: dataFinancialStatements[i].statementUrl,
      statementFileAt: dataFinancialStatements[i].statementFileAt,
      isDelete: dataFinancialStatements[i].isDelete
    };
    body.financialStatement.push(data);
  }
  for (let i = 0; i < dataEStatements.length; i++) {
    const data = {
      statementId: dataEStatements[i].statementId,
      statementFileType: dataEStatements[i].statementFileType,
      statementUrl: dataEStatements[i].statementUrl,
      statementFileAt: dataEStatements[i].statementFileAt,
      isDelete: dataEStatements[i].isDelete
    };
    body.bankStatement.push(data);
  }
  return body;
}

function assertSavedDataInNewCore (getData, bodyRequest) {
  const financialStatementData = bodyRequest.financialStatement;
  const eStatementData = bodyRequest.bankStatement;
  for (let i = 0; i < financialStatementData.length; i++) {
    const statementFileType =
      getData.body.data.advancedInfo.financialInformation.field.financialStatements[i]
        .statementFileType;
    const statementUrl =
      getData.body.data.advancedInfo.financialInformation.field.financialStatements[i].statementUrl;
    const statementFileAt =
      getData.body.data.advancedInfo.financialInformation.field.financialStatements[i]
        .statementFileAt;
    expect(financialStatementData[i]).to.have.property(
      'statementFileType',
      statementFileType,
      `statement file type should be ${financialStatementData[i].statementFileType}`
    );
    expect(financialStatementData[i]).to.have.property(
      'statementUrl',
      statementUrl,
      `statement url should be ${financialStatementData[i].statementUrl}`
    );
    expect(financialStatementData[i]).to.have.property(
      'statementFileAt',
      statementFileAt,
      `statement file date should be ${financialStatementData[i].statementFileAt}`
    );
  }
  for (let i = 0; i < eStatementData.length; i++) {
    const statementFileType =
      getData.body.data.advancedInfo.financialInformation.field.eStatements[i].statementFileType;
    const statementUrl =
      getData.body.data.advancedInfo.financialInformation.field.eStatements[i].statementUrl;
    const statementFileAt =
      getData.body.data.advancedInfo.financialInformation.field.eStatements[i].statementFileAt;
    expect(eStatementData[i]).to.have.property(
      'statementFileType',
      statementFileType,
      `statement file type should be ${eStatementData[i].statementFileType}`
    );
    expect(eStatementData[i]).to.have.property(
      'statementUrl',
      statementUrl,
      `statement url should be ${eStatementData[i].statementUrl}`
    );
    expect(eStatementData[i]).to.have.property(
      'statementFileAt',
      statementFileAt,
      `statement file date should be ${eStatementData[i].statementFileAt}`
    );
  }
}

function assertNotSavedInNewCore (getData) {
  const dataFinancialStatement =
    getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  const dataEStatement = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  expect(dataFinancialStatement, 'data of financial statement information should be empty').to.be
    .empty;
  expect(dataEStatement, 'data of e-statement information should be empty').to.be.empty;
}

function assertSavedDataInLegacy (getData, bodyRequest) {
  const urlRekeningKoran = getData.bpd_cdoc_rekening_koran;
  const urlLaporanKeuangan = getData.bpd_cdoc_laporan_keuangan;
  expect(bodyRequest.financialStatement[0]).to.have.property(
    'statementUrl',
    urlLaporanKeuangan,
    `statement url laporan keuangan should be ${bodyRequest.financialStatement[0].statementUrl}`
  );
  expect(bodyRequest.bankStatement[0]).to.have.property(
    'statementUrl',
    urlRekeningKoran,
    `statement url rekening koran should be ${bodyRequest.bankStatement[0].statementUrl}`
  );
}

function assertNotSavedInLegacy (getData) {
  const urlRekeningKoran = getData.bpd_cdoc_rekening_koran;
  const urlLaporanKeuangan = getData.bpd_cdoc_laporan_keuangan;
  expect(urlRekeningKoran, 'Url Rekening Koran in legacy should be null').to.be.null;
  expect(urlLaporanKeuangan, 'Url Laporan Keuangan in legacy should be null').to.be.null;
}
