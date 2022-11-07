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
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let borrowerType;
let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';

describe('Apply loan anchor line facility (ALF)', () => {
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

    const resCreate = await chai
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

    report.setInfo(this, `Success to regist Billtree with borrower number ${borrowerNumber}, email ${email}`);
  });
  describe('#smoke', () => {
    it('Apply loan alf invoice conventional should success #TC-471', async function () {
      borrowerType = 1;
      await completingData(borrowerType);
      const resCreateAlf = await createAlf(borrowerType);
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(200);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
      expect(resApplyLoan.body.data.loan_status).to.eql('In Review');
      expect(resApplyLoan.body.data.loan_type).to.eql('Konvensional');
      expect(resApplyLoan.body.data.sub_loan_type).to.eql('Invoice Financing');
    });

    it('Apply loan alf invoice syariah should success #TC-472', async function () {
      borrowerType = 2;
      await completingData(borrowerType);
      const resCreateAlf = await createAlf(borrowerType);
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(200);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
      expect(resApplyLoan.body.data.loan_status).to.eql('In Review');
      expect(resApplyLoan.body.data.loan_type).to.eql('Syariah');
      expect(resApplyLoan.body.data.sub_loan_type).to.eql('Invoice Financing');
    });

    it('Apply loan invoice more than one time should success #TC-473', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyLoanOne = generateInvoiceLoan(email, borrowerNumber, lineNumber);

      await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoanOne);

      let bodyApplyLoanTwo = generateInvoiceLoan(email, borrowerNumber, lineNumber);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyLoanTwo);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(200);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
      expect(resApplyLoan.body.data.loan_status).to.eql('In Review');
      expect(resApplyLoan.body.data.sub_loan_type).to.eql('Invoice Financing');
    });
  });

  describe('#negative', () => {
    it('Apply loan alf invoice more than capacity should be failed #TC-474', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      bodyApplyInvoiceLoan.loan_data.loan_amount =
        resCreateAlf.body.data[0].capacity_line_facility + bodyApplyInvoiceLoan.loan_data.loan_amount;
      bodyApplyInvoiceLoan.vendor_info.invoice_amount =
        resCreateAlf.body.data[0].capacity_line_facility + bodyApplyInvoiceLoan.vendor_info.invoice_amount;
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when loan amount more than 80% invoice amount should be failed #TC-475', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      bodyApplyInvoiceLoan.loan_data.loan_amount = bodyApplyInvoiceLoan.vendor_info.invoice_amount;
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice with invalid line number should be failed #TC-476', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      bodyApplyInvoiceLoan.personal_info.line_facility_number = bodyApplyInvoiceLoan.vendor_info.invoice_number;
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when loan amount Rp 0 should be failed #TC-477', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      bodyApplyInvoiceLoan.loan_data.loan_amount = 0;
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice with fill loan_due_date more than max loan tenor should be failed #TC-478', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      bodyApplyInvoiceLoan.loan_data.loan_due_date = 300;
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when status alf is inactive should be failed #TC-479', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;
      await changeStatusAlf(lineNumber, 'N');

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when status alf is expired should be failed #TC-480', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;
      await changeStatusAlf(lineNumber, 'E');

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when status anchor is inactive should be success #TC-481', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;
      await changeStatusAnchor(emailPic, 'N');

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      await changeStatusAnchor(emailPic, 'Y');

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });

    it('Apply loan alf invoice when status anchor is expired should be success #TC-482', async function () {
      await completingData();
      const resCreateAlf = await createAlf();
      let lineNumber = resCreateAlf.body.data[0].line_facility_number;
      await changeStatusAnchor(emailPic, 'E');

      let bodyApplyInvoiceLoan = generateInvoiceLoan(email, borrowerNumber, lineNumber);
      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(legacyBaseUrl)
        .post(urlApplyInvoiceLoan)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyApplyInvoiceLoan);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-418');

      expect(resApplyLoan.body.meta.code).to.eql(400);
      expect(resApplyLoan.body.partner_name).to.eql('Billtree');
    });
  });
});

async function changeStatusAlf(lineNumber, status) {
  let knex = require('knex')(bizDbConfig);
  return knex('anchor_line_facility')
    .where({
      alf_line_number: lineNumber
    })
    .update({ alf_status: status })
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

async function checkAnchorId(emailPic) {
  let knex = require('knex')(bizDbConfig);
  let data = await knex('anchor_data').select('ad_id').first().where({
    ad_email_pic: emailPic
  });
  return data.ad_id;
}

async function completingData(borrowerType = 1) {
  let bodyCompData = generateBodyCompletingData(borrowerNumber, email);
  bodyCompData.company_info.borrower_type = `${borrowerType}`;

  const resCompData = await chai
    .request(legacyBaseUrl)
    .post(urlCompData)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': key
      })
    )
    .send(bodyCompData);
  return resCompData;
}

async function createAlf(borrowerType = 1) {
  let bodyCreateAlf = generateCreateAlf(borrowerNumber, borrowerType, email, anchorId);

  const resCreateAlf = await chai
    .request(legacyBaseUrl)
    .post(urlCreateAlf)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': key
      })
    )
    .send(bodyCreateAlf);

  return resCreateAlf;
}

function generateCreateAlf(borrowerNumber, borrowerType, email, anchorId) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`,
    anchor_id: anchorId,
    borrower_type: `${borrowerType}`,
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
