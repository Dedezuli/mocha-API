const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

const urlCreateAnchor = '/partners/v1/business/qa/anchor-create';
const urlDeleteAnchor = '/partners/v1/business/qa/anchor-delete';
const urlAnchorDetail = '/partners/v1/billtree/anchor/detail';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';

describe('Get Anchor Detail', () => {
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
  });

  describe('#smoke', () => {
    it('Get anchor detail when status anchor is active should success #TC-1155', async function () {
      let bodyAnchorDetail = generateAnchorDetail(anchorId);
      const startTime = await help.startTime();
      const resAnchorDetail = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorDetail)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorDetail);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorDetail, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-421');

      expect(resAnchorDetail.body.meta.code).to.eql(200);
      expect(resAnchorDetail.body.partner_name).to.eql('Billtree');
      expect(resAnchorDetail.body.status).to.eql('success');
      expect(resAnchorDetail.body.data.anchor_name).to.eql(payorName);
    });

    it('Get anchor detail when status anchor is inactive should success #TC-1156', async function () {
      await changeStatusAnchor(emailPic, 'N');
      let bodyAnchorDetail = generateAnchorDetail(anchorId);
      const startTime = await help.startTime();
      const resAnchorDetail = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorDetail)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorDetail);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorDetail, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-421');

      expect(resAnchorDetail.body.meta.code).to.eql(200);
      expect(resAnchorDetail.body.partner_name).to.eql('Billtree');
      expect(resAnchorDetail.body.status).to.eql('success');
      expect(resAnchorDetail.body.data.anchor_name).to.eql(payorName);
    });

    it('Get anchor detail when status anchor is expired should success #TC-1157', async function () {
      await changeStatusAnchor(emailPic, 'E');
      let bodyAnchorDetail = generateAnchorDetail(anchorId);
      const startTime = await help.startTime();
      const resAnchorDetail = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorDetail)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorDetail);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorDetail, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-421');

      expect(resAnchorDetail.body.meta.code).to.eql(200);
      expect(resAnchorDetail.body.partner_name).to.eql('Billtree');
      expect(resAnchorDetail.body.status).to.eql('success');
      expect(resAnchorDetail.body.data.anchor_name).to.eql(payorName);
    });
  });

  describe('#negative', () => {
    it('Get anchor detail with invalid anchor should be failed #TC-1158', async function () {
      let anchorIdOther = help.randomInteger(5);
      let bodyAnchorDetail = generateAnchorDetail(anchorIdOther);
      const startTime = await help.startTime();
      const resAnchorDetail = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorDetail)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorDetail);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorDetail, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-421');

      expect(resAnchorDetail.body.meta.code).to.eql(400);
      expect(resAnchorDetail.body.partner_name).to.eql('Billtree');
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

function generateAnchorDetail(anchorId) {
  let body = {
    anchor_id: anchorId
  };
  return body;
}
