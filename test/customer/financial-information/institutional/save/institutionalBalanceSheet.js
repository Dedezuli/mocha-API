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

describe('Backoffice Balance Sheet Institutional', function () {
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
    it('Add institutional balance sheet should succeed #TC-585', async function () {
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
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      assertEqualBalanceSheet(balanceSheet, body);
    });

    it('Update institutional balance sheet should succeed #TC-586', async function () {
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
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      let balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        balanceSheetIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      balanceSheet.forEach((item) => {
        ids.balanceSheetIds.push(item.balanceSheetId);
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
      balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      assertEqualBalanceSheet(balanceSheet, updateBody);
    });

    it('Add institutional balance sheet should sync between new core and legacy #TC-587', async function () {
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
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      const bsData = await chai
        .request(apiSyncBaseUrl)
        .get('/bs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bs_migration_id]': insCustomerId
        });

      assertEqualBalanceSheet(balanceSheet, body);
      assertLegacyDataSync(bsData.body, body);
    });

    it('Update institutional balance sheet should sync between new core and legacy #TC-588', async function () {
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
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      let balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        balanceSheetIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      balanceSheet.forEach((item) => {
        ids.balanceSheetIds.push(item.balanceSheetId);
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
      balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      const bsData = await chai
        .request(apiSyncBaseUrl)
        .get('/bs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bs_migration_id]': insCustomerId
        });

      assertEqualBalanceSheet(balanceSheet, updateBody);
      assertLegacyDataSync(bsData.body, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add institutional balance sheet using frontoffice user should fail #TC-589', async function () {
      const body = generateBody(insCustomerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': insAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.code).to.eql(401);
    });

    it('Add institutional balance sheet should not save data to legacy if failed to sync #TC-590', async function () {
      const body = generateBody(insCustomerId);

      await db.changeEmailByUsername(insUserName);

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

      expect(res).to.have.status(400);

      const completingDataRes = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${insCustomerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        );
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      const bsData = await chai
        .request(apiSyncBaseUrl)
        .get('/bs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bs_migration_id]': insCustomerId
        });

      expect(balanceSheet).to.be.an('array').that.is.empty;
      expect(bsData.body).to.be.an('array').that.is.empty;
    });

    it('Update institutional balance sheet should not save data if failed to sync #TC-591', async function () {
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
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
      let balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
      const ids = {
        financialStatementIds: [],
        financialTrendIds: [],
        balanceSheetIds: [],
        financialRatioIds: []
      };

      financialStatement.forEach((item) => {
        ids.financialStatementIds.push(item.financialStatementId);
      });

      financialTrend.forEach((item) => {
        ids.financialTrendIds.push(item.financialTrendId);
      });

      balanceSheet.forEach((item) => {
        ids.balanceSheetIds.push(item.balanceSheetId);
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
      balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;

      const bsData = await chai
        .request(apiSyncBaseUrl)
        .get('/bs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bs_migration_id]': insCustomerId
        });

      assertNotEqualBalanceSheet(balanceSheet, updateBody);
      assertLegacyDataNotSync(bsData.body, updateBody);
    });
  });
});

function generateBody (customerId, ids) {
  let financialStatementIds;
  let financialTrendIds;
  let balanceSheetIds;
  let financialRatioIds;

  if (ids && ids.financialStatementIds) financialStatementIds = ids.financialStatementIds;
  if (ids && ids.financialTrendIds) financialTrendIds = ids.financialTrendIds;
  if (ids && ids.balanceSheetIds) balanceSheetIds = ids.balanceSheetIds;
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
        yearTo: 1,
        accReceive: parseInt(help.randomInteger(10)),
        investory: parseInt(help.randomInteger(10)),
        accPayable: parseInt(help.randomInteger(10)),
        bankDebt: parseInt(help.randomInteger(10)),
        currentAssets: parseInt(help.randomInteger(10)),
        currentLiabilities: parseInt(help.randomInteger(10)),
        totalLiabilities: parseInt(help.randomInteger(10)),
        equity: parseInt(help.randomInteger(10))
      },
      {
        balanceSheetId: '',
        yearTo: 2,
        accReceive: parseInt(help.randomInteger(10)),
        investory: parseInt(help.randomInteger(10)),
        accPayable: parseInt(help.randomInteger(10)),
        bankDebt: parseInt(help.randomInteger(10)),
        currentAssets: parseInt(help.randomInteger(10)),
        currentLiabilities: parseInt(help.randomInteger(10)),
        totalLiabilities: parseInt(help.randomInteger(10)),
        equity: parseInt(help.randomInteger(10))
      },
      {
        balanceSheetId: '',
        yearTo: 3,
        accReceive: parseInt(help.randomInteger(10)),
        investory: parseInt(help.randomInteger(10)),
        accPayable: parseInt(help.randomInteger(10)),
        bankDebt: parseInt(help.randomInteger(10)),
        currentAssets: parseInt(help.randomInteger(10)),
        currentLiabilities: parseInt(help.randomInteger(10)),
        totalLiabilities: parseInt(help.randomInteger(10)),
        equity: parseInt(help.randomInteger(10))
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

  if (balanceSheetIds) {
    for (let i = 0; i < 3; i++) {
      body.balanceSheet[i].balanceSheetId = balanceSheetIds[i];
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

    body.financialRatio[i].ardoh =
      (body.balanceSheet[i].accReceive / body.financialStatementDetail[i].sales) * 365;

    body.financialRatio[i].invdoh =
      (body.balanceSheet[i].investory / body.financialStatementDetail[i].cogs) * 365;

    body.financialRatio[i].apdoh =
      (body.balanceSheet[i].accPayable / body.financialStatementDetail[i].cogs) * 365;

    body.financialRatio[i].cashCycle =
      body.financialRatio[i].ardoh + body.financialRatio[i].invdoh - body.financialRatio[i].apdoh;

    body.financialRatio[i].cashRatio =
      body.balanceSheet[i].currentAssets / body.balanceSheet[i].currentLiabilities;

    body.financialRatio[i].ebitda =
      body.financialStatementDetail[i].profitBeforeTax +
      body.financialStatementDetail[i].interestExpense +
      body.financialStatementDetail[i].depreciation;

    body.financialRatio[i].leverage =
      body.balanceSheet[i].totalLiabilities / body.balanceSheet[i].equity;

    body.financialRatio[i].wiNeeds =
      (body.financialRatio[i].cashCycle * body.financialStatementDetail[i].cogs) / 365;

    body.financialRatio[i].tie =
      body.financialStatementDetail[i].operatingProfit /
      body.financialStatementDetail[i].interestExpense;

    body.financialRatio[i].dscr =
      body.financialRatio[i].ebitda / body.financialStatementDetail[i].installment;
  }

  return body;
}

function assertEqualBalanceSheet (balanceSheet, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = balanceSheet[i].yearTo;
    expect(balanceSheet[i].accReceive, "New core account receivable doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].accReceive
    );
    expect(balanceSheet[i].investory, "New core inventory doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].investory
    );
    expect(balanceSheet[i].accPayable, "New core account payable doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].accPayable
    );
    expect(balanceSheet[i].bankDebt, "New core bank debt doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].bankDebt
    );
    expect(balanceSheet[i].currentAssets, "New core current assets doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].currentAssets
    );
    expect(
      balanceSheet[i].currentLiabilities,
      "New core current liabilities doesn't equal to input"
    ).to.eql(body.balanceSheet[yearTo - 1].currentLiabilities);
    expect(
      balanceSheet[i].totalLiabilities,
      "New core total liabilities doesn't equal to input"
    ).to.eql(body.balanceSheet[yearTo - 1].totalLiabilities);
    expect(balanceSheet[i].equity, "New core equity doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].equity
    );
  }
}

function assertNotEqualBalanceSheet (balanceSheet, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = balanceSheet[i].yearTo;
    expect(
      balanceSheet[i].accReceive,
      "New core account receivable shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].accReceive);
    expect(balanceSheet[i].investory, "New core inventory shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].investory
    );
    expect(
      balanceSheet[i].accPayable,
      "New core account payable shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].accPayable);
    expect(balanceSheet[i].bankDebt, "New core bank debt shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].bankDebt
    );
    expect(
      balanceSheet[i].currentAssets,
      "New core current assets shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].currentAssets);
    expect(
      balanceSheet[i].currentLiabilities,
      "New core current liabilities shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].currentLiabilities);
    expect(
      balanceSheet[i].totalLiabilities,
      "New core total liabilities shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].totalLiabilities);
    expect(balanceSheet[i].equity, "New core equity shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].equity
    );
  }
}

function assertLegacyDataSync (bsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = bsData[i].bs_period;
    expect(bsData[i].bs_acc_receiv, "Legacy bs_acc_receiv doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].accReceive
    );
    expect(bsData[i].bs_investory, "Legacy bs_investory doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].investory
    );
    expect(bsData[i].bs_acc_payable, "Legacy bs_acc_payable doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].accPayable
    );
    expect(bsData[i].bs_bank_debt, "Legacy bs_bank_debt doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].bankDebt
    );
    expect(bsData[i].bs_current_assets, "Legacy bs_current_assets doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].currentAssets
    );
    expect(
      bsData[i].bs_current_liabilites,
      "Legacy bs_current_liabilites doesn't equal to input"
    ).to.eql(body.balanceSheet[yearTo - 1].currentLiabilities);
    expect(
      bsData[i].bs_total_liabilites,
      "Legacy bs_total_liabilites doesn't equal to input"
    ).to.eql(body.balanceSheet[yearTo - 1].totalLiabilities);
    expect(bsData[i].bs_equity, "Legacy bs_equity doesn't equal to input").to.eql(
      body.balanceSheet[yearTo - 1].equity
    );
  }
}

function assertLegacyDataNotSync (bsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = bsData[i].bs_period;
    expect(bsData[i].bs_acc_receiv, "Legacy bs_acc_receiv shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].accReceive
    );
    expect(bsData[i].bs_investory, "Legacy bs_investory shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].investory
    );
    expect(
      bsData[i].bs_acc_payable,
      "Legacy bs_acc_payable shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].accPayable);
    expect(bsData[i].bs_bank_debt, "Legacy bs_bank_debt shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].bankDebt
    );
    expect(
      bsData[i].bs_current_assets,
      "Legacy bs_current_assets shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].currentAssets);
    expect(
      bsData[i].bs_current_liabilites,
      "Legacy bs_current_liabilites shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].currentLiabilities);
    expect(
      bsData[i].bs_total_liabilites,
      "Legacy bs_total_liabilites shouldn't be equal to input"
    ).to.not.eql(body.balanceSheet[yearTo - 1].totalLiabilities);
    expect(bsData[i].bs_equity, "Legacy bs_equity shouldn't be equal to input").to.not.eql(
      body.balanceSheet[yearTo - 1].equity
    );
  }
}
