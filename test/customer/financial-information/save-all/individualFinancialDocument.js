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
  const url = '/validate/customer/financial-information/save-all';
  const urlGetData = '/validate/customer/completing-data/backoffice/borrower';

  let accessTokenBoAdmin;
  let customerIdIndividual;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false);

    customerIdIndividual = registerResIndividual.customerId;
  });

  describe('#smoke', function () {
    it('Should succeed when update financial document #TC-626', async function () {
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(getData);
      body.financialStatementDocuments[0].statementFileAt = help.backDateByYear(1);
      body.eStatementDocuments[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Should succeed to save in db new core when update financial document individual #TC-627', async function () {
      let getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(getData);
      body.financialStatementDocuments[0].statementFileAt = help.backDateByYear(1);
      body.eStatementDocuments[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db legacy when update financial information individual e-statement #TC-628', async function () {
      let getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const body = generateBodyOfUpdate(getData);
      body.financialStatementDocuments[0].statementFileAt = help.backDateByYear(1);
      body.eStatementDocuments[0].statementFileAt = help.backDateByYear(1);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedDataInLegacy(getData.body[0], body);
    });

    it('Should succeed to replace data in db legacy when delete latest statement file date of financial information individual user #TC-629', async function () {
      const bodyCreate = generateBody(customerIdIndividual);
      await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(bodyCreate);

      let getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      let body = generateBodyOfUpdate(getData);
      body.financialStatementDocuments[1].statementFileAt = help.backDateByYear(1);
      body.eStatementDocuments[1].statementFileAt = help.backDateByYear(1);
      body.financialStatementDocuments[0].statementFileAt = help.backDateByYear(2);
      body.eStatementDocuments[0].statementFileAt = help.backDateByYear(2);

      await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      body = generateBodyOfUpdate(getData);
      body.financialStatementDocuments[1].isDelete = true;
      body.eStatementDocuments[1].isDelete = true;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedDataInLegacy(getData.body[0], body);
    });

    it('Add financial information individual financial statement should succeed #TC-630', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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
    it('Should fail when add financial information file type other than e-statement 30 and financial statement 10 #TC-631', async function () {
      const body = generateBody(customerIdIndividual);
      body.eStatementDocuments[0].statementFileType = 1;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Add financial information statement date should not be future date #TC-632', async function () {
      const body = generateBody(customerIdIndividual);
      body.eStatementDocuments[0].statementFileAt = help.futureDate();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Add financial information individual e-statement 6 years before this year should fail #TC-633', async function () {
      const body = generateBody(customerIdIndividual);
      body.eStatementDocuments[0].statementFileAt = help.backDateByYear(6);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Add financial information individual financial statement 6 years before this year should fail #TC-634', async function () {
      const body = generateBody(customerIdIndividual);
      body.financialStatementDocuments[0].statementFileAt = help.backDateByYear(6);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Add financial information individual financial statement 5 years 1 month before this year should fail #TC-635', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = generateBody(customerIdIndividual);
      body.financialStatementDocuments[0].statementFileAt = help.formatDate(date);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Add financial information individual e-statement 5 years 1 month before this year should fail #TC-636', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = generateBody(customerIdIndividual);
      body.eStatementDocuments[0].statementFileAt = help.formatDate(date);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Should failed to save in DB legacy when failed to sync add financial information individual user #TC-637', async function () {
      const resRegis = await req.borrowerRegister(false, ['e-statement', 'financial-statement']);
      const username = resRegis.userName;
      const customerId = resRegis.customerId;

      await dbFun.changeEmailByUsername(username);

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
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

    it('Should failed to save in DB newcore when failed to sync add financial information individual user #TC-638', async function () {
      const resRegis = await req.borrowerRegister(false, ['e-statement', 'financial-statement']);
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

function generateBody () {
  const body = {
    eStatementDocuments: [
      {
        statementId: '',
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileAt: help.backDateByYear(5),
        isDelete: false
      }
    ],
    financialStatementDocuments: [
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
    financialStatement: [],
    financialTrend: [],
    salesTransactionData: [],
    customerNotesData: [],
    financialInformation: {
      averageMonthlySales: null,
      profitMargin: null,
      otherIncome: null,
      generalProfitMargin: null,
      profitMarginFromPartner: null,
      totalNettMargin: null,
      livingCost: null,
      updatedBy: null,
      updatedAt: null
    }
  };
  return body;
}

function generateBodyOfUpdate (getData) {
  const body = generateBody();
  body.financialStatementDocuments = [];
  body.eStatementDocuments = [];
  const dataFinancialStatements = getData.body.data.advancedInfo.financialStatementDocuments.field;
  const dataEStatements = getData.body.data.advancedInfo.eStatementDocuments.field;
  for (let i = 0; i < dataFinancialStatements.length; i++) {
    const data = {
      statementId: dataFinancialStatements[i].statementId,
      statementFileType: dataFinancialStatements[i].statementFileType,
      statementUrl: dataFinancialStatements[i].statementUrl,
      statementFileAt: dataFinancialStatements[i].statementFileAt,
      isDelete: dataFinancialStatements[i].isDelete
    };
    body.financialStatementDocuments.push(data);
  }
  for (let i = 0; i < dataEStatements.length; i++) {
    const data = {
      statementId: dataEStatements[i].statementId,
      statementFileType: dataEStatements[i].statementFileType,
      statementUrl: dataEStatements[i].statementUrl,
      statementFileAt: dataEStatements[i].statementFileAt,
      isDelete: dataEStatements[i].isDelete
    };
    body.eStatementDocuments.push(data);
  }
  return body;
}

function assertSavedDataInNewCore (getData, bodyRequest) {
  const financialStatementData = bodyRequest.financialStatementDocuments;
  const eStatementData = bodyRequest.eStatementDocuments;
  for (let i = 0; i < financialStatementData.length; i++) {
    const statementFileType =
      getData.body.data.advancedInfo.financialStatementDocuments.field[i].statementFileType;
    const statementUrl =
      getData.body.data.advancedInfo.financialStatementDocuments.field[i].statementUrl;
    const statementFileAt =
      getData.body.data.advancedInfo.financialStatementDocuments.field[i].statementFileAt;
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
      getData.body.data.advancedInfo.eStatementDocuments.field[i].statementFileType;
    const statementUrl = getData.body.data.advancedInfo.eStatementDocuments.field[i].statementUrl;
    const statementFileAt =
      getData.body.data.advancedInfo.eStatementDocuments.field[i].statementFileAt;
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
  const dataFinancialStatement = getData.body.data.advancedInfo.financialStatementDocuments.field;
  const dataEStatement = getData.body.data.advancedInfo.eStatementDocuments.field;
  expect(dataFinancialStatement, 'data of financial statement information should be empty').to.be
    .empty;
  expect(dataEStatement, 'data of e-statement information should be empty').to.be.empty;
}

function assertSavedDataInLegacy (getData, bodyRequest) {
  const urlRekeningKoran = getData.bpd_cdoc_rekening_koran;
  const urlLaporanKeuangan = getData.bpd_cdoc_laporan_keuangan;
  expect(bodyRequest.financialStatementDocuments[0]).to.have.property(
    'statementUrl',
    urlLaporanKeuangan,
    `statement url should be ${bodyRequest.financialStatementDocuments[0].statementUrl}`
  );
  expect(bodyRequest.eStatementDocuments[0]).to.have.property(
    'statementUrl',
    urlRekeningKoran,
    `statement url should be ${bodyRequest.eStatementDocuments[0].statementUrl}`
  );
}

function assertNotSavedInLegacy (getData) {
  const urlRekeningKoran = getData.bpd_cdoc_rekening_koran;
  const urlLaporanKeuangan = getData.bpd_cdoc_laporan_keuangan;
  expect(urlRekeningKoran, 'Url Rekening Koran in legacy should be null').to.be.null;
  expect(urlLaporanKeuangan, 'Url Laporan Keuangan in legacy should be null').to.be.null;
}
