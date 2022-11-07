const help = require('@lib/helper');
const report = require('@lib/report');
const chai = require('chai');
const vars = require('@fixtures/vars');
const request = require('@lib/request');
const expect = chai.expect;

let email;
let borrowerNumber;
let key = vars.keyADW;

const urlRegistration = '/partners/v1/business/registration';
const urlCompData = '/partners/v1/business/registration/completing';
const urlApplyLoan = '/partners/v1/business/apply/pre-invoice';
const legacyBaseUrl = request.getLegacyUrl();
const keyMBIZDM = help.getMbizKey('DM');
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

describe('Apply Loan Pre-Invoice(PO) ADW Partner', () => {
  beforeEach(async function () {
    let bodyRegist = generateBodyRegist();
    email = bodyRegist.personal_info.email;

    let resRegist = await chai
      .request(legacyBaseUrl)
      .post(urlRegistration)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyRegist);

    borrowerNumber = resRegist.body.data.borrower_number;

    report.setInfo(this, resRegist);

    let bodyCompData = generateBodyCompletingData(borrowerNumber, email);

    let resCompData = await chai
      .request(legacyBaseUrl)
      .post(urlCompData)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyCompData);

    report.setInfo(this, resCompData);
  });

  describe('#smoke', () => {
    it('Apply loan with borrower type conventional should succeed #TC-1003', async function () {
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(200);
    });

    it('Apply loan with borrower type syariah should succeed #TC-1004', async function () {
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);
      bodyApplyLoan.loan_data.loan_type = '2';

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(200);
    });

    it('Apply loan more than one time should success #TC-1005', async function () {
      let bodyApplyLoanOne = generateBodyAL(borrowerNumber, email);
      await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoanOne);

      let bodyApplyLoanTwo = generateBodyAL(borrowerNumber, email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoanTwo);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Apply loan when status borrower is inactive should failed #TC-1006', async function () {
      await changeStatusBorrower(borrowerNumber, 'N');
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan when status borrower is rejected should failed #TC-1007', async function () {
      await changeStatusBorrower(borrowerNumber, 'R');
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan with different key when completing data should failed #TC-1008', async function () {
      this.skip();
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyMBIZDM
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');

      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan PO when loan amount >50% PO amount should be failed #TC-1009', async function () {
      let bodyApplyLoan = generateBodyAL(borrowerNumber, email);
      bodyApplyLoan.loan_data.loan_amount = 30000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan PO with conventional loan for syariah borrower should failed #TC-1010', async function () {
      let bodyRegistOther = generateBodyRegist();
      let emailOther = bodyRegistOther.personal_info.email;

      let resRegistOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegistOther);

      let borrowerNumberOther = resRegistOther.body.data.borrower_number;

      report.setInfo(this, resRegistOther);

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      bodyCompDataOther.borrower_type = '2';

      let resCompDataOther = await chai
        .request(legacyBaseUrl)
        .post(urlCompData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      report.setInfo(this, resCompDataOther);

      let bodyApplyLoan = generateBodyAL(borrowerNumberOther, emailOther);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(400);
    });

    it('Apply loan PO with syariah loan for conventional borrower should failed #TC-1011', async function () {
      let bodyRegistOther = generateBodyRegist();
      let emailOther = bodyRegistOther.personal_info.email;

      let resRegistOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegistOther);

      let borrowerNumberOther = resRegistOther.body.data.borrower_number;

      report.setInfo(this, resRegistOther);

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      bodyCompDataOther.borrower_type = '1';

      let resCompDataOther = await chai
        .request(legacyBaseUrl)
        .post(urlCompData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      report.setInfo(this, resCompDataOther);

      let bodyApplyLoan = generateBodyAL(borrowerNumberOther, emailOther);
      bodyApplyLoan.loan_data.loan_type = '2';

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');

      expect(resApplyLoan.body.partner_name).to.eql('adw');
      expect(resApplyLoan.body.meta.code).to.eql(400);
    });
  });
});

async function changeStatusBorrower(borrowerNumber, status) {
  let knex = require('knex')(bizDbConfig);
  return knex('borrower_primary_data')
    .where({
      bpd_number: borrowerNumber
    })
    .update({ bpd_right_data: status })
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

function generateBodyAL(borrowerNumber, email) {
  let body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`
    },
    loan_data: {
      loan_type: 1,
      product_type: 3,
      po_amount: 30000000,
      loan_amount: 10000000,
      po_tenor: 120,
      po_number: `PO-ADW-${help.randomAlphaNumeric(5)}`,
      po_date: `${help.futureDateByDays(10)}`,
      payor_name: 1,
      payor_person_division: `ADW-${help.randomCompanyName}`,
      payor_contact_person: `ADW-${help.randomFullName}`,
      payor_person_phone_number: `${help.randomPhoneNumber}`,
      payor_person_extension: `${help.randomPhoneNumber}`,
      documents: {
        purchase_order_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf'
      },
      supporting_info: {
        doc_name1: 'XXXXXXX',
        doc_file1: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
        doc_name2: 'XXXXXXX',
        doc_file2: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
        doc_name3: 'XXXXXXX',
        doc_file3: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf'
      }
    }
  };
  return body;
}

function generateBodyRegist() {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} ADW`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: `ADW.${help.randomEmail()}`,
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
      company_name: `${help.randomCompanyName()} ADW`,
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
      akta_perubahan_terakhir_file: ''
    },
    borrower_type: '1,2'
  };
  return body;
}
