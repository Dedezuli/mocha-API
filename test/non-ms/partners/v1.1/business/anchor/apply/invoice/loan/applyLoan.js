const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

let email;
let borrowerNumber;
let lineFacilityNumber;
let poLFNumber;
let syariahLFNumber;
const urlRegistration = '/partners/v1.1/business/registration';
const urlCompData = '/partners/v1.1/business/anchor/registration/completing';
const urlApplyLoan = '/partners/v1.1/business/anchor/apply/invoice/loan';
const bizDbConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];

const apiLegacyBaseUrl = req.getLegacyUrl();
const headerMbizDM = req.createLegacyHeaders({
  'X-Investree-Key': help.getMbizKey('DM')
});
const headerMbizQR = req.createLegacyHeaders({
  'X-Investree-Key': help.getMbizKey('QR')
});

describe('Apply Loan Invoice MBIZ Partner', () => {
  beforeEach(async function () {
    let bodyRegist = generateBodyRegist();
    email = bodyRegist.personal_info.email;

    let resRegist = await chai.request(apiLegacyBaseUrl).post(urlRegistration).set(headerMbizQR).send(bodyRegist);
    borrowerNumber = resRegist.body.data.borrower_number;

    report.setInfo(this, resRegist);

    let bodyCompData = generateBodyCompletingData(borrowerNumber, email);

    let resCompData = await chai.request(apiLegacyBaseUrl).post(urlCompData).set(headerMbizQR).send(bodyCompData);
    lineFacilityNumber = resCompData.body.data.line_facility_info[1].line_facility_number;
    poLFNumber = resCompData.body.data.line_facility_info[0].line_facility_number;
    syariahLFNumber = resCompData.body.data.line_facility_info[2].line_facility_number;

    report.setInfo(this, resCompData);
  });

  describe('#smoke', () => {
    it('Apply loan with borrower type conventional should succeed #TC-513', async function () {
      await changeStatusLF(lineFacilityNumber);
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(200);
    });

    it('Apply loan with borrower type syariah should succeed #TC-514', async function () {
      await changeStatusLF(syariahLFNumber);
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email, syariahLFNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(200);
    });

    it('Apply loan more than one time and total loan amount is not bigger than line facility cap amount should success #TC-515', async function () {
      await changeStatusLF(lineFacilityNumber);

      let bodyApplyLoanOne = generateBodyAL(borrowerNumber, email, lineFacilityNumber);

      await chai.request(apiLegacyBaseUrl).post(urlApplyLoan).set(headerMbizQR).send(bodyApplyLoanOne);

      let bodyApplyLoanTwo = generateBodyAL(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoanTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Apply loan with inactive line facility should failed #TC-516', async function () {
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan with different key and product with completing data should failed #TC-517', async function () {
      this.skip();
      await changeStatusLF(lineFacilityNumber);
      let urlApplyLoanMbizQR = '/partners/v1/business/apply/line-facility/loan';

      let bodyApplyLoan = generateBodyAL(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoanMbizQR)
        .set(headerMbizDM)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.code).to.eql('500');
    });

    it('Apply Purchase Order loan with line facility number for purchase order should failed #TC-518', async function () {
      await changeStatusLF(poLFNumber);

      let bodyApplyLoan = generateBodyAL(borrowerNumber, email, poLFNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply purchase order loan when total loan amount is more than line facility cap amount should failed #TC-519', async function () {
      await changeStatusLF(lineFacilityNumber);

      let bodyApplyLoanOne = generateBodyAL(borrowerNumber, email, lineFacilityNumber);
      bodyApplyLoanOne.loan_data.loan_amount = 510000000;

      let resApplyLoanOne = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoanOne);
      report.setInfo(this, resApplyLoanOne);

      let bodyApplyLoanTwo = generateBodyAL(borrowerNumber, email, lineFacilityNumber);
      bodyApplyLoanTwo.loan_data.loan_amount = 1500000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoanTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan purchase order with conventional line facility for syariah borrower should failed #TC-520', async function () {
      let bodyRegistOther = generateBodyRegist();
      let emailOther = bodyRegistOther.personal_info.email;

      let resRegistOther = await chai
        .request(apiLegacyBaseUrl)
        .post(urlRegistration)
        .set(headerMbizQR)
        .send(bodyRegistOther);
      let borrowerNumberOther = resRegistOther.body.data.borrower_number;

      report.setInfo(this, resRegistOther);

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      bodyCompDataOther.borrower_type = '2';

      let resCompDataOther = await chai
        .request(apiLegacyBaseUrl)
        .post(urlCompData)
        .set(headerMbizQR)
        .send(bodyCompDataOther);

      report.setInfo(this, resCompDataOther);

      let bodyApplyLoan = generateBodyAL(borrowerNumberOther, emailOther, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-75');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });
  });
});

async function changeStatusLF(lineFacilityNumber) {
  let knex = require('knex')(bizDbConfig);
  return knex('anchor_line_facility')
    .where({
      alf_line_number: lineFacilityNumber
    })
    .update({ alf_status: 'Y' })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      knex.destroy();
    });
}

function generateBodyAL(borrowerNumber, email, lineFacilityNumber) {
  let body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`,
      line_facility_number: lineFacilityNumber
    },
    loan_data: {
      loan_amount: 30000000,
      loan_tenor: 120
    },
    vendor_info: {
      invoice_number: `INV-MBIZ-${help.randomAlphaNumeric(5)}`,
      invoice_date: `${help.futureDateByDays(10)}`,
      invoice_amount: 1000000000,
      invoice_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      po_status: 'baru',
      invoice_status: 'performa',
      vendor_top: `${help.futureDateByDays(100)}`,
      po_number: `PO-MBIZ-${help.randomAlphaNumeric(5)}`,
      po_date: `${help.backDateByDays(3)}`,
      po_amount: 209999000
    },
    buyer_info: {
      buyer_email: `${help.randomEmail()}`,
      buyer_name: help.randomCompanyName(),
      buyer_contact_person: help.randomFullName(),
      buyer_person_phone_number: `08${help.randomInteger(8)}`,
      buyer_top: `${help.futureDateByDays(50)}`,
      poc_number: `POC-MBIZ${help.randomAlphaNumeric(4)}`,
      poc_date: `${help.backDateByDays(5)}`,
      poc_amount: 23940095,
      invoice_cust_number: `INV-CUST-${help.randomAlphaNumeric(4)}`,
      invoice_cust_date: `${help.futureDateByDays(45)}`,
      invoice_cust_amount: 23049000
    },
    supporting_info: {
      bast_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      faktur_pajak_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      po_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      invoice_cust_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      poc_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf'
    }
  };
  return body;
}

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
    vendor_info: {
      affiliate: 2,
      since_at: '2019-10-10',
      average_monthly_transaction: 200000000
    },
    borrower_type: '1,2',
    line_facility_cap_amount: 2000000000
  };
  return body;
}
