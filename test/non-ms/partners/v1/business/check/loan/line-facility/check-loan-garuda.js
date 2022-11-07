const help = require('@lib/helper');
const report = require('@lib/report');
const chai = require('chai');
const vars = require('@fixtures/vars');
const request = require('@lib/request');
const expect = chai.expect;

let borrowerNumber;
let email;
let lineNumber;
let key = vars.keyGaruda;

const urlRegistration = '/partners/v1/business/registration';
const urlCompletingData = '/partners/v1.1/business/registration/completing';
const urlCreateLF = '/partners/v1/business/create/line-facility';
const urlApplyLoan = '/partners/v1/business/apply/line-facility/loan';
const url = '/partners/v1/business/check/loan/facility';
const legacyBaseUrl = request.getLegacyUrl();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

describe('Apply Loan Line Facility Garuda', () => {
  beforeEach(async function () {
    let bodyReg = generateBodyRegist();
    email = bodyReg.personal_info.email;

    const resBasicReg = await chai
      .request(legacyBaseUrl)
      .post(urlRegistration)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyReg);

    borrowerNumber = resBasicReg.body.data.borrower_number;

    let bodyCompData = generateBodyCompletingData(borrowerNumber, email);
    const resCompData = await chai
      .request(legacyBaseUrl)
      .post(urlCompletingData)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyCompData);

    lineNumber = resCompData.body.data.line_facility[0].blf_number;
    await changeStatusLF(lineNumber, 'Y');

    let bodyApplyLoan = generateBodyApplyLoan(borrowerNumber, email, lineNumber);
    await chai
      .request(legacyBaseUrl)
      .post(urlApplyLoan)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyApplyLoan);

    report.setInfo(
      this,
      `Success to regist Garuda with borrower number ${borrowerNumber}, email ${email} and line numeber ${lineNumber}`
    );
  });

  describe('#smoke', () => {
    it('Check loan line facility garuda should succeed #TC-1389', async function () {
      let body = generateBodyCheckLoan(borrowerNumber, email);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].Line_facility).to.eql(`${lineNumber}`);
    });
    it('Check loan line facility garuda with line facility status is inactive should succeed #TC-1390', async function () {
      await changeStatusLF(lineNumber, 'N');

      let body = generateBodyCheckLoan(borrowerNumber, email);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].Line_facility).to.eql(`${lineNumber}`);
    });
    it('Check loan line facility garuda with line facility status is expired should succeed #TC-1391', async function () {
      this.skip();
      await changeStatusLF(lineNumber, 'E');

      let body = generateBodyCheckLoan(borrowerNumber, email);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].Line_facility).to.eql(`${lineNumber}`);
    });
    it('Check all loan line facility garuda when have more than 1 loan should succeed #TC-1392', async function () {
      await applyLoan(borrowerNumber, email, lineNumber);

      let body = generateBodyCheckLoan(borrowerNumber, email);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].Line_facility).to.eql(`${lineNumber}`);
      expect(res.body.data[1].loan_status).to.eql('In Review');
      expect(res.body.data[1].Line_facility).to.eql(`${lineNumber}`);
    });
    it('Check all loan line facility garuda when have more than 1 loan & have more than 1 LF should succeed #TC-1393', async function () {
      const resCreateLF = await createLineFacility(lineNumber, borrowerNumber, email);
      let lineNumberOther = resCreateLF.body.data[0].blf_number;
      await changeStatusLF(lineNumberOther, 'Y');
      await applyLoan(borrowerNumber, email, lineNumberOther);

      let body = generateBodyCheckLoan(borrowerNumber, email);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].Line_facility).to.eql(`${lineNumber}`);
      expect(res.body.data[1].loan_status).to.eql('In Review');
      expect(res.body.data[1].Line_facility).to.eql(`${lineNumberOther}`);
    });
    it('Check spesific loan line facility garuda when have more than 1 loan should succeed #TC-1394', async function () {
      await applyLoan(borrowerNumber, email, lineNumber);

      let body = generateBodyCheckLoan(borrowerNumber, email);
      const resAllLoan = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      let loanNumber = resAllLoan.body.data[1].loan_number;

      let bodySpesificLoan = generateBodyCheckLoan(borrowerNumber, email);
      bodySpesificLoan.loan_number = loanNumber;

      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodySpesificLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(200);
      expect(res.body.data[0].loan_status).to.eql('In Review');
      expect(res.body.data[0].loan_number).to.eql(`${loanNumber}`);
    });
  });

  describe('#negative', () => {
    it('Check loan line facility garuda when the borrower never apply loan should be failed #TC-1395', async function () {
      let bodyRegOther = generateBodyRegist();
      emailOther = bodyRegOther.personal_info.email;

      const resBasicRegOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegOther);

      borrowerNumberOther = resBasicRegOther.body.data.borrower_number;

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      const resCompDataOther = await chai
        .request(legacyBaseUrl)
        .post(urlCompletingData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      lineNumberOther = resCompDataOther.body.data.line_facility[0].blf_number;
      await changeStatusLF(lineNumberOther, 'Y');

      let body = generateBodyCheckLoan(borrowerNumberOther, emailOther);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(400);
    });
    it('Check loan line facility after borrower send request basic registration should be failed #TC-1396', async function () {
      let bodyRegOther = generateBodyRegist();
      emailOther = bodyRegOther.personal_info.email;

      const resBasicRegOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegOther);

      borrowerNumberOther = resBasicRegOther.body.data.borrower_number;

      let body = generateBodyCheckLoan(borrowerNumberOther, emailOther);
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(400);
    });
    it('Check spesific loan line facility garuda from another borrower should be failed #TC-1397', async function () {
      let bodyRegOther = generateBodyRegist();
      emailOther = bodyRegOther.personal_info.email;

      const resBasicRegOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegOther);

      borrowerNumberOther = resBasicRegOther.body.data.borrower_number;

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      const resCompDataOther = await chai
        .request(legacyBaseUrl)
        .post(urlCompletingData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      lineNumberOther = resCompDataOther.body.data.line_facility[0].blf_number;
      await changeStatusLF(lineNumberOther, 'Y');
      await applyLoan(borrowerNumberOther, emailOther, lineNumberOther);

      let otherBody = generateBodyCheckLoan(borrowerNumberOther, emailOther);
      const resOtherLoan = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(otherBody);

      let loanNumber = resOtherLoan.body.data[0].loan_number;

      let body = generateBodyCheckLoan(borrowerNumber, email);
      body.loan_number = loanNumber;
      const startTime = await help.startTime();
      const res = await chai
        .request(legacyBaseUrl)
        .post(url)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-1022');

      expect(res.body.partner_name).to.eql('Garuda');
      expect(res.body.meta.code).to.eql(400);
    });
  });
});

async function changeStatusLF(lineNumber, status) {
  let knex = require('knex')(bizDbConfig);
  return knex('borrower_loan_facility')
    .where({
      blf_number: lineNumber
    })
    .update({ blf_status: status })
    .then(function () {
      return { updated: true };
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      knex.destroy();
    });
}

async function createLineFacility(lineNumber, borrowerNumber, email) {
  await changeStatusLF(lineNumber, 'N');

  let bodyCreateLF = generateBodyCreateLF(borrowerNumber, email);
  const resCreateLF = await chai
    .request(legacyBaseUrl)
    .post(urlCreateLF)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': key
      })
    )
    .send(bodyCreateLF);

  return resCreateLF;
}

async function applyLoan(borrowerNumber, email, lineNumber) {
  let bodyApplyLoan = generateBodyApplyLoan(borrowerNumber, email, lineNumber);
  const resApplyLoan = await chai
    .request(legacyBaseUrl)
    .post(urlApplyLoan)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': key
      })
    )
    .send(bodyApplyLoan);

  return resApplyLoan;
}

function generateBodyRegist() {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} Garuda`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: `garuda.${help.randomEmail()}`,
      title: 4
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
      company_name: `${help.randomCompanyName()} Garuda`,
      company_type: 2,
      business_category: 11,
      business_type: 10,
      company_desc: `${help.randomAlphaNumeric(10)} company description`,
      employee_number: `${help.randomInteger(3)}`,
      year_of_establishment: 2015,
      company_address: `${randAddress.address}`,
      company_province: `${randAddress.province.name}`,
      company_city: `${randAddress.city.name}`,
      company_district: `${randAddress.district.name}`,
      company_sub_district: `${randAddress.subDistrict.name}`,
      company_postal_code: `${randAddress.postalCode}`,
      company_phone_number: `${help.randomPhoneNumber(10)}`,
      fax_number: `${help.randomAlphaNumeric(32)}`,
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
    borrower_type: '1'
  };
  return body;
}

function generateBodyCreateLF(borrowerNumber, email) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`
  };
  return body;
}

function generateBodyApplyLoan(borrowerNumber, email, lineFacilityNumber) {
  let body = {
    personal_info: {
      email: email,
      borrower_number: borrowerNumber,
      line_facility_number: lineFacilityNumber
    },
    loan_data: {
      invoice_amount: 100000000,
      loan_amount: 10000000,
      invoice_tenor: 120,
      invoice_number: `PO-Garuda-${help.randomAlphaNumeric(5)}`,
      invoice_date: help.backDateByDays(1),
      payor_name: 1,
      payor_person_division: 'Division Finance',
      payor_contact_person: help.randomFullName(),
      payor_person_phone_number: help.randomInteger(10),
      payor_person_extension: help.randomInteger(3),
      po_documents: {
        po_document_name: `filePO-Garuda-${help.randomAlphaNumeric(4)}`,
        po_document_file_string: 'https://www.w3schools.com/howto/img_forest.jpg'
      },
      supporting_info: {
        doc_name1: `filePO-Garuda-${help.randomAlphaNumeric(4)}`,
        doc_file1: 'https://www.w3schools.com/howto/img_forest.jpg',
        doc_name2: `filePO-Garuda-${help.randomAlphaNumeric(4)}`,
        doc_file2: 'https://www.w3schools.com/howto/img_forest.jpg',
        doc_name3: `filePO-Garuda-${help.randomAlphaNumeric(4)}`,
        doc_file3: 'https://www.w3schools.com/howto/img_forest.jpg'
      }
    }
  };
  return body;
}

function generateBodyCheckLoan(borrowerNumber, email) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`,
    loan_number: ''
  };
  return body;
}
