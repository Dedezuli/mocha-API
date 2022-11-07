const help = require('@lib/helper');
const req = require('@lib/request');
const db = require('@lib/dbFunction');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const { Random } = require('random-js');

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Backoffice Financial Ratio Institutional', function () {
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
    it('Add institutional financial ratio should succeed #TC-605', async function () {
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
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      assertEqualFinancialRatio(financialRatio, body);
    });

    it('Update institutional financial ratio should succeed #TC-606', async function () {
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
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      let financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
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
      financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      assertEqualFinancialRatio(financialRatio, updateBody);
    });

    it('Add institutional financial ratio should sync between new core and legacy #TC-607', async function () {
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
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      const frData = await chai
        .request(apiSyncBaseUrl)
        .get('/fr')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fr_migration_id]': insCustomerId
        });

      assertEqualFinancialRatio(financialRatio, body);
      assertLegacyDataSync(frData.body, body);
    });

    it('Update institutional financial ratio should sync between new core and legacy #TC-608', async function () {
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
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      let financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
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
      financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      const frData = await chai
        .request(apiSyncBaseUrl)
        .get('/fr')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fr_migration_id]': insCustomerId
        });

      assertEqualFinancialRatio(financialRatio, updateBody);
      assertLegacyDataSync(frData.body, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add institutional financial ratio using frontoffice user should fail #TC-609', async function () {
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

    it('Add institutional financial ratio should not save data to legacy if failed to sync #TC-610', async function () {
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
      const financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      const frData = await chai
        .request(apiSyncBaseUrl)
        .get('/fr')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fr_migration_id]': insCustomerId
        });

      expect(financialRatio).to.be.an('array').that.is.empty;
      expect(frData.body).to.be.an('array').that.is.empty;
    });

    it('Update institutional financial ratio should not save data if failed to sync #TC-611', async function () {
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
      const balanceSheet = completingDataRes.body.data.advancedInfo.balanceSheet.field;
      let financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;
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
      financialRatio = completingDataRes.body.data.advancedInfo.financialRatio.field;

      const frData = await chai
        .request(apiSyncBaseUrl)
        .get('/fr')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fr_migration_id]': insCustomerId
        });

      assertNotEqualFinancialRatio(financialRatio, updateBody);
      assertLegacyDataNotSync(frData.body, updateBody);
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
    today.setMonth(new Random().integer(0, 11) + 1);
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
        yearTo: 1,
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
        yearTo: 2,
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
        yearTo: 3,
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

  if (balanceSheetIds) {
    for (let i = 0; i < 3; i++) {
      body.balanceSheet[i].balanceSheetId = balanceSheetIds[i];
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
    body.financialRatio[i].gpm = float(
      (body.financialStatementDetail[i].grossProfit / body.financialStatementDetail[i].sales) * 100
    );

    body.financialRatio[i].npm = float(
      (body.financialStatementDetail[i].profitAfterTax / body.financialStatementDetail[i].sales) *
        100
    );

    const fiscalYear = body.financialStatementDetail[i].fiscalYear;
    const months = fiscalYear.split('-')[1];

    if (months === '12') {
      body.financialRatio[i].ardoh = float(
        (body.balanceSheet[i].accReceive / body.financialStatementDetail[i].sales) * 365
      );
    } else {
      body.financialRatio[i].ardoh = float(
        (body.balanceSheet[i].accReceive / body.financialStatementDetail[i].sales) * 30 * months
      );
    }

    if (months === '12') {
      body.financialRatio[i].invdoh = float(
        (body.balanceSheet[i].investory / body.financialStatementDetail[i].cogs) * 365
      );
    } else {
      body.financialRatio[i].invdoh = float(
        (body.balanceSheet[i].investory / body.financialStatementDetail[i].cogs) * 30 * months
      );
    }

    if (months === '12') {
      body.financialRatio[i].apdoh = float(
        (body.balanceSheet[i].accPayable / body.financialStatementDetail[i].cogs) * 365
      );
    } else {
      body.financialRatio[i].apdoh = float(
        (body.balanceSheet[i].accPayable / body.financialStatementDetail[i].cogs) * 30 * months
      );
    }

    body.financialRatio[i].cashCycle = float(
      body.financialRatio[i].ardoh + body.financialRatio[i].invdoh - body.financialRatio[i].apdoh
    );

    body.financialRatio[i].cashRatio = float(
      body.balanceSheet[i].currentAssets / body.balanceSheet[i].currentLiabilities
    );

    body.financialRatio[i].ebitda =
      body.financialStatementDetail[i].profitBeforeTax +
      body.financialStatementDetail[i].interestExpense +
      body.financialStatementDetail[i].depreciation;

    body.financialRatio[i].leverage = float(
      body.balanceSheet[i].totalLiabilities / body.balanceSheet[i].equity
    );

    body.financialRatio[i].wiNeeds = float(
      (body.financialRatio[i].cashCycle * body.financialStatementDetail[i].cogs) / 365
    );

    body.financialRatio[i].tie = float(
      body.financialStatementDetail[i].operatingProfit /
        body.financialStatementDetail[i].interestExpense
    );

    body.financialRatio[i].dscr = float(
      body.financialRatio[i].ebitda / body.financialStatementDetail[i].installment
    );
  }

  return body;
}

function float (floatNum, decimalPlaces = 2) {
  return parseFloat(floatNum.toFixed(decimalPlaces));
}

function assertEqualFinancialRatio (financialRatio, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialRatio[i].yearTo;
    expect(financialRatio[i].gpm, "New core gpm doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].gpm
    );
    expect(financialRatio[i].npm, "New core npm doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].npm
    );
    expect(financialRatio[i].ardoh, "New core ARDOH doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].ardoh
    );
    expect(financialRatio[i].invdoh, "New core INVDOH doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].invdoh
    );
    expect(financialRatio[i].apdoh, "New core APDOH doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].apdoh
    );
    expect(financialRatio[i].cashCycle, "New core cash cycle doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].cashCycle
    );
    expect(financialRatio[i].cashRatio, "New core cash ratio doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].cashRatio
    );
    expect(financialRatio[i].ebitda, "New core EBITDA doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].ebitda
    );
    expect(financialRatio[i].leverage, "New core leverage doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].leverage
    );
    expect(financialRatio[i].wiNeeds, "New core WI Needs doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].wiNeeds
    );
    expect(financialRatio[i].tie, "New core TIE doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].tie
    );
  }
}

function assertNotEqualFinancialRatio (financialRatio, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialRatio[i].yearTo;
    expect(financialRatio[i].gpm, "New core gpm shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].gpm
    );
    expect(financialRatio[i].npm, "New core npm shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].npm
    );
    expect(financialRatio[i].ardoh, "New core ARDOH shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].ardoh
    );
    expect(financialRatio[i].invdoh, "New core INVDOH shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].invdoh
    );
    expect(financialRatio[i].apdoh, "New core APDOH shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].apdoh
    );
    expect(
      financialRatio[i].cashCycle,
      "New core cash cycle shouldn't be equal to input"
    ).to.not.eql(body.financialRatio[yearTo - 1].cashCycle);
    expect(
      financialRatio[i].cashRatio,
      "New core cash ratio shouldn't be equal to input"
    ).to.not.eql(body.financialRatio[yearTo - 1].cashRatio);
    expect(financialRatio[i].ebitda, "New core EBITDA shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].ebitda
    );
    expect(financialRatio[i].leverage, "New core leverage shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].leverage
    );
    expect(financialRatio[i].wiNeeds, "New core WI Needs shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].wiNeeds
    );
    expect(financialRatio[i].tie, "New core TIE shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].tie
    );
  }
}

function assertLegacyDataSync (frData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = frData[i].fr_period;
    expect(frData[i].fr_gpm, "Legacy fr_gpm doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].gpm
    );
    expect(frData[i].fr_npm, "Legacy fr_npm doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].npm
    );
    expect(frData[i].fr_ardoh, "Legacy fr_ardoh doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].ardoh
    );
    expect(frData[i].fr_invdoh, "Legacy fr_invdoh doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].invdoh
    );
    expect(frData[i].fr_apdoh, "Legacy fr_apdoh doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].apdoh
    );
    expect(frData[i].fr_cash_cycle, "Legacy fr_cash_cycle doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].cashCycle
    );
    expect(frData[i].fr_cash_ratio, "Legacy fr_cash_ratio doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].cashRatio
    );
    expect(frData[i].fr_ebitda, "Legacy fr_ebitda doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].ebitda
    );
    expect(frData[i].fr_leverage, "Legacy fr_leverage doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].leverage
    );
    expect(frData[i].fr_wi_needs, "Legacy fr_wi_needs doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].wiNeeds
    );
    expect(frData[i].fr_tie, "Legacy fr_tie doesn't equal to input").to.eql(
      body.financialRatio[yearTo - 1].tie
    );
  }
}

function assertLegacyDataNotSync (frData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = frData[i].fr_period;
    expect(frData[i].fr_gpm, "Legacy fr_gpm shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].gpm
    );
    expect(frData[i].fr_npm, "Legacy fr_npm shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].npm
    );
    expect(frData[i].fr_ardoh, "Legacy fr_ardoh shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].ardoh
    );
    expect(frData[i].fr_invdoh, "Legacy fr_invdoh shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].invdoh
    );
    expect(frData[i].fr_apdoh, "Legacy fr_apdoh shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].apdoh
    );
    expect(frData[i].fr_cash_cycle, "Legacy fr_cash_cycle shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].cashCycle
    );
    expect(frData[i].fr_cash_ratio, "Legacy fr_cash_ratio shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].cashRatio
    );
    expect(frData[i].fr_ebitda, "Legacy fr_ebitda shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].ebitda
    );
    expect(frData[i].fr_leverage, "Legacy fr_leverage shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].leverage
    );
    expect(frData[i].fr_wi_needs, "Legacy fr_wi_needs shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].wiNeeds
    );
    expect(frData[i].fr_tie, "Legacy fr_tie shouldn't be equal to input").to.not.eql(
      body.financialRatio[yearTo - 1].tie
    );
  }
}
