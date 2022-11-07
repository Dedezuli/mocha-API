const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const urlRegistration = '/partners/v1.1/business/registration';
const urlCompData = '/partners/v1.1/business/anchor/registration/completing';
const urlApplyLoan = '/partners/v1/business/apply/line-facility/loan';
const bizDbConfig = require('@root/knexfile.js')[req.getEnv() + '_legacy'];

const apiLegacyBaseUrl = req.getLegacyUrl();
const headerMbizDM = req.createLegacyHeaders({
  'X-Investree-Key': help.getMbizKey('DM')
});
const headerMbizQR = req.createLegacyHeaders({
  'X-Investree-Key': help.getMbizKey('QR')
});

describe('Apply Loan Purchase Order MBIZ-DM Partner', function () {
  let email;
  let lineFacilityNumber;
  let borrowerNumber;
  beforeEach(async function () {
    const bodyRegist = generateBodyRegist();
    email = bodyRegist.personal_info.email;

    const resRegist = await chai
      .request(apiLegacyBaseUrl)
      .post(urlRegistration)
      .set(headerMbizDM)
      .send(bodyRegist);
    borrowerNumber = resRegist.body.data.borrower_number;

    report.setInfo(this, resRegist);

    const bodyCompData = generateBodyCompletingData(borrowerNumber, email);

    const resCompData = await chai
      .request(apiLegacyBaseUrl)
      .post(urlCompData)
      .set(headerMbizDM)
      .send(bodyCompData);
    lineFacilityNumber = resCompData.body.data.line_facility_info[0].line_facility_number;

    report.setInfo(this, resCompData);

    await changeStatusLF(lineFacilityNumber, 'Y');
  });
  describe('#smoke', function () {
    it('Apply loan should succeed #TC-504', async function () {
      const bodyApplyLoan = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(200);
    });

    it('Apply loan more than one time and total loan amount is not bigger than line facility cap amount should success #TC-505', async function () {
      const bodyApplyLoanOne = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);
      await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoanOne);

      const bodyApplyLoanTwo = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoanTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(200);
    });
  });

  describe('#negative', function () {
    it('Apply loan when line facility status is inactive should failed #TC-506', async function () {
      await changeStatusLF(lineFacilityNumber, 'N');

      const bodyApplyLoan = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan when line facility status is in review should be failed #TC-1566', async function () {
      await changeStatusLF(lineFacilityNumber, 'D');

      const body = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('Apply loan with different key and product with completing data should failed #TC-507', async function () {
      const urlApplyLoanMbizQr = '/partners/v1.1/business/anchor/apply/invoice/loan';

      const bodyApplyLoan = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoanMbizQr)
        .set(headerMbizQR)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.code).to.eql('500');
    });

    it('Apply purchase order loan when total loan amount is more than line facility cap amount should failed #TC-508', async function () {
      const bodyApplyLoanOne = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);
      bodyApplyLoanOne.loan_data.loan_amount = 1500000000;

      await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoanOne);

      const bodyApplyLoanTwo = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);
      bodyApplyLoanTwo.loan_data.loan_amount = 510000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(bodyApplyLoanTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan when loan amount > 80% invoice amount should failed #TC-1557', async function () {
      const body = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);
      body.loan_data.loan_amount = 90000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });
    it('Apply loan when borrower status is inactive should be failed #TC-1567', async function () {
      await changeStatusBorrower(borrowerNumber, 'N');

      const body = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan when borrower status is rejected should be failed #TC-1568', async function () {
      await changeStatusBorrower(borrowerNumber, 'R');

      const body = generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerMbizDM)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-408');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });
  });
});

async function changeStatusLF (lineFacilityNumber, status) {
  const knex = await require('knex')(bizDbConfig);
  return knex('borrower_loan_facility')
    .where({
      blf_number: lineFacilityNumber
    })
    .update({ blf_status: status });
}

async function changeStatusBorrower (borrowerNumber, status) {
  const knex = await require('knex')(bizDbConfig);
  return knex('borrower_primary_data')
    .where({
      bpd_number: borrowerNumber
    })
    .update({ bpd_right_data: status });
}

function generateBodyRegist () {
  const body = {
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

function generateBodyCompletingData (borrowerNumber, email) {
  const randAddress = help.randomAddress();
  const body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`
    },
    company_info: {
      company_name: `${help.randomCompanyName()} MbizDM`,
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

function generateBodyApplyLoan (borrowerNumber, email, lineFacilityNumber) {
  const body = {
    personal_info: {
      email: email,
      borrower_number: borrowerNumber,
      line_facility_number: lineFacilityNumber
    },
    loan_data: {
      invoice_amount: 100000000,
      loan_amount: 10000000,
      invoice_tenor: 120,
      invoice_number: `PO-MBIZ-${help.randomAlphaNumeric(5)}`,
      invoice_date: help.backDateByDays(1),
      payor_name: 1,
      payor_person_division: 'Division Finance',
      payor_contact_person: help.randomFullName(),
      payor_person_phone_number: help.randomInteger(10),
      payor_person_extension: help.randomInteger(3),
      po_documents: {
        po_document_name: `filePO-MBIZ-DM-${help.randomAlphaNumeric(4)}.jpg`,
        po_document_file_string: 'https://www.w3schools.com/howto/img_forest.jpg'
      },
      supporting_info: {
        doc_name1: '',
        doc_file1: '',
        doc_name2: '',
        doc_file2: '',
        doc_name3: '',
        doc_file3: ''
      }
    }
  };
  return body;
}
