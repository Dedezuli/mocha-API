const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

let borrowerNumber;
let email;

const key = help.getBilltreeKey();
const urlRegistration = '/partners/v1/billtree/basic/registration';
const url = '/partners/v1/billtree/completing/registration';
const apiLegacyBaseUrl = req.getLegacyUrl();
const headerLegacy = req.createLegacyHeaders({
  'X-Investree-Key': key
});

describe('Completing Data Billtree', () => {
  beforeEach(async function () {
    let bodyRegist = generateBodyRegist();
    email = bodyRegist.personal_info.email;

    const res = await chai
      .request(apiLegacyBaseUrl)
      .post(urlRegistration)
      .set(
        req.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyRegist);

    borrowerNumber = res.body.data.borrower_number;

    report.setInfo(this, `Success to regist Billtree with borrower number ${borrowerNumber} and email ${email}`);
  });
  describe('#smoke', () => {
    it('Completing data with borrower type conventional should succeed #TC-498', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(200);
    });

    it('Completing data with borrower type conventional and syariah should be failed #TC-499', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);
      body.company_info.borrower_type = '1,2';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(400);
    });

    it('Completing data with borrower type syariah should be success #TC-500', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);
      body.company_info.borrower_type = '2';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(200);
    });

    it('Hit completing data twice should succeed #TC-501', async function () {
      let bodyOne = generateBodyCompletingData(borrowerNumber, email);

      await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(bodyOne);

      let bodyTwo = generateBodyCompletingData(borrowerNumber, email);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(bodyTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Completing data of borrowerNumber that not belong to respective email should be failed #TC-502', async function () {
      let otherEmail = help.randomEmail();
      let body = generateBodyCompletingData(borrowerNumber, otherEmail);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(400);
    });

    it('Completing data with non unique npwp number should failed #TC-503', async function () {
      let bodyUserOther = generateBodyRegist();
      let emailOther = bodyUserOther.personal_info.email;

      let resRegistOther = await chai
        .request(apiLegacyBaseUrl)
        .post(urlRegistration)
        .set(headerLegacy)
        .send(bodyUserOther);

      let borrowerNumberOther = resRegistOther.body.data.borrower_number;
      let completingDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      let npwpOther = completingDataOther.company_info.company_npwp_number;

      await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(completingDataOther);

      let completingData = generateBodyCompletingData(borrowerNumber, email);
      completingData.company_info.company_npwp_number = npwpOther;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerLegacy).send(completingData);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-512');

      expect(res.body.partner_name).to.eql('Billtree');
      expect(res.body.meta.code).to.eql(400);
    });
  });
});

function generateBodyRegist() {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} Billtree`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: `Billtree.${help.randomEmail()}`,
      title: 4,
      company_name: `${help.randomCompanyName()} Billtree`
    }
  };
  return body;
}

function generateBodyCompletingData(borrowerNumber, email) {
  let randAddress = help.randomAddress();
  let body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`
    },
    company_info: {
      company_type: 2,
      business_category: 0,
      business_type: 10,
      company_address: `${randAddress.address}`,
      company_province: `${randAddress.province.name}`,
      company_city: `${randAddress.city.name}`,
      company_district: `${randAddress.district.name}`,
      company_sub_district: `${randAddress.subDistrict.name}`,
      company_postal_code: `${randAddress.postalCode}`,
      company_phone_number: `${help.randomPhoneNumber(10)}`,
      siup_number: `${help.randomAlphaNumeric(32)}`,
      borrower_type: '1',
      company_npwp_number: `${help.randomInteger('NPWP')}`,
      tdp_skdp_number: `${help.randomAlphaNumeric(16)}`,
      akta_pendirian_number: `${help.randomPhoneNumber(10)}`,
      akta_perubahan_terakhir_number: `${help.randomPhoneNumber(10)}`,
      sk_menhumkam_number: `${help.randomPhoneNumber(10)}`,
      company_bank: {
        bank_id: 3,
        account_number: `${help.randomInteger(10)}`,
        account_name: help.randomFullName()
      }
    },
    documents: {
      siup_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      company_npwp_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      tdp_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      sk_menhumkam_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      akta_pendirian_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      akta_perubahan_terakhir_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf'
    }
  };
  return body;
}
