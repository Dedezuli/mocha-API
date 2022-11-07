const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

const urlRegistration = '/partners/v1/billtree/basic/registration';
const urlCompData = '/partners/v1/billtree/completing/registration';
const urlCreateAlf = '/partners/v1/billtree/create/anchor-line-facility';
const urlCreateAnchor = '/partners/v1/business/qa/anchor-create';
const urlDeleteAnchor = '/partners/v1/business/qa/anchor-delete';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';
let payorNameOther = 'Adira Dinamika Multi Finance, Tbk';

describe('Create Anchor Line Facility (ALF)', () => {
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

    report.setInfo(this, resRegist);

    report.setInfo(this, `Success to regist Billtree with borrower number ${borrowerNumber}, email ${email}`);
  });

  describe('#smoke', () => {
    it('Create alf conventional should success #TC-462', async function () {
      await completingData();

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(200);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
      expect(resCreateAlf.body.data[0].facility_status).to.eql('Aktif');
      expect(resCreateAlf.body.data[0].loan_facility_type).to.eql('Konvensional');
    });

    it('Create alf syariah should success #TC-463', async function () {
      await completingData(2);

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      bodyCreateAlf.borrower_type = '2';

      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(200);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
      expect(resCreateAlf.body.data[0].facility_status).to.eql('Aktif');
      expect(resCreateAlf.body.data[0].loan_facility_type).to.eql('Syariah');
    });

    it('Create alf with different anchor should success #TC-464', async function () {
      await completingData();

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

      report.setPayload(this, resCreateAlf);

      let bodyDeleteOtherAnchor = generateDeleteAnchor(payorNameOther);
      const resDeleteOtherAnchor = await chai
        .request(legacyBaseUrl)
        .post(urlDeleteAnchor)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': '',
            'X-Investree-Signature': '',
            'X-Investree-TimeStamp': ''
          })
        )
        .send(bodyDeleteOtherAnchor);

      report.setInfo(this, resDeleteOtherAnchor);

      let bodyCreateOtherAnchor = generateCreateAnchor(payorNameOther);
      let emailPicOther = bodyCreateOtherAnchor.pic_email;

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
        .send(bodyCreateOtherAnchor);

      const anchorIdOther = await checkAnchorId(emailPicOther);

      let bodyCreateAlfOther = generateCreateAlf(borrowerNumber, email, anchorIdOther);

      const startTime = await help.startTime();
      const resCreateAlfOther = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlfOther);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlfOther, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlfOther.body.meta.code).to.eql(200);
      expect(resCreateAlfOther.body.partner_name).to.eql('Billtree');
      expect(resCreateAlfOther.body.data[0].facility_status).to.eql('Aktif');
    });
  });
  describe('#negative', () => {
    it('Create alf when borrower type conventional & syariah should be failed #TC-465', async function () {
      await completingData();

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      bodyCreateAlf.borrower_type = '1,2';
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
    });

    it('Create alf conventional when borrower type is syariah should be failed #TC-466', async function () {
      await completingData(2);

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      bodyCreateAlf.borrower_type = '1';
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
    });

    it('Create alf syariah when borrower type is conventional should be failed #TC-467', async function () {
      await completingData(1);

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      bodyCreateAlf.borrower_type = '2';
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
    });

    it.skip('Create alf when cap alf more than available amount anchor should be failed #TC-468', async function () {
      await completingData();

      let bodyDeleteOtherAnchor = generateDeleteAnchor(payorNameOther);
      const resDeleteOtherAnchor = await chai
        .request(legacyBaseUrl)
        .post(urlDeleteAnchor)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': '',
            'X-Investree-Signature': '',
            'X-Investree-TimeStamp': ''
          })
        )
        .send(bodyDeleteOtherAnchor);

      report.setInfo(this, resDeleteOtherAnchor);

      let bodyCreateOtherAnchor = generateCreateAnchor(payorNameOther);
      bodyCreateOtherAnchor.anchor_cap = '10000';
      let emailPicOther = bodyCreateOtherAnchor.pic_email;

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
        .send(bodyCreateOtherAnchor);

      const anchorIdOther = await checkAnchorId(emailPicOther);

      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorIdOther);
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
    });

    it('Create alf when status anchor is inactive should be failed #TC-469', async function () {
      await completingData();
      await changeStatusAnchor(emailPic, 'N');
      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
    });

    it('Create alf when status anchor is expired should be failed #TC-470', async function () {
      await completingData();
      await changeStatusAnchor(emailPic, 'E');
      let bodyCreateAlf = generateCreateAlf(borrowerNumber, email, anchorId);
      const startTime = await help.startTime();
      const resCreateAlf = await chai
        .request(legacyBaseUrl)
        .post(urlCreateAlf)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCreateAlf);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCreateAlf, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-417');

      expect(resCreateAlf.body.meta.code).to.eql(400);
      expect(resCreateAlf.body.partner_name).to.eql('Billtree');
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

function generateCreateAlf(borrowerNumber, email, id) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`,
    anchor_id: id,
    borrower_type: '1',
    line_facility_number: '',
    affiliate: '1',
    since_at: `${help.backDateByYear(1)}`,
    average_monthly_transaction: help.randomLoanAmount()
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
