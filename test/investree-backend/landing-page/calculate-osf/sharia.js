const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Landing Page Sharia OSF Calculator', () => {
  const baseUrl = req.getBackendUrl();
  const url = '/landing-page/calculate-osf';
  let headers = req.createNewCoreHeaders();

  describe('#smoke', () => {
    it('Nominal 2 million rate 1 period 24 should return 103.333', async function() {
      let body = {
        "preference": "sharia",
        "nominal": 2000000,
        "rate": 1,
        "period": 24
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res.body.data).to.eql(calculateResult(body));
    });

    it('Nominal 2 billion rate 0.9 period 12 return 184.666.667', async function() {
      let body = {
        "preference": "sharia",
        "nominal": 2000000000,
        "rate": 0.9,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res.body.data).to.eql(calculateResult(body));
    });
  });

  describe('#negative', () => {
    it('Nominal greater than 2 billion should return relevant error', async function() {
      let body = {
        "preference": "sharia",
        "nominal": 2000000001,
        "rate": 1,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('nominal Tidak dapat lebih dari 2 Milyar');
    });
    
    it('Empty nominal should return corresponding error message', async function() {
      let body = {
        "preference": "sharia",
        "rate": 1,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('Data nominal tidak ditemukan');
    });

    it('Empty rate should return corresponding error message', async function() {
      let body = {
        "preference": "sharia",
        "nominal": 1000000,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res.body.meta.message).to.eql('Data rate tidak ditemukan');
    });

    it('Empty period should return corresponding error message', async function() {
      let body = {
        "preference": "sharia",
        "nominal": 1000000,
        "rate": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });

    it('Nominal containing digit separator should return error', async function() {
      let body = {
        "preference": "sharia",
        "nominal": "1,000,000",
        "rate": 1,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });

    it('Nominal containing comma should return error', async function() {
      let body = {
        "preference": "sharia",
        "nominal": "1000000.123",
        "rate": 1,
        "period": 12
      };

      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .post(url)
        .set(headers)
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-204");
      report.setSeverity(this, "critical");

      expect(res).to.have.status(400);
    });
  });
});

function calculateResult(body) {
  let { nominal, rate, period } = body;
  rate = rate / 100;

  return Math.round(nominal / period + nominal * rate);
}