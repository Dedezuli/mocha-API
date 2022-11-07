const help = require('@lib/helper');
const report = require('@lib/report');
const chai = require('chai');
const vars = require('@fixtures/vars');
const request = require('@lib/request');
const expect = chai.expect;

const url = '/partners/v1/business/registration';
const legacyBaseUrl = request.getLegacyUrl();
let key = vars.keyADW;

describe('Registration ADW Partner', () => {
  describe('#smoke', () => {
    it('Registration ADW should succeed #TC-1012', async function() {
      const startTime = await help.startTime();
      let body = generateBody();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(body)
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.partner_name).to.eql('adw');
      expect(res.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Registration ADW with non unique phone number should failed #TC-1013', async function() {
      let bodyUserOne = generateBody();
      let phoneNumberOne = bodyUserOne.personal_info.phone_number;
      await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(bodyUserOne)

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.phone_number = phoneNumberOne;
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(bodyUserTwo)

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1008');

      expect(res.body.partner_name).to.eql('adw');
      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration ADW with non unique email should failed #TC-1014', async function() {
      let bodyUserOne = generateBody();
      let emailOne = bodyUserOne.personal_info.email;
      await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(bodyUserOne)

      let bodyUserTwo = generateBody();
      bodyUserTwo.personal_info.email = emailOne;
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(bodyUserTwo)

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1008');

      expect(res.body.partner_name).to.eql('adw');
      expect(res.body.meta.code).to.eql(400);
    });

    it('Registration ADW with invalid email format should failed #TC-1015', async function() {
      let body = generateBody();
      body.personal_info.email = help.randomAlphaNumeric(8);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            "X-Investree-Key": key
          })
        )
        .send(body)

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1008');

      expect(res.body.partner_name).to.eql('adw');
      expect(res.body.meta.code).to.eql(400);
    });
  });
});

function generateBody() {
  let body = {
    "personal_info": {
      "full_name": `${help.randomAlphaNumeric(5)} ADW`,
      "gender": "M",
      "birth_place": "Jakarta",
      "birth_date": help.backDateByYear(18),
      "phone_number": help.randomPhoneNumber(12),
      "email": `ADW.${help.randomEmail()}`,
      "title": 4
    }
  }
  return body;
}