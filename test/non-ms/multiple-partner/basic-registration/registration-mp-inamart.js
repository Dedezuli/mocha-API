const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
let chai = require('chai');
let chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const urlBasicBilltree = '/partners/v1/billtree/basic/registration';
const urlBasicAdw = '/partners/v1/business/registration';
const urlBasicGaruda = '/partners/v1/business/registration';
const urlBasicInamart = '/partners/v1/business/registration';
const urlBasicMbizDM = '/partners/v1.1/business/registration';

const urlCompDataBilltree = '/partners/v1/billtree/completing/registration';
const urlCompDataMbizDM = '/partners/v1.1/business/anchor/registration/completing';
const urlCompDataGaruda = '/partners/v1.1/business/registration/completing';
const urlCompDataAdw = '/partners/v1/business/registration/completing';
const apiLegacyBaseUrl = request.getLegacyUrl();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

let keyBilltree = vars.keyBilltree;
let keyAdw = vars.keyADW;
let keyGaruda = vars.keyGaruda;
let keyInamart = vars.keyInamart;
let keyMbizDM = vars.keyMbizDM;
let email;

describe('Basic Registration Multiple Partner', () => {
  beforeEach(async function () {
    email = `MPADW.${help.randomEmail()}`;
  });

  describe('#smoke', () => {
    it('Inamart basic registration using borrower who had already filled completing data via MbizDM should succeed #TC-1398', async function () {
      let borrowerNumber = await basicRegMbizDM(email);
      await compDataMbizDM(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using borrower who had already filled completing data via Garuda should succeed #TC-1399', async function () {
      let borrowerNumber = await basicRegGaruda(email);
      await compDataGaruda(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using borrower who had already filled completing data via ADW should succeed #TC-1400', async function () {
      let borrowerNumber = await basicRegAdw(email);
      await compDataAdw(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using borrower who had already filled completing data via Billtree should succeed #TC-1401', async function () {
      let borrowerNumber = await basicRegBilltree(email);
      await compDataBilltree(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using borrower who has more than 1 partner should succeed #TC-1402', async function () {
      let borrowerNumber = await basicRegGaruda(email);
      await compDataGaruda(email, borrowerNumber);
      await basicRegBilltree(email);
      await compDataBilltree(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using same phone number as borrower registered via another partner should succeed #TC-1403', async function () {
      let bodyRegistGaruda = generateBodyOtherPartner(email);
      let phoneNumber = bodyRegistGaruda.personal_info.phone_number;

      const resRegistGaruda = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicGaruda)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyGaruda
          })
        )
        .send(bodyRegistGaruda);
      let borrowerNumber = resRegistGaruda.body.data.borrower_number;

      await compDataGaruda(email, borrowerNumber);

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');
      bodyRegistInamart.personal_info.phone_number = phoneNumber;

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
    it('Inamart basic registration using borrower who has already registered via another partner with status inactive should succeed #TC-1404', async function () {
      let borrowerNumber = await basicRegGaruda(email);
      await compDataGaruda(email, borrowerNumber);
      await changeStatusBorrower(borrowerNumber, 'N');

      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(200);
    });
  });

  describe('#negative', () => {
    it('Inamart basic registration using MbizDM borrower that is still in basic registration should fail #TC-1405', async function () {
      await basicRegMbizDM(email);
      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(400);
    });
    it('Inamart basic registration using Garuda borrower that is still in basic registration should fail #TC-1406', async function () {
      await basicRegGaruda(email);
      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(400);
    });
    it('Inamart basic registration using ADW borrower that is still in basic registration should fail #TC-1407', async function () {
      await basicRegAdw(email);
      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(400);
    });
    it('Inamart basic registration using Billtree borrower that is still in basic registration should fail #TC-1408', async function () {
      await basicRegBilltree(email);
      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(400);
    });
    it('Inamart basic registration using borrower who has already registered via another partner with status rejected should succeed #TC-1409', async function () {
      let borrowerNumber = await basicRegGaruda(email);
      await compDataGaruda(email, borrowerNumber);
      await changeStatusBorrower(borrowerNumber, 'R');
      let bodyRegistInamart = generateBodyOtherPartner(email, 'Inamart');

      const startTime = await help.startTime();
      const resRegistInamart = await chai
        .request(apiLegacyBaseUrl)
        .post(urlBasicInamart)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': keyInamart
          })
        )
        .send(bodyRegistInamart);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resRegistInamart, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'BIZ-870');

      expect(resRegistInamart.body.partner_name).to.eql('Inamart');
      expect(resRegistInamart.body.meta.code).to.eql(400);
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

async function basicRegBilltree(email) {
  let bodyRegistBilltree = generateBodyBilltree(email);

  const resRegistBilltree = await chai
    .request(apiLegacyBaseUrl)
    .post(urlBasicBilltree)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyBilltree
      })
    )
    .send(bodyRegistBilltree);
  let borrowerNumber = resRegistBilltree.body.data.borrower_number;

  return borrowerNumber;
}
async function compDataBilltree(email, borrowerNumber) {
  let bodyCompDataBilltree = generateBodyCDBilltree(email, borrowerNumber);
  await chai
    .request(apiLegacyBaseUrl)
    .post(urlCompDataBilltree)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyBilltree
      })
    )
    .send(bodyCompDataBilltree);
  return bodyCompDataBilltree;
}

async function basicRegMbizDM(email) {
  let bodyRegistMbizDM = generateBodyMbiz(email);

  const resRegistMbizDM = await chai
    .request(apiLegacyBaseUrl)
    .post(urlBasicMbizDM)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyMbizDM
      })
    )
    .send(bodyRegistMbizDM);
  let borrowerNumber = resRegistMbizDM.body.data.borrower_number;

  return borrowerNumber;
}

async function compDataMbizDM(email, borrowerNumber) {
  let bodyCompDataMbizDM = generateBodyCDMbizDM(email, borrowerNumber);
  const resCompDataMbizDM = await chai
    .request(apiLegacyBaseUrl)
    .post(urlCompDataMbizDM)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyMbizDM
      })
    )
    .send(bodyCompDataMbizDM);

  return resCompDataMbizDM;
}

async function basicRegGaruda(email) {
  let bodyRegistGaruda = generateBodyOtherPartner(email);

  const resRegistGaruda = await chai
    .request(apiLegacyBaseUrl)
    .post(urlBasicGaruda)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyGaruda
      })
    )
    .send(bodyRegistGaruda);
  let borrowerNumber = resRegistGaruda.body.data.borrower_number;

  return borrowerNumber;
}

async function compDataGaruda(email, borrowerNumber) {
  let bodyCompDataGaruda = generateBodyCDGaruda(email, borrowerNumber);
  await chai
    .request(apiLegacyBaseUrl)
    .post(urlCompDataGaruda)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyGaruda
      })
    )
    .send(bodyCompDataGaruda);

  return bodyCompDataGaruda;
}

async function basicRegAdw(email) {
  let bodyRegistAdw = generateBodyOtherPartner(email);

  const resRegistAdw = await chai
    .request(apiLegacyBaseUrl)
    .post(urlBasicAdw)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyAdw
      })
    )
    .send(bodyRegistAdw);
  let borrowerNumber = resRegistAdw.body.data.borrower_number;

  return borrowerNumber;
}

async function compDataAdw(email, borrowerNumber) {
  let bodyCompDataAdw = generateBodyCDAdw(email, borrowerNumber);
  await chai
    .request(apiLegacyBaseUrl)
    .post(urlCompDataAdw)
    .set(
      request.createLegacyHeaders({
        'X-Investree-Key': keyAdw
      })
    )
    .send(bodyCompDataAdw);
  return bodyCompDataAdw;
}

function generateBodyBilltree(email) {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} Billtree`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: email,
      title: 4,
      company_name: `${help.randomCompanyName()} Billtree`
    }
  };
  return body;
}

// payload ini dipakai utk adw, garuda & inamart
function generateBodyOtherPartner(email, partner) {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} ` + partner,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: email,
      title: 4
    }
  };
  return body;
}

function generateBodyMbiz(email) {
  let body = {
    personal_info: {
      full_name: `${help.randomAlphaNumeric(5)} MBIZ`,
      gender: 'M',
      birth_place: 'Jakarta',
      birth_date: help.backDateByYear(18),
      phone_number: help.randomPhoneNumber(12),
      email: email,
      title: 4,
      company_name: `${help.randomCompanyName()} MBIZ`
    }
  };
  return body;
}

function generateBodyCDBilltree(email, borrowerNumber) {
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

function generateBodyCDMbizDM(email, borrowerNumber) {
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

function generateBodyCDGaruda(email, borrowerNumber) {
  let randAddress = help.randomAddress();
  let body = {
    personal_info: {
      email: email,
      borrower_number: `${borrowerNumber}`
    },
    company_info: {
      company_name: `${help.randomCompanyName()} Garuda`,
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
    borrower_type: '1'
  };
  return body;
}

function generateBodyCDAdw(email, borrowerNumber) {
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
    borrower_type: '1'
  };
  return body;
}
