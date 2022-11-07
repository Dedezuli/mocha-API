const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require("chai");
let chaiHttp = require("chai-http");
chai.use(chaiHttp);
const vars = require('@fixtures/vars');
const expect = chai.expect;

const url = '/partners/v1/ecommerce/bukalapak/applyloan';
const apiLegacyBaseUrl = req.getLegacyUrl();
const headerPartnerBukalapak = req.createLegacyHeaders({
  "X-Investree-Key": vars.keyPartnerBukalapak
});

describe('Registration and Apply Loan of Bukalapak Partner', () => {
  describe('#smoke', () => {
    it("Registration and apply loan should success #TC-509", async function() {
      let body = generateBody();
      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerBukalapak)
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-125');

      expect(res.body.meta.code).to.eql('200');
      expect(res.body.meta.message).to.eql("Pengajuan Pinjaman Berhasil','Kami telah menerima pengajuan pinjaman Anda, kami akan segera memproses pengajuan pinjaman Anda dalam waktu 1 hari kerja. Proses persetujuan penawaran pinjaman akan kami informasikan melalui e-mail")
    });
  });

  describe('#negative', () => {
    it('Apply loan with non unique email should failed #TC-510', async function() {
      let bodyEmailOne = generateBody();
      let emailOne = bodyEmailOne.personal_info.email;

      await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerBukalapak)
        .send(bodyEmailOne);

      let bodyEmailTwo = generateBody();
      bodyEmailTwo.personal_info.email = emailOne;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerBukalapak)
        .send(bodyEmailTwo);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-125');

      expect(res.body.meta.code).to.eql('400');
      expect(res.body.meta.message).to.eql("User dalam proses In Review, Disburse, atau In Funding")
    });

    it('Apply loan with loan under 1 million should failed #TC-511', async function() {
      let applyLoan = generateBody();
      applyLoan.loan_amount = applyLoan.loan_amount / 1000;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerBukalapak)
        .send(applyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-125');

      expect(res.body.meta.code).to.eql('400');
      expect(res.body.meta.message).to.eql("Pengajuan Pinjaman tidak boleh lebih kecil dari Rp 2.000.000")
    });

    it('Apply loan with loan above 1 billion should failed #TC-512', async function() {
      let applyLoan = generateBody();
      applyLoan.loan_amount = applyLoan.loan_amount * 1000;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerBukalapak)
        .send(applyLoan);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-125');

      expect(res.body.meta.code).to.eql('400');
      expect(res.body.meta.message).to.eql("Pengajuan Pinjaman tidak boleh lebih besar dari Rp 1.000.000.000")
    });
  });
});

function generateBody() {
  let dateNow = new Date();
  let randomDate = help.randomDate(null, dateNow.getFullYear());
  let time = `${randomDate} 12:00:00`;
  let randomAdress = help.randomAddress();

  let body = {
    "partner_name": "bukalapak",
    "loan_amount": `${help.randomLoanAmount()}`,
    "loan_duration": 5,
    "loan_type": 1,
    "loan_duration_type": "4",
    "program_name": "Laku",
    "create_time": time,
    "personal_info": {
      "full_name": help.randomFullName(),
      "gender": "Male",
      "birth_place": randomAdress.city.name,
      "birth_date": help.dateAbove17YearsOld(),
      "phone_number": help.randomPhoneNumber(12),
      "email": help.randomEmail()
    },
    "ktp": {
      "ktp_no": help.randomInteger('KTP'),
      "expired_date": "3000-01-01"
    },
    "npwp": help.randomInteger('NPWP'),
    "domicile": {
      "full_address": randomAdress.address,
      "postal_code": randomAdress.postalCode,
      "province": randomAdress.province.name,
      "city": randomAdress.city.name,
      "district": randomAdress.district.name,
      "sub_district": randomAdress.subDistrict.name
    },
    "shop_info": {
      "shop_name": help.randomCompanyName(),
      "shop_domain": "https://investree.id/eb7487aa-e262-4e26-9697-91695ac27bf4.jpg",
      "seller_desc": "efficient revolutionize partnerships. Et quisquam atque sit quas nostrum soluta. Rem et ullam hic optio labore. Labore atque ut ut facilis. Sed expedita sunt",
      "open_since": help.randomDate(),
      "ecommerce_open_since": "6-12 Bulan",
      "offline_address": {
        "full_address": randomAdress.address,
        "postal_code": randomAdress.postalCode,
        "province": randomAdress.province.name,
        "city": randomAdress.city.name,
        "district": randomAdress.district.name,
        "sub_district": randomAdress.subDistrict.name
      }
    },
    "cashflow_history": [
      { "month": 1, "year": 2020, "value": 370513668 },
      { "month": 2, "year": 2020, "value": 651723922 },
      { "month": 3, "year": 2020, "value": 402593351 },
      { "month": 4, "year": 2020, "value": 586401007 },
      { "month": 5, "year": 2020, "value": 578954190 },
      { "month": 6, "year": 2020, "value": 190712344 }
    ],
    "external_loans": [{
        "institution_name": help.randomCompanyName(),
        "loan_amount": "10000000",
        "term": 8
      },

    ],
    "rating": 5,
    "six_months_average_cashflow": 463483080.3333333,
    "profit_margin": 8,
    "bank_account": {
      "bankid": 1,
      "bank_name": "Bank Mandiri",
      "account_name": "Hendro",
      "account_number": "4748787887"
    },
    "external_shop_info": [{
        "ecommerce_name": "LABORE ELIGENDI",
        "domain": "https://investree.id/1805f059-d20d-4d20-b9ec-c39ec5fc5857.jpg"
      },
      {
        "ecommerce_name": "ET AUT",
        "domain": "https://investree.id/bc1068ea-711a-4711-a329-1a32e3494597.jpg"
      }
    ]
  };
  return body;
}