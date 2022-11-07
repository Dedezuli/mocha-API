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

describe('Backoffice Financial Trend Individual', function () {
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
    it('Add individual financial trend should succeed #TC-646', async function () {
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
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      assertEqualFinancialTrend(financialTrend, body);
    });

    it('Update individual financial trend should succeed #TC-647', async function () {
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

      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      assertEqualFinancialTrend(financialTrend, updateBody);
    });

    it('Add individual financial trend should sync between new core and legacy #TC-648', async function () {
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
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      const ftRes = await chai
        .request(apiSyncBaseUrl)
        .get('/ft')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][ft_migration_id]': indCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertEqualFinancialTrend(financialTrend, body);
      assertLegacyDataSync(ftData, body);
    });

    it('Update individual financial trend should sync between new core and legacy #TC-649', async function () {
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

      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      const ftRes = await chai
        .request(apiSyncBaseUrl)
        .get('/ft')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][ft_migration_id]': indCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertEqualFinancialTrend(financialTrend, updateBody);
      assertLegacyDataSync(ftData, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add individual financial trend using frontoffice user should fail #TC-650', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': indAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.code).to.eql(401);
    });

    it('Add individual financial trend should not save data to legacy if failed to sync #TC-651', async function () {
      const body = generateBody();

      await db.changeEmailByUsername(indUserName);

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

      expect(res).to.have.status(400);

      const completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${indCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      const ftRes = await chai
        .request(apiSyncBaseUrl)
        .get('/ft')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][ft_migration_id]': indCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      expect(financialTrend).to.be.an('array').that.is.empty;
      expect(ftData).to.be.an('array').that.is.empty;
    });

    it('Update individual financial trend should not save data if failed to sync #TC-652', async function () {
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
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      const ftRes = await chai
        .request(apiSyncBaseUrl)
        .get('/ft')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][ft_migration_id]': indCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertNotEqualFinancialTrend(financialTrend, updateBody);
      assertLegacyDataNotSync(ftData, updateBody);
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

function float (floatNum, decimalPlaces = 2) {
  return parseFloat(floatNum.toFixed(decimalPlaces));
}

function assertEqualFinancialTrend (financialTrend, body) {
  for (let i = 0; i < 2; i++) {
    const periodIter = financialTrend[i].trendPeriod === '1 to 2' ? 0 : 1;
    expect(financialTrend[i].sales, "New core sales doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].sales)
    );
    expect(financialTrend[i].cogs, "New core cogs doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].cogs)
    );
    expect(financialTrend[i].grossProfit, "New core gross profit doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].grossProfit)
    );
    expect(financialTrend[i].installment, "New core installment doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].installment)
    );
  }
}

function assertNotEqualFinancialTrend (financialTrend, body) {
  for (let i = 0; i < 2; i++) {
    const periodIter = financialTrend[i].trendPeriod === '1 to 2' ? 0 : 1;
    expect(financialTrend[i].sales, "New core sales shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].sales)
    );
    expect(financialTrend[i].cogs, "New core cogs shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].cogs)
    );
    expect(
      financialTrend[i].grossProfit,
      "New core gross profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].grossProfit));
    expect(
      financialTrend[i].installment,
      "New core installment shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].installment));
  }
}

function assertLegacyDataSync (ftData, body) {
  for (let i = 0; i < 2; i++) {
    const periodIter = ftData[i].ft_period === '1' ? 0 : 1;
    expect(ftData[i].ft_sales, "Legacy ft_sales doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].sales)
    );
    expect(ftData[i].ft_cogs, "Legacy ft_cogs doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].cogs)
    );
    expect(ftData[i].ft_gross_profit, "Legacy ft_gross_profit doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].grossProfit)
    );
    expect(ftData[i].ft_efi, "Legacy ft_efi doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].installment)
    );
  }
}

function assertLegacyDataNotSync (ftData, body) {
  for (let i = 0; i < 2; i++) {
    const periodIter = ftData[i].ft_period === '1' ? 0 : 1;
    expect(ftData[i].ft_sales, "Legacy ft_sales shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].sales)
    );
    expect(ftData[i].ft_cogs, "Legacy ft_cogs shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].cogs)
    );
    expect(
      ftData[i].ft_gross_profit,
      "Legacy ft_gross_profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].grossProfit));
    expect(ftData[i].ft_efi, "Legacy ft_efi shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].installment)
    );
  }
}
