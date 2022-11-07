const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Credit Scoring Invoice Grade', () => {
  const baseUrl = req.getSvcUrl();
  const url = '/validate/credit-scoring-invoice/grade';
  let headers = req.createNewCoreHeaders();

  describe('#smoke', () => {
    it('Get credit scoring invoice grade should return name, rate, score, and interest', async function() {
      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .get(url)
        .set(headers);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-197");
      report.setSeverity(this, "critical");

      let dataArray = res.body.data;
      let fieldToBeAsserted = [
        "interestMax",
        "interestMin",
        "name",
        "rate",
        "scoreMax",
        "scoreMin"
      ];

      for (let data of dataArray) {
        expect(data).to.include.all.keys(
          "interestMax",
          "interestMin",
          "name",
          "rate",
          "scoreMax",
          "scoreMin");

        for (let field of Object.keys(data)) {
          if (fieldToBeAsserted.includes(field)) {
            expect(data[field].toString()).to.be.not.empty;
          }
        }
      }
    });
  });
});