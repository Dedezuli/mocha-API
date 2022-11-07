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
const url = '/partners/v1/business/create/line-facility';
const legacyBaseUrl = request.getLegacyUrl();
const bizDbConfig = require('@root/knexfile.js')[request.getEnv() + '_legacy'];

describe('Create New Line Facility Garuda', () => {
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

    report.setInfo(
      this,
      `Success to regist Garuda with borrower number ${borrowerNumber}, email ${email} and line numeber ${lineNumber}`
    );
  });

  describe('#smoke', () => {
    it('Create new line facility when all status line facility garuda is inactive should succeed #TC-1294', async function () {
      await changeStatusLF(lineNumber, 'N');

      let body = generateBodyCreateLF(borrowerNumber, email);
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
      expect(res.body.data[0].facility_status).to.eql(`Tidak Aktif`);
      expect(res.body.data[1].facility_status).to.eql(`In Review`);
    });
    it('Create new line facility when all status line facility garuda is expired should succeed #TC-1295', async function () {
      this.skip();
      await changeStatusLF(lineNumber, 'E');

      let body = generateBodyCreateLF(borrowerNumber, email);
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
      expect(res.body.data[0].facility_status).to.eql(`Tidak Aktif`);
      expect(res.body.data[1].facility_status).to.eql(`In Review`);
    });
    it('System does not create new line facility when still have line facility with status inreview #TC-1296', async function () {
      await changeStatusLF(lineNumber, 'D');

      let body = generateBodyCreateLF(borrowerNumber, email);
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
      expect(res.body.data[0].blf_number).to.eql(`${lineNumber}`);
      expect(res.body.data[0].facility_status).to.eql(`In Review`);
    });
    it('System does not create new line facility when still have line facility with status active #TC-1297', async function () {
      await changeStatusLF(lineNumber, 'Y');

      let body = generateBodyCreateLF(borrowerNumber, email);
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
      expect(res.body.data[0].blf_number).to.eql(`${lineNumber}`);
      expect(res.body.data[0].facility_status).to.eql(`Aktif`);
    });
  });

  describe('#negative', () => {
    it('Create new line facility with unregistered email should be failed #TC-1298', async function () {
      let otherEmail = `${help.randomEmail()}`;
      let body = generateBodyCreateLF(borrowerNumber, otherEmail);
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
    it('Create new line facility after borrower send request basic registration should be failed #TC-1299', async function () {
      let bodyRegOther = generateBodyRegist();
      otherEmail = bodyRegOther.personal_info.email;

      const resBasicReg = await chai
        .request(legacyBaseUrl)
        .post(urlRegistration)
        .set(
          request.createLegacyHeaders({
            'X-Investree-Key': key
          })
        )
        .send(bodyRegOther);

      borrowerNumberOther = resBasicReg.body.data.borrower_number;

      let body = generateBodyCreateLF(borrowerNumberOther, otherEmail);
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
    it('Create new line facility with status borrower is inactive should failed #TC-1300', async function () {
      await changeStatusBorrower(borrowerNumber, 'N');

      let body = generateBodyCreateLF(borrowerNumber, email);
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
    it('Create new line facility with status borrower is rejected should be failed #TC-1301', async function () {
      await changeStatusBorrower(borrowerNumber, 'R');

      let body = generateBodyCreateLF(borrowerNumber, email);
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

function generateBodyCreateLF(borrowerNumber, email) {
  let body = {
    email: email,
    borrower_number: `${borrowerNumber}`
  };
  return body;
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
