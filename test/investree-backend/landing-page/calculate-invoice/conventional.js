const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Landing Page Conventional Invoice Financing Calculator', () => {
  const baseUrl = req.getBackendUrl();
  const url = '/landing-page/calculate-invoice';
  let headers = req.createNewCoreHeaders();

  describe('#smoke', () => {
    it('Nominal 30 million rate 14 period 30 should return 80% of nominal as loan amount and repayment amount of 1.011.667', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 30000000,
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      let expectedResult = calculateResult(body);
      expect(res.body.data.loanObtain).to.eql(expectedResult.loanObtain);
      expect(res.body.data.loanRepayment).to.eql(expectedResult.loanRepayment);
    });

    it('Nominal 2 billion rate 14 period 30 should return lending return amount of 1.618.666.667', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 2000000000,
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      let expectedResult = calculateResult(body);
      expect(res.body.data.loanObtain).to.eql(expectedResult.loanObtain);
      expect(res.body.data.loanRepayment).to.eql(expectedResult.loanRepayment);
    });

    it('Nominal 88 million rate 18 period 90 should return lending return amount of 73.568.000', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 88000000,
        "rate": 18,
        "period": 90
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      let expectedResult = calculateResult(body);
      expect(res.body.data.loanObtain).to.eql(expectedResult.loanObtain);
      expect(res.body.data.loanRepayment).to.eql(expectedResult.loanRepayment);
    });
  });

  describe('#negative', () => {
    it('Nominal greater than 2 billion should return relevant error', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 2000000001,
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('nominal Tidak dapat lebih dari 2 Milyar');
    });
    
    it('Empty nominal should return corresponding error message', async function() {
      let body = {
        "preference": "conventional",
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('Data nominal tidak ditemukan');
    });

    it('Empty rate should return corresponding error message', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 1000000,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('Data rate tidak ditemukan');
    });

    it('Empty period should return corresponding error message', async function() {
      let body = {
        "preference": "conventional",
        "nominal": 1000000,
        "rate": 14
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });

    it('Nominal containing digit separator should return error', async function() {
      let body = {
        "preference": "conventional",
        "nominal": "1,000,000",
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });

    it('Nominal containing comma should return error', async function() {
      let body = {
        "preference": "conventional",
        "nominal": "1000000.123",
        "rate": 14,
        "period": 30
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-201");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });
  });
});

function calculateResult(body) {
  let { nominal, rate, period } = body;
  let loanAmount = 0.8 * nominal;
  rate = rate / 100;

  return {
    "loanObtain": loanAmount,
    "loanRepayment": Math.round(loanAmount * rate * period / 360 + loanAmount)
  };
}