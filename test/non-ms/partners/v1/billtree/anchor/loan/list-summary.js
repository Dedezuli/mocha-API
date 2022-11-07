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
const urlLoanList = '/partners/v1/billtree/anchor/loan/list-summary';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';
let payorNameOther = 'Adira Dinamika Multi Finance, Tbk';
let loanNumber;
let lineNumber;

describe('Get Anchor Loan List Summary', () => {
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
  });

  beforeEach(async function () {
    await changeStatusAnchor(emailPic, 'Y');
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
      `Success to regist Billtree with borrower number ${borrowerNumber}, email ${email} and alf with line number ${lineNumber}`
    );
  });

  describe('#smoke', () => {
    it('Get loan list with valid anchor should success #TC-483', async function () {
      await applyLoan();

      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
      expect(resLoanSummary.body.data.result[0].anchor_facility_line_number).to.eql(`${lineNumber}`);
    });

    it('Get loan list with specific loan number should success #TC-484', async function () {
      await applyLoan();

      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId, lineNumber);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
      expect(resLoanSummary.body.data.result[0].anchor_facility_line_number).to.eql(`${lineNumber}`);
    });

    it('Get loan list when a borrower has more than 1 loan should success #TC-486', async function () {
      await applyLoan();

      let bodyApplyInvoiceLoanOther = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const resApplyLoanOther = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoanOther);

      let loanNumberOther = resApplyLoanOther.body.data.loan_number;

      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });

    it('Get loan list when the anchor has more than 1 borrower should success #TC-485', async function () {
      await applyLoan();

      let bodyRegistOther = generateBodyRegist();
      email = bodyRegistOther.personal_info.email;
      let resRegistOther = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegistOther);

      borrowerNumber = resRegistOther.body.data.borrower_number;
      let bodyCompDataOther = generateBodyCompletingData(borrowerNumber, email);
      await chai
        .request(legacyBaseUrl)
        .post(urlCompData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCompDataOther);

      let bodyCreateAlfOther = generateCreateAlf(borrowerNumber, email, anchorId);
      const resCreateAlfOther = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlfOther);

      let lineNumberOther = resCreateAlfOther.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoanOther = generateInvoiceLoan(email, borrowerNumber, lineNumberOther);
      await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoanOther);

      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
    it('Get loan list when status alf is inactive should be success #TC-491', async function () {
      await applyLoan();
      await changeStatusAlf(lineNumber, 'N');
      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId, lineNumber);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
    it('Get loan list when status alf is expired should be success #TC-492', async function () {
      await applyLoan();
      await changeStatusAlf(lineNumber, 'E');
      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId, lineNumber);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
    it('Get loan list when status anchor is inactive should be success #TC-489', async function () {
      await applyLoan();
      await changeStatusAnchor(lineNumber, 'N');
      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId, lineNumber);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
    it('Get loan list when status anchor is expired should be success #TC-490', async function () {
      await applyLoan();
      await changeStatusAnchor(lineNumber, 'N');
      let bodyGetLoanSummary = generateBodyLoanSummary(anchorId, lineNumber);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(200);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
  });

  describe('#negative', () => {
    it('Get loan list when total loan is null should failed #TC-487', async function () {
      let bodyDeleteAnchorOther = generateDeleteAnchor(payorNameOther);
      await chai
        .request(legacyBaseUrl)
        .post(urlDeleteAnchor)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': '',
            'X-Investree-Signature': '',
            'X-Investree-TimeStamp': ''
          })
        )
        .send(bodyDeleteAnchorOther);

      let bodyCreateAnchorOther = generateCreateAnchor(payorNameOther);
      emailPicOther = bodyCreateAnchorOther.pic_email;
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
        .send(bodyCreateAnchorOther);

      let anchorIdOther = await checkAnchorId(emailPicOther);

      let bodyGetLoanSummary = generateBodyLoanSummary(anchorIdOther);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(400);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
    it('Get loan list with invalid anchor should be failed #TC-488', async function () {
      await applyLoan();

      let anchorIdOther = help.randomAlphaNumeric();
      let bodyGetLoanSummary = generateBodyLoanSummary(anchorIdOther);
      const startTime = help.startTime();
      const resLoanSummary = await chai
        .request(legacyBaseUrl)
        .post(urlLoanList)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyGetLoanSummary);

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, resLoanSummary, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-423');

      expect(resLoanSummary.body.meta.code).to.eql(400);
      expect(resLoanSummary.body.partner_name).to.eql('Billtree');
    });
  });
});

async function changeStatusAnchor(emailPic, status) {
  let knex = require('knex')(bizDbConfig);
  return knex('anchor_data')
    .where({
      ad_email_pic: emailPic
    })
    .update({ ad_status: status })
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

async function changeStatusAlf(lineNumber, status) {
  let knex = require('knex')(bizDbConfig);
  return knex('anchor_line_facility')
    .where({
      alf_line_number: lineNumber
    })
    .update({ alf_status: status });
}

async function checkAnchorId(emailPic) {
  let knex = require('knex')(bizDbConfig);
  let data = await knex('anchor_data').select('ad_id').first().where({
    ad_email_pic: emailPic
  });
  return data.ad_id;
}

async function applyLoan() {
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

  return resApplyLoan;
}

function generateBodyLoanSummary(anchorId, lineNumber = '') {
  let body = {
    anchor_id: `${anchorId}`,
    line_facility_number: `${lineNumber}`
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
    anchor_cap: '200000000000',
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
