const help = require('@lib/helper');
const req = require('@lib/request');
const db = require('@lib/dbFunction');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Backoffice Financial Statement Individual', function () {
  const url = '/validate/customer/financial-information/save-all';
  const completingDataUrl = '/validate/customer/completing-data/backoffice/borrower';

  let indAccessToken;
  let indCustomerId;
  let indUserName;
  let boAccessToken;

  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  beforeEach(async function () {
    const indRegisterRes = await req.borrowerRegister(false, [
      'e-statement',
      'financial-statement'
    ]);
    indAccessToken = indRegisterRes.accessToken;
    indCustomerId = indRegisterRes.customerId;
    indUserName = indRegisterRes.userName;
  });

  describe('#smoke', function () {
    it('Add individual financial statement should succeed #TC-639', async function () {
      const body = generateBody();

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      assertEqualFinancialStatement(financialStatement, body);
    });

    it('Update individual financial statement should succeed #TC-640', async function () {
      const addBody = generateBody();

      await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );

      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialStatementIds = [];
      const financialTrendIds = [];

      financialStatement.forEach((item) => {
        financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        financialTrendIds.push(item.financialTrendId);
      });

      const updateBody = generateBody(financialStatementIds, financialTrendIds);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(updateBody);
      const updateResponseTime = help.responseTime(updateStartTime);

      report.setPayload(this, updateRes, updateResponseTime);

      completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      assertEqualFinancialStatement(financialStatement, updateBody);
    });

    it('Add individual financial statement should sync between new core and legacy #TC-641', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': indCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertEqualFinancialStatement(financialStatement, body);
      assertLegacyDataSync(fsData, body);
    });

    it('Update individual financial statement should sync between new core and legacy #TC-642', async function () {
      const addBody = generateBody();

      await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialStatementIds = [];
      const financialTrendIds = [];

      financialStatement.forEach((item) => {
        financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        financialTrendIds.push(item.financialTrendId);
      });

      const updateBody = generateBody(financialStatementIds, financialTrendIds);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(updateBody);
      const updateResponseTime = help.responseTime(updateStartTime);

      report.setPayload(this, updateRes, updateResponseTime);

      completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': indCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertEqualFinancialStatement(financialStatement, updateBody);
      assertLegacyDataSync(fsData, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add individual financial statement using frontoffice user should fail #TC-643', async function () {
      const body = generateBody();

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': indAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.code).to.eql(401);
    });

    it('Add individual financial statement should not save data to legacy if failed to sync #TC-644', async function () {
      const body = generateBody();

      await db.changeEmailByUsername(indUserName);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);

      const completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': indCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      expect(financialStatement).to.be.an('array').that.is.empty;
      expect(fsData).to.be.an('array').that.is.empty;
    });

    it('Update individual financial statement should not save data if failed to sync #TC-645', async function () {
      const addBody = generateBody();

      await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialStatementIds = [];
      const financialTrendIds = [];

      financialStatement.forEach((item) => {
        financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        financialTrendIds.push(item.financialTrendId);
      });

      await db.changeEmailByUsername(indUserName);

      const updateBody = generateBody(financialStatementIds, financialTrendIds);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(updateBody);
      const updateResponseTime = help.responseTime(updateStartTime);

      report.setPayload(this, updateRes, updateResponseTime);

      expect(updateRes).to.have.status(400);

      completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': indCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertNotEqualFinancialStatement(financialStatement, updateBody);
      assertLegacyDataNotSync(fsData, updateBody);
    });
  });
});

function generateBody (financialStatementIds, financialTrendIds) {
  const today = new Date();
  const year = today.getFullYear();
  const dateSeries = [];
  for (let i = 2; i >= 0; i--) {
    today.setFullYear(year - i);
    dateSeries.push(help.formatDate(today));
  }

  const salesCogsList = [];
  for (let i = 0; i < 3; i++) {
    salesCogsList.push({
      sales: parseInt(help.randomInteger(10)),
      cogs: parseInt(help.randomInteger(10))
    });
  }

  const body = {
    eStatementDocuments: [],
    salesTransactionData: [],
    financialStatementDocuments: [],
    financialStatement: [
      {
        financialStatementId: '',
        yearTo: 1,
        fiscalYear: dateSeries[0],
        sales: salesCogsList[0].sales,
        cogs: salesCogsList[0].cogs,
        grossProfit: salesCogsList[0].sales - salesCogsList[0].cogs,
        installment: parseInt(help.randomInteger(10))
      },
      {
        financialStatementId: '',
        yearTo: 2,
        fiscalYear: dateSeries[1],
        sales: salesCogsList[1].sales,
        cogs: salesCogsList[1].cogs,
        grossProfit: salesCogsList[1].sales - salesCogsList[1].cogs,
        installment: parseInt(help.randomInteger(10))
      },
      {
        financialStatementId: '',
        yearTo: 3,
        fiscalYear: dateSeries[2],
        sales: salesCogsList[2].sales,
        cogs: salesCogsList[2].cogs,
        grossProfit: salesCogsList[2].sales - salesCogsList[2].cogs,
        installment: parseInt(help.randomInteger(10))
      }
    ],
    financialTrend: [
      {
        financialTrendId: null,
        trendPeriod: '1 to 2',
        title: 'Year One to Two',
        period: '',
        sales: '',
        cogs: '',
        grossProfit: '',
        installment: ''
      },
      {
        financialTrendId: null,
        trendPeriod: '2 to 3',
        title: 'Year Two to Three',
        period: '',
        sales: '',
        cogs: '',
        grossProfit: '',
        installment: ''
      }
    ],
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

  body.financialTrend[0].sales =
    ((body.financialStatement[1].sales - body.financialStatement[0].sales) /
      body.financialStatement[0].sales) *
    100;
  body.financialTrend[1].sales =
    ((body.financialStatement[2].sales - body.financialStatement[1].sales) /
      body.financialStatement[1].sales) *
    100;

  body.financialTrend[0].cogs =
    ((body.financialStatement[1].cogs - body.financialStatement[0].cogs) /
      body.financialStatement[0].cogs) *
    100;
  body.financialTrend[1].cogs =
    ((body.financialStatement[2].cogs - body.financialStatement[1].cogs) /
      body.financialStatement[1].cogs) *
    100;

  body.financialTrend[0].grossProfit =
    ((body.financialStatement[1].grossProfit - body.financialStatement[0].grossProfit) /
      body.financialStatement[0].grossProfit) *
    100;
  body.financialTrend[1].grossProfit =
    ((body.financialStatement[2].grossProfit - body.financialStatement[1].grossProfit) /
      body.financialStatement[1].grossProfit) *
    100;

  body.financialTrend[0].installment =
    ((body.financialStatement[1].installment - body.financialStatement[0].installment) /
      body.financialStatement[0].installment) *
    100;
  body.financialTrend[1].installment =
    ((body.financialStatement[2].installment - body.financialStatement[1].installment) /
      body.financialStatement[1].installment) *
    100;

  if (financialStatementIds) {
    for (let i = 0; i < 3; i++) {
      body.financialStatement[i].financialStatementId = financialStatementIds[i];
      body.financialStatement[i].sga = null;
      body.financialStatement[i].depreciation = null;
      body.financialStatement[i].operatingProfit = null;
      body.financialStatement[i].interestExpense = null;
      body.financialStatement[i].otherIncome = null;
      body.financialStatement[i].otherExpense = null;
      body.financialStatement[i].profitBeforeTax = null;
      body.financialStatement[i].tax = null;
      body.financialStatement[i].profitAfterTax = null;
    }
  }

  if (financialTrendIds) {
    for (let i = 0; i < 2; i++) {
      body.financialTrend[i].financialTrendId = financialTrendIds[i];
    }
  }

  return body;
}

function assertEqualFinancialStatement (financialStatement, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialStatement[i].yearTo;
    expect(financialStatement[i].yearTo, "New core year to doesn't equal to input").to.eql(
      body.financialStatement[yearTo - 1].yearTo
    );
    expect(financialStatement[i].fiscalYear, "New core fiscal year doesn't equal to input").to.eql(
      body.financialStatement[yearTo - 1].fiscalYear
    );
    expect(financialStatement[i].sales, "New core sales doesn't equal to input").to.eql(
      parseInt(body.financialStatement[yearTo - 1].sales)
    );
    expect(financialStatement[i].cogs, "New core cogs doesn't equal to input").to.eql(
      parseInt(body.financialStatement[yearTo - 1].cogs)
    );
    expect(
      financialStatement[i].grossProfit,
      "New core gross profit doesn't equal to input"
    ).to.eql(parseInt(body.financialStatement[yearTo - 1].grossProfit));
    expect(financialStatement[i].installment, "New core installment doesn't equal to input").to.eql(
      parseInt(body.financialStatement[yearTo - 1].installment)
    );
  }
}

function assertNotEqualFinancialStatement (financialStatement, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialStatement[i].yearTo;
    expect(financialStatement[i].yearTo, "New core year to doesn't equal to input").to.eql(
      body.financialStatement[yearTo - 1].yearTo
    );
    expect(financialStatement[i].sales, "New core sales shouldn't be equal to input").to.not.eql(
      parseInt(body.financialStatement[yearTo - 1].sales)
    );
    expect(financialStatement[i].cogs, "New core cogs shouldn't be equal to input").to.not.eql(
      parseInt(body.financialStatement[yearTo - 1].cogs)
    );
    expect(
      financialStatement[i].grossProfit,
      "New core gross profit shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatement[yearTo - 1].grossProfit));
    expect(
      financialStatement[i].installment,
      "New core installment shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatement[yearTo - 1].installment));
  }
}

function assertLegacyDataSync (fsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = fsData[i].fs_year_to;
    expect(fsData[i].fs_year_to, "Legacy fs_year_to doesn't equal to new core fs_year_to").to.eql(
      parseInt(body.financialStatement[yearTo - 1].yearTo)
    );
    expect(
      fsData[i].fs_fiscal_year.replace(/T(.*)/, ''),
      "Legacy fs_fiscal_year doesn't equal to new core fs_fiscal_year"
    ).to.eql(body.financialStatement[yearTo - 1].fiscalYear);
    expect(fsData[i].fs_sales, "Legacy fs_sales doesn't equal to new core fs_sales").to.eql(
      parseInt(body.financialStatement[yearTo - 1].sales)
    );
    expect(fsData[i].fs_cogs, "Legacy fs_cogs doesn't equal to new core fs_cogs").to.eql(
      parseInt(body.financialStatement[yearTo - 1].cogs)
    );
    expect(
      fsData[i].fs_gross_profit,
      "Legacy fs_gross_profit doesn't equal to new core fs_gross_profit"
    ).to.eql(parseInt(body.financialStatement[yearTo - 1].grossProfit));
    expect(fsData[i].fs_efi, "Legacy fs_efi doesn't equal to new core fs_efi").to.eql(
      parseInt(body.financialStatement[yearTo - 1].installment)
    );
  }
}

function assertLegacyDataNotSync (fsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = fsData[i].fs_year_to;
    expect(fsData[i].fs_year_to, "Legacy fs_year_to doesn't equal to new core fs_year_to").to.eql(
      parseInt(body.financialStatement[yearTo - 1].yearTo)
    );
    expect(
      fsData[i].fs_sales,
      "Legacy fs_sales shouldn't be equal to new core fs_sales"
    ).to.not.eql(parseInt(body.financialStatement[yearTo - 1].sales));
    expect(fsData[i].fs_cogs, "Legacy fs_cogs shouldn't be equal to new core fs_cogs").to.not.eql(
      parseInt(body.financialStatement[yearTo - 1].cogs)
    );
    expect(
      fsData[i].fs_gross_profit,
      "Legacy fs_gross_profit shouldn't be equal to new core fs_gross_profit"
    ).to.not.eql(parseInt(body.financialStatement[yearTo - 1].grossProfit));
    expect(fsData[i].fs_efi, "Legacy fs_efi shouldn't be equal to new core fs_efi").to.not.eql(
      parseInt(body.financialStatement[yearTo - 1].installment)
    );
  }
}
