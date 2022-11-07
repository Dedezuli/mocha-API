const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

const urlCreateAnchor = '/partners/v1/business/qa/anchor-create';
const urlDeleteAnchor = '/partners/v1/business/qa/anchor-delete';
const urlAnchorFacilityData = '/partners/v1/billtree/anchor/facility-data';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let emailPic;
let anchorId;
let payorName = 'ABB SAKTI INDUSTRI';

describe('Get Anchor Facility Data', () => {
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
    it('Get anchor facility data when status anchor is active should success #TC-1151', async function () {
      let bodyAnchorFacilityData = generateAnchorFacilityData(anchorId);
      const startTime = await help.startTime();
      const resAnchorFacilityData = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorFacilityData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorFacilityData);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorFacilityData, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-422');

      expect(resAnchorFacilityData.body.meta.code).to.eql(200);
      expect(resAnchorFacilityData.body.partner_name).to.eql('Billtree');
      expect(resAnchorFacilityData.body.data.anchor_name).to.eql(payorName);
      expect(resAnchorFacilityData.body.data.anchor_status).to.eql('Active');
    });

    it('Get anchor facility data when status anchor is inactive should success #TC-1152', async function () {
      await changeStatusAnchor(emailPic, 'N');
      let bodyAnchorFacilityData = generateAnchorFacilityData(anchorId);
      const startTime = await help.startTime();
      const resAnchorFacilityData = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorFacilityData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorFacilityData);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorFacilityData, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-422');

      expect(resAnchorFacilityData.body.meta.code).to.eql(200);
      expect(resAnchorFacilityData.body.partner_name).to.eql('Billtree');
      expect(resAnchorFacilityData.body.data.anchor_name).to.eql(payorName);
      expect(resAnchorFacilityData.body.data.anchor_status).to.eql('Inactive');
    });

    it('Get anchor facility data when status anchor is expired should success #TC-1153', async function () {
      await changeStatusAnchor(emailPic, 'E');
      let bodyAnchorFacilityData = generateAnchorFacilityData(anchorId);
      const startTime = await help.startTime();
      const resAnchorFacilityData = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorFacilityData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorFacilityData);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorFacilityData, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-422');

      expect(resAnchorFacilityData.body.meta.code).to.eql(200);
      expect(resAnchorFacilityData.body.partner_name).to.eql('Billtree');
      expect(resAnchorFacilityData.body.data.anchor_name).to.eql(payorName);
      expect(resAnchorFacilityData.body.data.anchor_status).to.eql('Expired');
    });
  });

  describe('#negative', () => {
    it('Get anchor facility data with invalid anchor should be failed #TC-1154', async function () {
      let anchorIdOther = help.randomInteger(5);
      let bodyAnchorFacilityData = generateAnchorFacilityData(anchorIdOther);
      const startTime = await help.startTime();
      const resAnchorFacilityData = await chai
        .request(legacyBaseUrl)
        .post(urlAnchorFacilityData)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyAnchorFacilityData);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resAnchorFacilityData, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-422');

      expect(resAnchorFacilityData.body.meta.code).to.eql(400);
      expect(resAnchorFacilityData.body.partner_name).to.eql('Billtree');
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

function generateAnchorFacilityData(anchorId) {
  let body = {
    anchor_id: anchorId
  };
  return body;
}
