const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require("chai");
let chaiHttp = require("chai-http");
chai.use(chaiHttp);
const expect = chai.expect;

const url = '/partners/v1.1/business/registration';

const apiLegacyBaseUrl = req.getLegacyUrl();
const headerMbizDM = req.createLegacyHeaders({
  "X-Investree-Key": help.getMbizKey('DM')
});
const headerMbizQR = req.createLegacyHeaders({
  "X-Investree-Key": help.getMbizKey('QR')
});

describe('Registration MBIZ Partner', () => {
  describe('#smoke', () => {
    it('Registration MBIZ QR should succeed #TC-542', async function() {
      let body = generateBody();

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(200);
    });

    it('Registration MBIZ DM should succeed #TC-543', async function() {
      let body = generateBody();

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Registration MBIZ QR with non unique phone number should failed #TC-544', async function() {
      let bodyUserOne = generateBody();
      let phoneNumberOne = bodyUserOne.personal_info.phone_number;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.phone_number = phoneNumberOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration MBIZ QR with non unique email should failed #TC-545', async function() {
      let bodyUserOne = generateBody();
      let emailOne = bodyUserOne.personal_info.email;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.email = emailOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration MBIZ QR with non valid email\'s format should failed #TC-546', async function() {
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration with non valid key should failed #TC-547', async function() {
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(400);
    });

    it('When failed to sync data of MBIZ QR partner to new core should throw failed message #TC-548', async function() {
      let body = generateBody();
      let email = `MBIZ.${help.randomAlphaNumeric(5)}@investree.reg`;
      body.personal_info.email = email;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizQR)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(res.body.meta.code).to.eql(400);
    });

    it('When failed to sync data of MBIZ DM partner to new core should throw failed message #TC-549', async function() {
      let body = generateBody();
      let email = `MBIZ.${help.randomAlphaNumeric(5)}@investree.reg`;
      body.personal_info.email = email;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration MBIZ DM with non unique phone number should failed #TC-550', async function() {
      let bodyUserOne = generateBody();
      let phoneNumberOne = bodyUserOne.personal_info.phone_number;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.phone_number = phoneNumberOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration MBIZ DM with non unique email should failed #TC-551', async function() {
      let bodyUserOne = generateBody();
      let emailOne = bodyUserOne.personal_info.email;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.email = emailOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration MBIZ DM with non valid email\'s format should failed #TC-552', async function() {
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });
  });
});

function generateBody() {
  let body = {
    "personal_info": {
      "full_name": `${help.randomAlphaNumeric(5)} MBIZ`,
      "gender": "M",
      "birth_place": "Jakarta",
      "birth_date": help.backDateByYear(18),
      "phone_number": help.randomPhoneNumber(12),
      "email": `MBIZ.${help.randomEmail()}`,
      "title": 4,
      "company_name": `${help.randomCompanyName()} MBIZ`
    }
  }
  return body;
}