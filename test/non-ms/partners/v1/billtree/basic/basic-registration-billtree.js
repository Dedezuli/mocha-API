const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require("chai");
let chaiHttp = require("chai-http");
chai.use(chaiHttp);
const expect = chai.expect;

const url = '/partners/v1/billtree/basic/registration';
const key = help.getBilltreeKey();
const apiLegacyBaseUrl = req.getLegacyUrl();
const headerLegacy = req.createLegacyHeaders({
  "X-Investree-Key": key
});

describe('Registration Billtree Partner', () => {
  describe('#smoke', () => {
    it('Registration Billtree should succeed #TC-493', async function() {
      let body = generateBody();

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-415');

      expect(res.body.partner_name).to.eql('Billtree')
      expect(res.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Registration Billtree with non unique phone number should failed #TC-494', async function() {
      let bodyUserOne = generateBody();
      let phoneNumberOne = bodyUserOne.personal_info.phone_number;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.phone_number = phoneNumberOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-415');

      expect(res.body.partner_name).to.eql('Billtree')
      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration Billtree with non unique email should failed #TC-495', async function() {
      let bodyUserOne = generateBody();
      let emailOne = bodyUserOne.personal_info.email;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(bodyUserOne);

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.email = emailOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(bodyUserTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-415');

      expect(res.body.partner_name).to.eql('Billtree')
      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration Billtree with non valid email\'s format should failed #TC-496', async function() {
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-415');

      expect(res.body.partner_name).to.eql('Billtree')
      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration with non valid key should failed #TC-497', async function() {
      this.skip();
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerLegacy)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-415');

      expect(res.body.partner_name).to.eql('Billtree')
      expect(res.body.meta.code).to.eql(400);
    });
  });
});

function generateBody() {
  let body = {
    "personal_info": {
      "full_name": `${help.randomAlphaNumeric(5)} Billtree`,
      "gender": "M",
      "birth_place": "Jakarta",
      "birth_date": help.backDateByYear(18),
      "phone_number": help.randomPhoneNumber(12),
      "email": `Billtree.${help.randomEmail()}`,
      "title": 4,
      "company_name": `${help.randomCompanyName()} Billtree`
    }
  }
  return body;
}