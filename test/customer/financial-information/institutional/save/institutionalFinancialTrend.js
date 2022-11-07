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

describe('Backoffice Financial Trend Institutional', function () {
  const url = '/validate/customer/financial-information/institutional/save';
  const completingDataUrl = '/validate/customer/completing-data/backoffice/borrower';

  let insAccessToken;
  let insCustomerId;
  let insUserName;
  let boAccessToken;

  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  beforeEach(async function () {
    const insRegisterRes = await req.borrowerRegister(true, ['e-statement', 'financial-statement']);
    insAccessToken = insRegisterRes.accessToken;
    insCustomerId = insRegisterRes.customerId;
    insUserName = insRegisterRes.userName;
  });

  describe('#smoke', function () {
    it('Add institutional financial trend should succeed #TC-619', async function () {
      const body = generateBody(insCustomerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      assertEqualFinancialTrend(financialTrend, body);
    });

    it('Update institutional financial trend should succeed #TC-620', async function () {
      const addBody = generateBody(insCustomerId);

      await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );

      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      financialRatio.forEach((item) => {
        ids.financialRatioIds.push(item.financialRatioId);
      });

      const updateBody = generateBody(insCustomerId, ids);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;

      assertEqualFinancialTrend(financialTrend, updateBody);
    });

    it('Add institutional financial trend should sync between new core and legacy #TC-621', async function () {
      const body = generateBody(insCustomerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
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
          'filter[where][ft_migration_id]': insCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertEqualFinancialTrend(financialTrend, body);
      assertLegacyDataSync(ftData, body);
    });

    it('Update institutional financial trend should sync between new core and legacy #TC-622', async function () {
      const addBody = generateBody(insCustomerId);

      await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );

      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      financialRatio.forEach((item) => {
        ids.financialRatioIds.push(item.financialRatioId);
      });

      const updateBody = generateBody(insCustomerId, ids);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
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
          'filter[where][ft_migration_id]': insCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertEqualFinancialTrend(financialTrend, updateBody);
      assertLegacyDataSync(ftData, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add institutional financial trend using frontoffice user should fail #TC-623', async function () {
      const body = generateBody(insCustomerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': insAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.code).to.eql(401);
    });

    it('Add institutional financial trend should not save data to legacy if failed to sync #TC-624', async function () {
      const body = generateBody(insCustomerId);

      await db.changeEmailByUsername(insUserName);

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
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
          'filter[where][ft_migration_id]': insCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      expect(financialTrend).to.be.an('array').that.is.empty;
      expect(ftData).to.be.an('array').that.is.empty;
    });

    it('Update institutional financial trend should not save data if failed to sync #TC-625', async function () {
      const addBody = generateBody(insCustomerId);

      await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(addBody);

      let completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );

      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      let financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      financialRatio.forEach((item) => {
        ids.financialRatioIds.push(item.financialRatioId);
      });

      const updateBody = generateBody(insCustomerId, ids);

      await db.changeEmailByUsername(insUserName);

      const updateStartTime = help.startTime();
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(url)
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
        .get(`${completingDataUrl}/${insCustomerId}`)
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
          'filter[where][ft_migration_id]': insCustomerId
        });
      const ftData = JSON.parse(ftRes.text);

      assertNotEqualFinancialTrend(financialTrend, updateBody);
      assertLegacyDataNotSync(ftData, updateBody);
    });
  });
});

function generateBody (customerId, ids) {
  let financialStatementIds;
  let financialTrendIds;
  let financialRatioIds;

  if (ids && ids.financialStatementIds) financialStatementIds = ids.financialStatementIds;
  if (ids && ids.financialTrendIds) financialTrendIds = ids.financialTrendIds;
  if (ids && ids.financialRatioIds) financialRatioIds = ids.financialRatioIds;

  const today = new Date();
  const year = today.getFullYear();
  const dateSeries = [];
  for (let i = 2; i >= 0; i--) {
    today.setFullYear(year - i);
    dateSeries.push(help.formatDate(today));
  }

  const inputList = [];
  for (let i = 0; i < 3; i++) {
    const sales = parseInt(help.randomInteger(10));
    const cogs = parseInt(help.randomInteger(10));
    const grossProfit = sales - cogs;
    const sga = parseInt(help.randomInteger(10));
    const depreciation = parseInt(help.randomInteger(10));
    const operatingProfit = grossProfit - sga - depreciation;
    const interestExpense = parseInt(help.randomInteger(10));
    const otherIncome = parseInt(help.randomInteger(10));
    const otherExpense = parseInt(help.randomInteger(10));
    const profitBeforeTax = operatingProfit - interestExpense + otherIncome - otherExpense;
    const tax = parseInt(help.randomInteger(10));
    const profitAfterTax = profitBeforeTax - tax;
    const installment = parseInt(help.randomInteger(10));

    inputList.push({
      sales: sales,
      cogs: cogs,
      grossProfit: grossProfit,
      grossPercentage: (grossProfit / sales) * 100,
      sga: sga,
      depreciation: depreciation,
      operatingProfit: operatingProfit,
      interestExpense: interestExpense,
      otherIncome: otherIncome,
      otherExpense: otherExpense,
      profitBeforeTax: profitBeforeTax,
      tax: tax,
      profitAfterTax: profitAfterTax,
      installment: installment
    });
  }

  const body = {
    customerId: customerId,
    averageMonthlySales: '',
    profitMargin: '',
    financialStatement: [],
    bankStatement: [],
    financialStatementDetail: [
      {
        financialStatementId: '',
        fiscalYear: dateSeries[0],
        month: dateSeries[0],
        year: dateSeries[0],
        sales: inputList[0].sales,
        cogs: inputList[0].cogs,
        grossProfit: inputList[0].sales - inputList[0].cogs,
        grossPercentage: inputList[0].grossPercentage,
        sga: inputList[0].sga,
        depreciation: inputList[0].depreciation,
        operatingProfit: inputList[0].operatingProfit,
        interestExpense: inputList[0].interestExpense,
        otherIncome: inputList[0].otherIncome,
        otherExpense: inputList[0].otherExpense,
        profitBeforeTax: inputList[0].profitBeforeTax,
        tax: inputList[0].tax,
        profitAfterTax: inputList[0].profitAfterTax,
        installment: inputList[0].installment,
        yearTo: 1
      },
      {
        financialStatementId: '',
        fiscalYear: dateSeries[1],
        month: dateSeries[1],
        year: dateSeries[1],
        sales: inputList[1].sales,
        cogs: inputList[1].cogs,
        grossProfit: inputList[1].sales - inputList[1].cogs,
        grossPercentage: inputList[1].grossPercentage,
        sga: inputList[1].sga,
        depreciation: inputList[1].depreciation,
        operatingProfit: inputList[1].operatingProfit,
        interestExpense: inputList[1].interestExpense,
        otherIncome: inputList[1].otherIncome,
        otherExpense: inputList[1].otherExpense,
        profitBeforeTax: inputList[1].profitBeforeTax,
        tax: inputList[1].tax,
        profitAfterTax: inputList[1].profitAfterTax,
        installment: inputList[1].installment,
        yearTo: 2
      },
      {
        financialStatementId: '',
        fiscalYear: dateSeries[2],
        month: dateSeries[2],
        year: dateSeries[2],
        sales: inputList[2].sales,
        cogs: inputList[2].cogs,
        grossProfit: inputList[2].sales - inputList[2].cogs,
        grossPercentage: inputList[2].grossPercentage,
        sga: inputList[2].sga,
        depreciation: inputList[2].depreciation,
        operatingProfit: inputList[2].operatingProfit,
        interestExpense: inputList[2].interestExpense,
        otherIncome: inputList[2].otherIncome,
        otherExpense: inputList[2].otherExpense,
        profitBeforeTax: inputList[2].profitBeforeTax,
        tax: inputList[2].tax,
        profitAfterTax: inputList[2].profitAfterTax,
        installment: inputList[2].installment,
        yearTo: 3
      }
    ],
    financialTrend: [
      {
        financialTrendId: '',
        trendPeriod: '1 to 2',
        title: 'Year One to Two',
        sales: '',
        cogs: '',
        grossProfit: '',
        sga: '',
        operatingProfit: '',
        profitBeforeTax: '',
        profitAfterTax: ''
      },
      {
        financialTrendId: '',
        trendPeriod: '2 to 3',
        title: 'Year Two to Three',
        sales: '',
        cogs: '',
        grossProfit: '',
        sga: '',
        operatingProfit: '',
        profitBeforeTax: '',
        profitAfterTax: ''
      }
    ],
    financialRatio: [
      {
        financialRatioId: '',
        yearTo: '',
        gpm: '',
        npm: '',
        ardoh: '',
        invdoh: '',
        apdoh: '',
        cashCycle: '',
        cashRatio: '',
        ebitda: '',
        leverage: '',
        wiNeeds: '',
        tie: '',
        dscr: ''
      },
      {
        financialRatioId: '',
        yearTo: '',
        gpm: '',
        npm: '',
        ardoh: '',
        invdoh: '',
        apdoh: '',
        cashCycle: '',
        cashRatio: '',
        ebitda: '',
        leverage: '',
        wiNeeds: '',
        tie: '',
        dscr: ''
      },
      {
        financialRatioId: '',
        yearTo: '',
        gpm: '',
        npm: '',
        ardoh: '',
        invdoh: '',
        apdoh: '',
        cashCycle: '',
        cashRatio: '',
        ebitda: '',
        leverage: '',
        wiNeeds: '',
        tie: '',
        dscr: ''
      }
    ],
    balanceSheet: [
      {
        balanceSheetId: '',
        yearTo: '',
        accReceive: '',
        investory: '',
        accPayable: '',
        bankDebt: '',
        currentAssets: '',
        currentLiabilities: '',
        totalLiabilities: '',
        equity: ''
      },
      {
        balanceSheetId: '',
        yearTo: '',
        accReceive: '',
        investory: '',
        accPayable: '',
        bankDebt: '',
        currentAssets: '',
        currentLiabilities: '',
        totalLiabilities: '',
        equity: ''
      },
      {
        balanceSheetId: '',
        yearTo: '',
        accReceive: '',
        investory: '',
        accPayable: '',
        bankDebt: '',
        currentAssets: '',
        currentLiabilities: '',
        totalLiabilities: '',
        equity: ''
      }
    ],
    salesTransaction: [
      {
        salesTransactionId: '',
        amount: '',
        transaction: '',
        dates: '',
        month: '',
        year: '',
        isDelete: false
      }
    ],
    customerNotes: {
      customerNotesId: '',
      name: 'JANGAN DIHAPUS BO',
      customerType: '2',
      remarks: ''
    }
  };

  if (financialStatementIds) {
    for (let i = 0; i < 3; i++) {
      body.financialStatementDetail[i].financialStatementId = financialStatementIds[i];
    }
  }

  if (financialTrendIds) {
    for (let i = 0; i < 2; i++) {
      body.financialTrend[i].financialTrendId = financialTrendIds[i];
    }
  }

  body.financialTrend[0].sales =
    ((body.financialStatementDetail[1].sales - body.financialStatementDetail[0].sales) /
      body.financialStatementDetail[0].sales) *
    100;
  body.financialTrend[1].sales =
    ((body.financialStatementDetail[2].sales - body.financialStatementDetail[1].sales) /
      body.financialStatementDetail[1].sales) *
    100;

  body.financialTrend[0].cogs =
    ((body.financialStatementDetail[1].cogs - body.financialStatementDetail[0].cogs) /
      body.financialStatementDetail[0].cogs) *
    100;
  body.financialTrend[1].cogs =
    ((body.financialStatementDetail[2].cogs - body.financialStatementDetail[1].cogs) /
      body.financialStatementDetail[1].cogs) *
    100;

  body.financialTrend[0].grossProfit =
    ((body.financialStatementDetail[1].grossProfit - body.financialStatementDetail[0].grossProfit) /
      body.financialStatementDetail[0].grossProfit) *
    100;
  body.financialTrend[1].grossProfit =
    ((body.financialStatementDetail[2].grossProfit - body.financialStatementDetail[1].grossProfit) /
      body.financialStatementDetail[1].grossProfit) *
    100;

  body.financialTrend[0].sga =
    ((body.financialStatementDetail[1].sga - body.financialStatementDetail[0].sga) /
      body.financialStatementDetail[0].sga) *
    100;
  body.financialTrend[1].sga =
    ((body.financialStatementDetail[2].sga - body.financialStatementDetail[1].sga) /
      body.financialStatementDetail[1].sga) *
    100;

  body.financialTrend[0].operatingProfit =
    ((body.financialStatementDetail[1].operatingProfit -
      body.financialStatementDetail[0].operatingProfit) /
      body.financialStatementDetail[0].operatingProfit) *
    100;
  body.financialTrend[1].operatingProfit =
    ((body.financialStatementDetail[2].operatingProfit -
      body.financialStatementDetail[1].operatingProfit) /
      body.financialStatementDetail[1].operatingProfit) *
    100;

  body.financialTrend[0].profitBeforeTax =
    ((body.financialStatementDetail[1].profitBeforeTax -
      body.financialStatementDetail[0].profitBeforeTax) /
      body.financialStatementDetail[0].profitBeforeTax) *
    100;
  body.financialTrend[1].profitBeforeTax =
    ((body.financialStatementDetail[2].profitBeforeTax -
      body.financialStatementDetail[1].profitBeforeTax) /
      body.financialStatementDetail[1].profitBeforeTax) *
    100;

  body.financialTrend[0].profitAfterTax =
    ((body.financialStatementDetail[1].profitAfterTax -
      body.financialStatementDetail[0].profitAfterTax) /
      body.financialStatementDetail[0].profitAfterTax) *
    100;
  body.financialTrend[1].profitAfterTax =
    ((body.financialStatementDetail[2].profitAfterTax -
      body.financialStatementDetail[1].profitAfterTax) /
      body.financialStatementDetail[1].profitAfterTax) *
    100;

  if (financialRatioIds) {
    for (let i = 0; i < 3; i++) {
      body.financialRatio[i].financialRatioId = financialRatioIds[i];
    }
  }

  for (let i = 0; i < 3; i++) {
    body.financialRatio[i].gpm =
      (body.financialStatementDetail[i].grossProfit / body.financialStatementDetail[i].sales) * 100;
    body.financialRatio[i].npm =
      (body.financialStatementDetail[i].profitAfterTax / body.financialStatementDetail[i].sales) *
      100;
    body.financialRatio[i].ebitda =
      body.financialStatementDetail[i].profitBeforeTax +
      body.financialStatementDetail[i].interestExpense +
      body.financialStatementDetail[i].depreciation;
    body.financialRatio[i].tie =
      body.financialStatementDetail[i].operatingProfit /
      body.financialStatementDetail[i].interestExpense;
    body.financialRatio[i].dscr =
      body.financialRatio[i].ebitda / body.financialStatementDetail[i].installment;
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
    expect(financialTrend[i].sga, "New core sga doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].sga)
    );
    expect(
      financialTrend[i].operatingProfit,
      "New core operating profit doesn't equal to input"
    ).to.eql(float(body.financialTrend[periodIter].operatingProfit));
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
    expect(financialTrend[i].sga, "New core sga shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].sga)
    );
    expect(
      financialTrend[i].operatingProfit,
      "New core operating profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].operatingProfit));
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
    expect(ftData[i].ft_sga, "Legacy ft_sga doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].sga)
    );
    expect(
      ftData[i].ft_operating_profit,
      "Legacy ft_operating_profit doesn't equal to input"
    ).to.eql(float(body.financialTrend[periodIter].operatingProfit));
    expect(ftData[i].ft_profit_before_tax, "Legacy ft_gross_profit doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].profitBeforeTax)
    );
    expect(ftData[i].ft_profit_after_tax, "Legacy ft_gross_profit doesn't equal to input").to.eql(
      float(body.financialTrend[periodIter].profitAfterTax)
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
    expect(ftData[i].ft_sga, "Legacy ft_sga shouldn't be equal to input").to.not.eql(
      float(body.financialTrend[periodIter].sga)
    );
    expect(
      ftData[i].ft_operating_profit,
      "Legacy ft_operating_profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].operatingProfit));
    expect(
      ftData[i].ft_profit_before_tax,
      "Legacy ft_gross_profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].profitBeforeTax));
    expect(
      ftData[i].ft_profit_after_tax,
      "Legacy ft_gross_profit shouldn't be equal to input"
    ).to.not.eql(float(body.financialTrend[periodIter].profitAfterTax));
  }
}
