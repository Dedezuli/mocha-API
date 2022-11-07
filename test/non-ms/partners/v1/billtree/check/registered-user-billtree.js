const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

const urlRegistration = '/partners/v1/billtree/basic/registration';
const urlCompData = '/partners/v1/billtree/completing/registration';
const urlCheckUser = '/partners/v1/billtree/check/registered-user';
const legacyBaseUrl = request.getLegacyUrl();
const key = help.getBilltreeKey();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

describe.skip('Check Registered User', () => {
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

    npwpNumber = resCompData.body.data.company_info.company_npwp_number;

    report.setInfo(this, `Success to regist Billtree with borrower number ${borrowerNumber}, email ${email}`);
  });
  describe('#smoke', () => {
    it('Success check user when the npwp has registered in investree #TC-1159', async function () {
      let bodyCheckUser = generateCheckUser(npwpNumber);

      const startTime = await help.startTime();
      const resCheckUser = await chai
        .request(legacyBaseUrl)
        .post(urlCheckUser)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckUser);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckUser, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'BIZ-414');

      expect(resCheckUser.body.partner_name).to.eql('Billtree');
      expect(resCheckUser.body.meta.code).to.eql(200);
    });

    it('Success check user when status borrower is inactive #TC-1160', async function () {
      await changeStatusBorrower(borrowerNumber, 'N');
      let bodyCheckUser = generateCheckUser(npwpNumber);

      const startTime = await help.startTime();
      const resCheckUser = await chai
        .request(legacyBaseUrl)
        .post(urlCheckUser)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckUser);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckUser, responseTime);
      report.setSeverity(this, 'Low');
      report.setIssue(this, 'BIZ-414');

      expect(resCheckUser.body.partner_name).to.eql('Billtree');
      expect(resCheckUser.body.meta.code).to.eql(200);
    });

    it('Success check user when the npwp borrower is rejected #TC-1161', async function () {
      await changeStatusBorrower(borrowerNumber, 'R');
      let bodyCheckUser = generateCheckUser(npwpNumber);

      const startTime = await help.startTime();
      const resCheckUser = await chai
        .request(legacyBaseUrl)
        .post(urlCheckUser)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckUser);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckUser, responseTime);
      report.setSeverity(this, 'Low');
      report.setIssue(this, 'BIZ-414');

      expect(resCheckUser.body.partner_name).to.eql('Billtree');
      expect(resCheckUser.body.meta.code).to.eql(200);
    });
  });
  describe('#negative', () => {
    it('Failed check user when the npwp not registered in investree #TC-1162', async function () {
      npwpNumberOther = help.randomInteger('NPWP');
      let bodyCheckUser = generateCheckUser(npwpNumberOther);

      const startTime = await help.startTime();
      const resCheckUser = await chai
        .request(legacyBaseUrl)
        .post(urlCheckUser)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyCheckUser);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resCheckUser, responseTime);
      report.setSeverity(this, 'Blocker');
      report.setIssue(this, 'BIZ-414');

      expect(resCheckUser.body.partner_name).to.eql('Billtree');
      expect(resCheckUser.body.meta.code).to.eql(400);
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

function generateCheckUser(npwpNumber) {
  let body = {
    company_npwp_number: npwpNumber
  };
  return body;
}
