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

describe('Backoffice Financial Statement Institutional', function () {
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
    it('Add institutional financial statement should succeed #TC-612', async function () {
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
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      assertEqualFinancialStatement(financialStatement, body);
    });

    it('Update institutional financial statement should succeed #TC-613', async function () {
      const addBody = generateBody(insCustomerId);

      await chai
        .request(svcBaseUrl)
        .put(addBody)
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

      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      assertEqualFinancialStatement(financialStatement, updateBody);
    });

    it('Add institutional financial statement should sync between new core and legacy #TC-614', async function () {
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
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': insCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertEqualFinancialStatement(financialStatement, body);
      assertLegacyDataSync(fsData, body);
    });

    it('Update institutional financial statement should sync between new core and legacy #TC-615', async function () {
      const addBody = generateBody(insCustomerId);

      await chai
        .request(svcBaseUrl)
        .put(addBody)
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

      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': insCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertEqualFinancialStatement(financialStatement, updateBody);
      assertLegacyDataSync(fsData, updateBody);
    });
  });

  describe('#negative', function () {
    it('Add institutional financial statement using frontoffice user should fail #TC-616', async function () {
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

    it('Add institutional financial statement should not save data to legacy if failed to sync #TC-617', async function () {
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
      const financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': insCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      expect(financialStatement).to.be.an('array').that.is.empty;
      expect(fsData).to.be.an('array').that.is.empty;
    });

    it('Update institutional financial statement should not save data if failed to sync #TC-618', async function () {
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

      let financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;
      const financialTrend = completingDataRes.body.data.advancedInfo.financialTrend.field;
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
      financialStatement = completingDataRes.body.data.advancedInfo.financialStatement.field;

      const fsRes = await chai
        .request(apiSyncBaseUrl)
        .get('/fs')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][fs_migration_id]': insCustomerId
        });
      const fsData = JSON.parse(fsRes.text);

      assertNotEqualFinancialStatement(financialStatement, updateBody);
      assertLegacyDataNotSync(fsData, updateBody);
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

function assertEqualFinancialStatement (financialStatementDetail, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialStatementDetail[i].yearTo;
    expect(financialStatementDetail[i].yearTo, "New core year to doesn't equal to input").to.eql(
      body.financialStatementDetail[yearTo - 1].yearTo
    );
    expect(
      financialStatementDetail[i].fiscalYear,
      'New core fiscal year does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].fiscalYear);
    expect(financialStatementDetail[i].sales, 'New core sales does not equal to input').to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].sales)
    );
    expect(financialStatementDetail[i].cogs, 'New core cogs does not equal to input').to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].cogs)
    );
    expect(
      financialStatementDetail[i].grossProfit,
      'New core gross profit does not equal to input'
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].grossProfit));
    expect(financialStatementDetail[i].sga, 'New core sga does not equal to input').to.eql(
      body.financialStatementDetail[yearTo - 1].sga
    );
    expect(
      financialStatementDetail[i].depreciation,
      'New core depreciation does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].depreciation);
    expect(
      financialStatementDetail[i].operatingProfit,
      'New core operating profit does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].operatingProfit);
    expect(
      financialStatementDetail[i].interestExpense,
      'New core interest expense does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].interestExpense);
    expect(
      financialStatementDetail[i].otherIncome,
      'New core other income does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].otherIncome);
    expect(
      financialStatementDetail[i].otherExpense,
      'New core other expense does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].otherExpense);
    expect(
      financialStatementDetail[i].profitBeforeTax,
      'New core profit before tax does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].profitBeforeTax);
    expect(financialStatementDetail[i].tax, 'New core tax does not equal to input').to.eql(
      body.financialStatementDetail[yearTo - 1].tax
    );
    expect(
      financialStatementDetail[i].profitAfterTax,
      'New core profit after tax does not equal to input'
    ).to.eql(body.financialStatementDetail[yearTo - 1].profitAfterTax);
    expect(
      financialStatementDetail[i].installment,
      'New core installment does not equal to input'
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].installment));
  }
}

function assertNotEqualFinancialStatement (financialStatementDetail, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = financialStatementDetail[i].yearTo;
    expect(financialStatementDetail[i].yearTo, "New core year to doesn't equal to input").to.eql(
      body.financialStatementDetail[yearTo - 1].yearTo
    );
    expect(
      financialStatementDetail[i].sales,
      "New core sales shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].sales));
    expect(
      financialStatementDetail[i].cogs,
      "New core cogs shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].cogs));
    expect(
      financialStatementDetail[i].grossProfit,
      "New core gross profit shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].grossProfit));
    expect(financialStatementDetail[i].sga, "New core sga shouldn't be equal to input").to.not.eql(
      body.financialStatementDetail[yearTo - 1].sga
    );
    expect(
      financialStatementDetail[i].depreciation,
      "New core depreciation shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].depreciation);
    expect(
      financialStatementDetail[i].operatingProfit,
      "New core operating profit shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].operatingProfit);
    expect(
      financialStatementDetail[i].interestExpense,
      "New core interest expense shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].interestExpense);
    expect(
      financialStatementDetail[i].otherIncome,
      "New core other income shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].otherIncome);
    expect(
      financialStatementDetail[i].otherExpense,
      "New core other expense shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].otherExpense);
    expect(
      financialStatementDetail[i].profitBeforeTax,
      "New core profit before tax shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].profitBeforeTax);
    expect(financialStatementDetail[i].tax, "New core tax shouldn't be equal to input").to.not.eql(
      body.financialStatementDetail[yearTo - 1].tax
    );
    expect(
      financialStatementDetail[i].profitAfterTax,
      "New core profit after tax shouldn't be equal to input"
    ).to.not.eql(body.financialStatementDetail[yearTo - 1].profitAfterTax);
    expect(
      financialStatementDetail[i].installment,
      "New core installment shouldn't be equal to input"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].installment));
  }
}

function assertLegacyDataSync (fsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = fsData[i].fs_year_to;
    expect(fsData[i].fs_year_to, "Legacy fs_year_to doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].yearTo)
    );
    expect(
      fsData[i].fs_fiscal_year.replace(/T(.*)/, ''),
      "Legacy fs_fiscal_year doesn't equal to new core"
    ).to.eql(body.financialStatementDetail[yearTo - 1].fiscalYear);
    expect(fsData[i].fs_sales, "Legacy fs_sales doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].sales)
    );
    expect(fsData[i].fs_cogs, "Legacy fs_cogs doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].cogs)
    );
    expect(fsData[i].fs_gross_profit, "Legacy fs_gross_profit doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].grossProfit)
    );
    expect(fsData[i].fs_sga, "Legacy fs_sga doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].sga)
    );
    expect(fsData[i].fs_depreciation, "Legacy fs_depreciation doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].depreciation)
    );
    expect(
      fsData[i].fs_operating_profit,
      "Legacy fs_operating_profit doesn't equal to new core"
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].operatingProfit));
    expect(
      fsData[i].fs_interest_expense,
      "Legacy fs_interest_expense doesn't equal to new core"
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].interestExpense));
    expect(fsData[i].fs_other_income, "Legacy fs_other_income doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].otherIncome)
    );
    expect(fsData[i].fs_other_expense, "Legacy fs_other_expense doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].otherExpense)
    );
    expect(
      fsData[i].fs_profit_before_tax,
      "Legacy fs_profit_before_tax doesn't equal to new core"
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].profitBeforeTax));
    expect(fsData[i].fs_tax, "Legacy fs_tax doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].tax)
    );
    expect(
      fsData[i].fs_profit_after_tax,
      "Legacy fs_profit_after_tax doesn't equal to new core"
    ).to.eql(parseInt(body.financialStatementDetail[yearTo - 1].profitAfterTax));
    expect(fsData[i].fs_efi, "Legacy fs_efi doesn't equal to new core fs_efi").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].installment)
    );
  }
}

function assertLegacyDataNotSync (fsData, body) {
  for (let i = 0; i < 3; i++) {
    const yearTo = fsData[i].fs_year_to;
    expect(fsData[i].fs_year_to, "Legacy fs_year_to doesn't equal to new core").to.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].yearTo)
    );
    expect(fsData[i].fs_sales, "Legacy fs_sales shouldn't be to new core fs_sales").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].sales)
    );
    expect(fsData[i].fs_cogs, "Legacy fs_cogs shouldn't be to new core fs_cogs").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].cogs)
    );
    expect(fsData[i].fs_gross_profit, "Legacy fs_gross_profit shouldn't be to new core").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].grossProfit)
    );
    expect(fsData[i].fs_sga, "Legacy fs_sga shouldn't be to new core").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].sga)
    );
    expect(fsData[i].fs_depreciation, "Legacy fs_depreciation shouldn't be to new core").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].depreciation)
    );
    expect(
      fsData[i].fs_operating_profit,
      "Legacy fs_operating_profit shouldn't be to new core"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].operatingProfit));
    expect(
      fsData[i].fs_interest_expense,
      "Legacy fs_interest_expense shouldn't be to new core"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].interestExpense));
    expect(fsData[i].fs_other_income, "Legacy fs_other_income shouldn't be to new core").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].otherIncome)
    );
    expect(
      fsData[i].fs_other_expense,
      "Legacy fs_other_expense shouldn't be to new core"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].otherExpense));
    expect(
      fsData[i].fs_profit_before_tax,
      "Legacy fs_profit_before_tax shouldn't be to new core"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].profitBeforeTax));
    expect(fsData[i].fs_tax, "Legacy fs_tax shouldn't be to new core").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].tax)
    );
    expect(
      fsData[i].fs_profit_after_tax,
      "Legacy fs_profit_after_tax shouldn't be to new core"
    ).to.not.eql(parseInt(body.financialStatementDetail[yearTo - 1].profitAfterTax));
    expect(fsData[i].fs_efi, "Legacy fs_efi shouldn't be to new core fs_efi").to.not.eql(
      parseInt(body.financialStatementDetail[yearTo - 1].installment)
    );
  }
}
