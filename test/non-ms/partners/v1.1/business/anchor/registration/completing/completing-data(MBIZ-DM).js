const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

let borrowerNumber;
let email;
const urlRegistration = '/partners/v1.1/business/registration';
const url = '/partners/v1.1/business/anchor/registration/completing';

const apiLegacyBaseUrl = req.getLegacyUrl();
const headerMbizDM = req.createLegacyHeaders({
  'X-Investree-Key': help.getMbizKey('DM')
});

describe('Completing Data MBIZ-DM Partner', () => {
  beforeEach(async function () {
    let bodyReg = generateBodyRegist();
    email = bodyReg.personal_info.email;

    const res = await chai.request(apiLegacyBaseUrl).post(urlRegistration).set(headerMbizDM).send(bodyReg);
    borrowerNumber = res.body.data.borrower_number;

    report.setInfo(this, `Success to regist partner MBIZ-DM with borrower number ${borrowerNumber} and email ${email}`);
  });
  describe('#smoke', () => {
    it('Completing data with borrower type conventional should succeed #TC-528', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(200);
    });

    it('Completing data with borrower type conventional and syariah should succeed #TC-529', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);
      body.borrower_type = '1,2';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(200);
    });

    it('Completing data with borrower type syariah should succeed #TC-530', async function () {
      let body = generateBodyCompletingData(borrowerNumber, email);
      body.borrower_type = '2';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(200);
    });

    it('Hit completing data twice should succeed #TC-531', async function () {
      let bodyOne = generateBodyCompletingData(borrowerNumber, email);

      await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(bodyOne);

      let bodyTwo = generateBodyCompletingData(borrowerNumber, email);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(bodyTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'minor');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Completing data of borrowerNumber that not belong to respective email should be failed #TC-532', async function () {
      let otherEmail = help.randomEmail();
      let body = generateBodyCompletingData(borrowerNumber, otherEmail);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql('400');
    });

    it('Completing data with non unique npwp number should failed #TC-533', async function () {
      let bodyUserOther = generateBodyRegist();
      let emailOther = bodyUserOther.personal_info.email;

      let resRegistOther = await chai
        .request(apiLegacyBaseUrl)
        .post(urlRegistration)
        .set(headerMbizDM)
        .send(bodyUserOther);

      let borrowerNumberOther = resRegistOther.body.data.borrower_number;
      let completingDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      let npwpOther = completingDataOther.company_info.additional_data.company_npwp_number;

      await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(completingDataOther);

      let completingData = generateBodyCompletingData(borrowerNumber, email);
      completingData.company_info.additional_data.company_npwp_number = npwpOther;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(completingData);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });

    it('When failed to sync data to newcore should throw error message #TC-534', async function () {
      let bodyUser = generateBodyRegist();
      let email = `MBIZ.${help.randomAlphaNumeric(5)}@investree.compdata`;
      bodyUser.personal_info.email = email;

      let resRegist = await chai.request(apiLegacyBaseUrl).post(urlRegistration).set(headerMbizDM).send(bodyUser);

      let borrowerNumber = resRegist.body.data.borrower_number;
      let completingData = generateBodyCompletingData(borrowerNumber, email);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerMbizDM).send(completingData);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-407');

      expect(res.body.meta.code).to.eql(400);
    });
  });
});

function generateBodyRegist() {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} MBIZ`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: `MBIZ.${help.randomEmail()}`,
      title: 4,
      company_name: `${help.randomCompanyName()} MBIZ`
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
      company_desc: `${help.randomAlphaNumeric(10)} company description`,
      employee_number: `1${help.randomInteger(2)}`,
      year_of_establishment: help.randomDate(),
      company_address: `${randAddress.address}`,
      company_province: `${randAddress.province.name}`,
      company_city: `${randAddress.city.name}`,
      company_district: `${randAddress.district.name}`,
      company_sub_district: `${randAddress.subDistrict.name}`,
      company_postal_code: `${randAddress.postalCode}`,
      company_phone_number: `${help.randomPhoneNumber(10)}`,
      fax_number: `${help.randomInteger(6)}`,
      siup_number: `${help.randomAlphaNumeric(32)}`,
      company_bank: {
        bank_id: 3,
        account_number: `${help.randomInteger(10)}`,
        account_name: help.randomFullName()
      },
      additional_data: {
        company_npwp_number: `${help.randomInteger('NPWP')}`,
        siup_registered_date: `${help.randomDate(2019)}`,
        siup_expired_date: `${help.futureDate()}`,
        tdp_skdp_number: `${help.randomAlphaNumeric(16)}`,
        tdp_registered_date: help.randomDate(2019),
        tdp_expired_date: help.futureDate(),
        sk_menhumkam_number: help.randomAlphaNumeric(10),
        sk_menhumkam_registered_date: help.randomDate(2019),
        akta_pendirian_number: help.randomAlphaNumeric(10),
        akta_pendirian_registered_date: help.randomDate(2019),
        akta_perubahan_terakhir_number: help.randomAlphaNumeric(10),
        akta_perubahan_registered_date: help.randomDate(2019)
      }
    },
    documents: {
      siup_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      company_npwp_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      tdp_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      sk_menhumkam_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      akta_pendirian_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      akta_perubahan_terakhir_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf'
    },
    borrower_type: '1',
    line_facility_cap_amount: 2000000000
  };
  return body;
}
