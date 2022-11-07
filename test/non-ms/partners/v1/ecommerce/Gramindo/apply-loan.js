const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require('chai');
let chaiHttp = require('chai-http');
const fs = require('fs');
chai.use(chaiHttp);
const vars = require('@fixtures/vars');
const { startTime } = require('@lib/helper');
const { Connection } = require('pg');
const expect = chai.expect;

const url = '/partners/v1/retail/gramindo/registration';
const urlApplyLoan = '/partners/v1/retail/gramindo/apply-loan';
const apiLegacyBaseUrl = req.getLegacyUrl();
const headerPartnerGramindo = req.createLegacyHeaders({
  'X-Investree-Key': vars.keyPartnerGramindo
});

describe('Apply Loan for Gramindo Partner', () => {
  let email;
  beforeEach(async function () {
    let bodyRegister = generateBody();
    email = bodyRegister.personal_info.email;

    let resRegister = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bodyRegister);

    report.setInfo(this, resRegister);
  });
  describe('#smoke', () => {
    it('Apply loan should succeed #TC-1337', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Success');
    });
    it('Apply loan with amount below max amount should success #TC-1338', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = 20000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Success');
    });
    it('Apply loan with tenor below max tenor should success #TC-1339', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_tenor = 8;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Success');
    });
    it('Apply loan with loan type 0 should return invalid loan type error message #TC-1340', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_type = 0;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Success');
    });
  });
  describe('#negative', () => {
    it('Apply loan with more than once at the same time should return still active error message #TC-1341', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);

      await chai.request(apiLegacyBaseUrl).post(urlApplyLoan).set(headerPartnerGramindo).send(bodyApplyLoan);

      let secondApply = bodyApplyLoan;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(secondApply);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql('Pengaju pinjaman masih memiliki pengajuan pinjaman aktif');
    });
    it('Apply loan with amount more than maximum loan amount should return maximum loan amount error message #TC-1342', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = 40000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql(
        'Nilai pinjaman tidak boleh melebihi maksimal pinjaman Anda yaitu 30 jt'
      );
    });
    it('Apply loan with amount below 2 million should return minimum loan amount error message #TC-1343', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = 1000000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql('Pengajuan Pinjaman tidak boleh lebih kecil dari Rp 2 jt');
    });
    it('Apply loan with amount not multiples of 1 million should return loan amount multiples error message #TC-1344', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = 2550000;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql('Jumlah pinjaman anda harus berkelipatan 1 jt');
    });
    it('Apply loan with null amount should return incomplete amount error message #TC-1345', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = null;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql('Nilai pengajuan pinjaman wajib diisi');
    });
    it('Apply loan with tenor more than max tenor should return maximum tenor error message #TC-1346', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_tenor = 18;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql('Tenor pinjaman tidak bisa melebihi maksimal tenor 12 bulan');
    });
    it('Apply loan with tenor below 1 month should return return minimum tenor error message #TC-1347', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_tenor = 0;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql(
        'Tenor pinjaman tidak boleh kurang dari 1 bulan atau lebih dari 24 bulan'
      );
    });
    it('Apply loan with tenor other than acceptable values should return return unacceptable values error message #TC-1348', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_tenor = 13;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');
      report.setInfo(this, 'Acceptable values : 1,2,3,4,5,6,7,8,9,10,11,12,18,24');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql(
        'Tenor pinjaman tidak boleh selain dari ketentuan (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24 bulan)'
      );
    });

    it('Apply loan with loan amount and loan tenor more than max should return maximum loan amount error message #TC-1349', async function () {
      let bodyApplyLoan = generateBodyApplyLoan(email);
      bodyApplyLoan.loan_amount = 40000000;
      bodyApplyLoan.loan_tenor = 18;

      const startTime = await help.startTime();
      const resApplyLoan = await chai
        .request(apiLegacyBaseUrl)
        .post(urlApplyLoan)
        .set(headerPartnerGramindo)
        .send(bodyApplyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, resApplyLoan, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-695');

      expect(resApplyLoan.body.data.status).to.eql('Failed');
      expect(resApplyLoan.body.data.reason).to.eql(
        'Nilai pinjaman tidak boleh melebihi maksimal pinjaman Anda yaitu 30 jt'
      );
    });
  });
});

function base64FileEncode(file) {
  let bitmap = fs.readFileSync(file);
  return Buffer.from(bitmap).toString('base64');
}
function generateBody() {
  let base64Image = base64FileEncode('fixtures/documents/investree.jpg');
  let gender = help.randomGender();
  let randomAddress = help.randomAddress();
  let body = {
    bank_account: {
      account_name: help.randomFullName(),
      account_number: help.randomInteger(10),
      bankid: 1,
      bank_cover_file: base64Image,
      bank_cover_filename: 'bankCover.jpg'
    },
    business_info: {
      city: randomAddress.city.id,
      industry: 'E',
      company_address: randomAddress.address,
      company_description: help.randomDescription(),
      company_name: help.randomCompanyName(),
      district: randomAddress.district.id,
      land_line_number: help.randomInteger(8),
      number_Employee: help.randomInteger(3),
      postal_code: randomAddress.postalCode,
      province: randomAddress.province.id,
      village: randomAddress.subDistrict.id,
      year_establishment: '2019-06-20T17:49:25.016Z',
      monthly_profit_margin: 99
    },
    cashflow_history: [
      {
        month: 12,
        value: 10000000,
        year: 2019
      }
    ],
    domicile: {
      city_id: randomAddress.city.id,
      district_id: randomAddress.district.id,
      full_address: randomAddress.address,
      postal_code: randomAddress.postalCode,
      province_id: randomAddress.province.id,
      sub_district_id: randomAddress.subDistrict.id,
      longitude: -0.127758,
      latitude: 51.507351
    },
    group: {
      code: 'abeod',
      name: 'group pikirpikir',
      position: '1'
    },
    ktp: {
      address: {
        full_address: randomAddress.address,
        province_id: randomAddress.province.id,
        city_id: randomAddress.city.id,
        district_id: randomAddress.district.id,
        sub_district_id: randomAddress.subDistrict.id,
        postal_code: randomAddress.postalCode
      },
      expired_date: '3000-01-01T17:49:25.016Z',
      ktp_no: help.randomInteger('KTP'),
      ktp_file: base64Image,
      ktp_filename: 'ktp.jpg'
    },
    loan_info: {
      max_amount: 30000000,
      max_tenor: 12,
      partner_id: 36,
      product_category: 22
    },
    personal_info: {
      birth_date: help.dateAbove17YearsOld(),
      birth_place_id: randomAddress.city.id,
      borrower_number: '12',
      email: help.randomEmail(),
      full_name: help.randomFullName(),
      gender: gender ? 'f' : 'm',
      line_facility_number: 'string',
      marital_status: 3,
      phone_number: help.randomInteger(12),
      religion: 1,
      occupation: 4,
      education: 4,
      selfie_file: base64Image,
      selfie_filename: 'selfie.jpg'
    },
    relation_info: {
      address: randomAddress.address,
      city_id: randomAddress.city.id,
      district_id: randomAddress.district.id,
      email_address: help.randomEmail(),
      full_name: help.randomFullName(),
      identity_card_number: help.randomInteger('KTP'),
      identity_card_expired: '2022-09-25T17:49:25.016Z',
      mobile_number: help.randomInteger(12),
      postal_code: randomAddress.postalCode,
      province_id: randomAddress.province.id,
      relationship: 12,
      village_id: randomAddress.subDistrict.id
    },
    sync: {
      activation_code: 'string',
      bpd_number: help.randomInteger(9),
      bpd_rd_id: 0,
      hash_password: help.getDefaultPassword({ hash: 'hmac' }),
      referral: 'string',
      va_number: help.randomInteger(8)
    }
  };
  return body;
}

function generateBodyApplyLoan(email) {
  let body = {
    email_address: email,
    loan_type: 1,
    loan_amount: 20000000,
    loan_tenor: 12
  };
  return body;
}
