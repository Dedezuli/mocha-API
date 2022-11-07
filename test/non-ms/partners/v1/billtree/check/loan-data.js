const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

const urlCreateAnchor = '/partners/v1/business/qa/anchor-create';
const urlDeleteAnchor = '/partners/v1/business/qa/anchor-delete';
const urlRegistration = '/partners/v1/billtree/basic/registration';
const urlCompData = '/partners/v1/billtree/completing/registration';
const urlCreateAlf = '/partners/v1/billtree/create/anchor-line-facility';
const urlApplyInvoiceLoan = '/partners/v1/billtree/apply/loan';
const urlCheckLoan = '/partners/v1/billtree/check/loan';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';
let lineNumber;
let loanNumber;

describe('Check loan data Billtree', () => {
  before(async function () {
    let bodyDeleteAnchor = generateDeleteAnchor(payorName);
    const resDelete = await chai
      .request(legacyBaseUrl)
      .post(urlDeleteAnchor)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': '',
          'X-Investree-Signature': '',
          'X-Investree-TimeStamp': ''
        })
      )
      .send(bodyDeleteAnchor);

    report.setInfo(this, resDelete);

    let bodyCreateAnchor = generateCreateAnchor(payorName);
    emailPic = bodyCreateAnchor.pic_email;

    await chai
      .request(legacyBaseUrl)
      .post(urlCreateAnchor)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': '',
          'X-Investree-Signature': '',
          'X-Investree-TimeStamp': ''
        })
      )
      .send(bodyCreateAnchor);

    anchorId = await checkAnchorId(emailPic);

    report.setInfo(this, `Success to create anchor with email PIC ${emailPic}`);

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

    let bodyCompData = generateBodyCompletingData(borrowerNumber, email);
    await chai
      .request(legacyBaseUrl)
      .post(urlCompData)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyCompData);

    let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);

    const resCreateAlf = await chai
      .request(legacyBaseUrl)
      .post(urlCreateAlf)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyCreateAlf);

    lineNumber = resCreateAlf.body.data[0].line_facility_number;

    report.setInfo(this, resRegist);

    report.setInfo(
      this,
      `Success to regist Billtree with borrower number ${borrowerNumber}, email ${email} with line number ${lineNumber}`
    );
  });

  beforeEach(async function () {
    let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
    const resApplyLoan = await chai
      .request(legacyBaseUrl)
      .post(urlApplyInvoiceLoan)
      .set(
        request.createLegacyHeaders({
          'X-Investree-Key': key
        })
      )
      .send(bodyApplyInvoiceLoan);

    loanNumber = resApplyLoan.body.data.loan_number;

    report.setInfo(this, resApplyLoan);
  });
  describe('#smoke', () => {
    it('Check loan data with valid email & borrower number should success #TC-1022', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(200);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with specific loan number should success #TC-1023', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      bodyCheckLoan.loan_number = loanNumber;
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(200);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with specific line facility number should success #TC-1024', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      bodyCheckLoan.line_facility_number = lineNumber;
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(200);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with specific loan number & line facility number should success #TC-1025', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      bodyCheckLoan.loan_number = loanNumber;
      bodyCheckLoan.line_facility_number = lineNumber;
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(200);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });
  });

  describe('#negative', () => {
    it('Check loan data with unregistered email should be failed #TC-1026', async function () {
      let emailOther = `${help.randomEmail()}`;
      let bodyCheckLoan = generateCheckLoan(emailOther, borrowerNumber);
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(400);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with invalid borrower number should be failed #TC-1027', async function () {
      let borrowerNumberOther = `${help.randomInteger(8)}`;
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumberOther);
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(400);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with invalid loan number should be failed #TC-1028', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      bodyCheckLoan.loan_number = `${help.randomAlphaNumeric()}`;
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(400);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data with invalid line facility number should be failed #TC-1029', async function () {
      let bodyCheckLoan = generateCheckLoan(email, borrowerNumber);
      bodyCheckLoan.line_facility_number = `${help.randomAlphaNumeric()}`;
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(400);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });

    it('Check loan data when the borrower does not have any loans should be failed #TC-1030', async function () {
      let bodyRegistOther = generateBodyRegist();
      emailOther = bodyRegistOther.personal_info.email;

      const resRegistOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegistOther);
      borrowerNumberOther = resRegistOther.body.data.borrower_number;

      let bodyCompDataOther = generateBodyCompletingData(borrowerNumberOther, emailOther);
      await chai
        .request(legacyBaseUrl)
        .post(urlCompData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      let bodyCreateAlfOther = generateCreateAlf(borrowerNumberOther, emailOther, anchorId);
      await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlfOther);

      let bodyCheckLoan = generateCheckLoan(emailOther, borrowerNumberOther);
      const startTime = await help.startTime();
      const resCheckLoan = await chai
        .request(legacyBaseUrl)
        .post(urlCheckLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-419');

      expect(resCheckLoan.body.meta.code).to.eql(400);
      expect(resCheckLoan.body.partner_name).to.eql('Billtree');
    });
  });
});

async function checkAnchorId(emailPic) {
  let knex = require('knex')(bizDbConfig);
  let data = await knex('anchor_data').select('ad_id').first().where({
    ad_email_pic: emailPic
  });
  return data.ad_id;
}

function generateCheckLoan(email, borrowerNumber) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`,
    line_facility_number: '',
    loan_number: ''
  };
  return body;
}

function generateCreateAlf(borrowerNumber, email, anchorId) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`,
    anchor_id: anchorId,
    borrower_type: '1',
    line_facility_number: '',
    affiliate: '1',
    since_at: `${help.backDateByYear(1)}`,
    average_monthly_transaction: help.randomLoanAmount()
  };
  return body;
}

function generateInvoiceLoan(email, borrowerNumber, lineNumber) {
  let body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`,
      line_facility_number: `${lineNumber}`
    },
    loan_data: {
      loan_amount: 1000000,
      loan_due_date: `${help.futureDateByDays(120)}`
    },
    vendor_info: {
      invoice_amount: 30000000,
      invoice_number: `INV-BT-${help.randomAlphaNumeric(5)}`,
      invoice_date: `${help.futureDateByDays(1)}`,
      invoice_due_date: `${help.futureDateByDays(10)}`,
      invoice_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
      payor_id: 1,
      payor_contact_person: `${help.randomAlphaNumeric(5)}`,
      payor_person_phone_number: help.randomPhoneNumber(12)
    }
  };
  return body;
}

function generateCreateAnchor(payorName) {
  let randAddress = help.randomAddress();
  let body = {
    payor_name: payorName,
    address: `${randAddress.address}`,
    province: `${randAddress.province.id}`,
    city: `${randAddress.city.id}`,
    district: `${randAddress.district.id}`,
    village: `${randAddress.subDistrict.id}`,
    postal_code: `${randAddress.postalCode}`,
    tax_number: `${help.randomInteger('NPWP')}`,
    tax_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
    anchor_cap: '2000000000000',
    anchor_grade: 'A',
    anchor_rate: '12',
    anchor_expire_date: `${help.futureDateByDays(10)}`,
    credit_proposal_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
    revenue_sharing_investree: 80,
    revenue_sharing_anchor: 20,
    pic_name: `${help.randomAlphaNumeric(5)} Anchor`,
    pic_email: `Anchor.${help.randomEmail()}`,
    pic_phonenumber: help.randomPhoneNumber(12),
    pic_position: 1,
    pic_address: `${randAddress.address}`,
    pic_id_card: help.randomPhoneNumber(12),
    pic_id_card_file: 'https://oss.investree.tech/survey_file/survey_file_403033_1_1598252699139.pdf',
    anchor_bank_id: 1,
    anchor_bank_account_name: `${help.randomAlphaNumeric(5)} Anchor`,
    anchor_bank_account_number: help.randomPhoneNumber(6),
    anchor_partnership_type: [1, 2]
  };
  return body;
}

function generateDeleteAnchor(payorName) {
  let body = {
    anchor_name: payorName
  };
  return body;
}

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
