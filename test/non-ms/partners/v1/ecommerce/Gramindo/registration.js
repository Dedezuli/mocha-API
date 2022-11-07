const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
let chai = require('chai');
let chaiHttp = require('chai-http');
const fs = require('fs');
chai.use(chaiHttp);
const vars = require('@fixtures/vars');
const { startTime } = require('@lib/helper');
const expect = chai.expect;

const url = '/partners/v1/retail/gramindo/registration';
const apiLegacyBaseUrl = req.getLegacyUrl();
const headerPartnerGramindo = req.createLegacyHeaders({
  'X-Investree-Key': vars.keyPartnerGramindo
});

describe('Registration of Gramindo Partner', () => {
  describe('#smoke', () => {
    it('Registration gramindo should succeed #TC-1211', async function () {
      let body = generateBody();
      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-593');

      expect(res.body.meta.code).to.eql(200);
      expect(res.body.meta.message).to.eql('registration success');
    });
  });
  describe('#negative', () => {
    it('Registration gramindo using existing email should fail #TC-1212', async function () {
      let firstEmailBody = generateBody();
      let firstEmail = firstEmailBody.personal_info.email;

      await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(firstEmailBody);

      let secondEmailBody = generateBody();
      secondEmailBody.personal_info.email = firstEmail;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(secondEmailBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('data already exist : Email');
    });

    it('Registration gramindo using existing phone number should fail #TC-1213', async function () {
      let phoneNumberOneBody = generateBody();
      let phoneNumberOne = phoneNumberOneBody.personal_info.phone_number;

      await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(phoneNumberOneBody);

      let phoneNumberTwoBody = generateBody();
      phoneNumberTwoBody.personal_info.phone_number = phoneNumberOne;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(phoneNumberTwoBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('data already exist : Phone number');
    });

    it('Registration gramindo using existing KTP number should fail #TC-1214', async function () {
      let ktpNumberOneBody = generateBody();
      let ktpNumberOne = ktpNumberOneBody.ktp.ktp_no;

      await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpNumberOneBody);

      let ktpNumberTwoBody = generateBody();
      ktpNumberTwoBody.ktp.ktp_no = ktpNumberOne;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpNumberTwoBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('data already exist : KTP number');
    });

    it('Registration gramindo with amount below 2 million should return invalid max amount error message #TC-1215', async function () {
      let belowAmountBody = generateBody();
      belowAmountBody.loan_info.max_amount = 1000000;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(belowAmountBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Max amount');
    });

    it('Registration gramindo with amount above 30 million should return invalid max amount error message #TC-1216', async function () {
      let aboveAmountBody = generateBody();
      aboveAmountBody.loan_info.max_amount = 40000000;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(aboveAmountBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Max amount');
    });
    it('Registration gramindo with amount is null should return incomplete max amount error message #TC-1217', async function () {
      let aboveAmountBody = generateBody();
      aboveAmountBody.loan_info.max_amount = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(aboveAmountBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Max amount');
    });

    it('Registration gramindo with tenor below 1 month should return invalid max tenor error message #TC-1218', async function () {
      let belowTenorBody = generateBody();
      belowTenorBody.loan_info.max_tenor = 0;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(belowTenorBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Max tenor');
    });
    it('Registration gramindo with tenor other than acceptable values should return invalid max tenor error message #TC-1219', async function () {
      let otherTenorBody = generateBody();
      otherTenorBody.loan_info.max_tenor = 13;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(otherTenorBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-593');
      report.setInfo(this, 'Acceptable values : 1,2,3,4,5,6,7,8,9,10,11,12,18,24');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Max tenor');
    });
    it('Registration gramindo with max tenor is null should return incomplete max tenor error message  #TC-1220', async function () {
      let maxTenorBody = generateBody();
      maxTenorBody.loan_info.max_tenor = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(maxTenorBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Max Tenor');
    });
    it('Registration gramindo with KTP number below 16 should return invalid KTP number error message #TC-1221 ', async function () {
      let ktpNumberBody = generateBody();
      ktpNumberBody.ktp.ktp_no = help.randomInteger(15);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : KTP number');
    });
    it('Registration gramindo with KTP number above 16 should return invalid KTP number error message #TC-1222', async function () {
      let ktpNumberBody = generateBody();
      ktpNumberBody.ktp.ktp_no = help.randomInteger(17);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : KTP number');
    });
    it('Registration gramindo with KTP number is null should return incomplete KTP number error message #TC-1223', async function () {
      let ktpNumberBody = generateBody();
      ktpNumberBody.ktp.ktp_no = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : KTP number');
    });
    it('Registration gramindo with bank account name is null should return incomplete bank account name error message #TC-1224', async function () {
      let bankAccountNameBody = generateBody();
      bankAccountNameBody.bank_account.account_name = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankAccountNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank account name');
    });
    it('Registration gramindo with bank account number is null should return incomplete bank account number error message #TC-1225', async function () {
      let bankAccountNumberBody = generateBody();
      bankAccountNumberBody.bank_account.account_number = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankAccountNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank account number');
    });
    it('Registration gramindo with bank id is null should return incomplete bank id error message #TC-1226', async function () {
      let bankAccountIdBody = generateBody();
      bankAccountIdBody.bank_account.bankid = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankAccountIdBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank id');
    });
    it('Registration gramindo with birth date is null should return incomplete birth date error message #TC-1227', async function () {
      let birthDateBody = generateBody();
      birthDateBody.personal_info.birth_date = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(birthDateBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Birth date');
    });
    it('Registration gramindo with birth date under 17 should return invalid birth date error message #TC-1228', async function () {
      let underSeventeenBody = generateBody();
      underSeventeenBody.personal_info.birth_date = help.dateUnder17YearsOld();

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(underSeventeenBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Birth date');
    });
    it('Registration gramindo with null fullname should return incomplete fullname error message #TC-1302', async function () {
      let fullNameBody = generateBody();
      fullNameBody.personal_info.full_name = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(fullNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data :  Full name');
    });
    it('Registration gramindo with null email should return incomplete email error message #TC-1303', async function () {
      let emailBody = generateBody();
      emailBody.personal_info.email = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(emailBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Email');
    });
    it('Registration gramindo with phone number below 9 digits should return invalid phone number error message #TC-1304', async function () {
      let phoneNumberBody = generateBody();
      phoneNumberBody.personal_info.phone_number = help.randomInteger(8);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(phoneNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Phone number');
    });
    it('Registration gramindo with phone number above 12 digits should return invalid phone number error message #TC-1305', async function () {
      let phoneNumberBody = generateBody();
      phoneNumberBody.personal_info.phone_number = help.randomInteger(13);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(phoneNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Phone number');
    });
    it('Registration gramindo with null partner id should return incomplete partner id error message #TC-1306', async function () {
      let partnerIdBody = generateBody();
      partnerIdBody.loan_info.partner_id = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(partnerIdBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Partner id');
    });
    it('Registration gramindo with null ktp expired date should return incomplete ktp expired date error message #TC-1307', async function () {
      let expiredBody = generateBody();
      expiredBody.ktp.expired_date = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(expiredBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : KTP expired date');
    });
    it('Registration gramindo with ktp expired date earlier than current date should return invalid ktp expired date error message #TC-1308', async function () {
      let expiredBody = generateBody();
      expiredBody.ktp.expired_date = '2020-08-31T17:49:25.016Z';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(expiredBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : KTP expired date');
    });
    it('Registration gramindo with null ktp full address should return incomplete ktp full address error message #TC-1309', async function () {
      let fullAddressBody = generateBody();
      fullAddressBody.ktp.address.full_address = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(fullAddressBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : KTP full address');
    });
    it('Registration gramindo with null place of birth should return incomplete place of birth error message #TC-1310', async function () {
      let placeOfBirthBody = generateBody();
      placeOfBirthBody.personal_info.birth_place_id = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(placeOfBirthBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data :  Birth place id');
    });
    it('Registration gramindo with null status should return incomplete status error message #TC-1311', async function () {
      let statusBody = generateBody();
      statusBody.personal_info.marital_status = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(statusBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Marital status');
    });
    it('Registration gramindo with null relationship should return incomplete relationship error message #TC-1312', async function () {
      let relationBody = generateBody();
      relationBody.relation_info.relationship = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(relationBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Relationship');
    });
    it('Registration gramindo with null religion should return incomplete religion error message #TC-1313', async function () {
      let religionBody = generateBody();
      religionBody.personal_info.religion = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(religionBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Religion');
    });
    it('Registration gramindo with null education should return incomplete education error message #TC-1314', async function () {
      let educationBody = generateBody();
      educationBody.personal_info.education = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(educationBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data :  Education');
    });
    it('Registration gramindo with null occupation should return incomplete occupation error message #TC-1315', async function () {
      let occupationBody = generateBody();
      occupationBody.personal_info.occupation = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(occupationBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Occupation');
    });
    it('Registration gramindo with null domicile full address should return incomplete domicile full address error message #TC-1316', async function () {
      let fullAddressBody = generateBody();
      fullAddressBody.domicile.full_address = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(fullAddressBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Domicile full address');
    });
    it('Registration gramindo with null company name should return incomplete company name error message #TC-1317', async function () {
      let companyNameBody = generateBody();
      companyNameBody.business_info.company_name = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(companyNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Business name');
    });
    it('Registration gramindo with null industry should return incomplete industry  error message #TC-1318', async function () {
      let industryBody = generateBody();
      industryBody.business_info.industry = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(industryBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Industry');
    });
    it('Registration gramindo with null Date of establishment should return incomplete Date of establishment error message #TC-1319', async function () {
      let dateEstabishmentBody = generateBody();
      dateEstabishmentBody.business_info.year_establishment = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(dateEstabishmentBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Date of establishment');
    });
    it('Registration gramindo with date of establishment later than current date should return invalid Date of establishment error message #TC-1320', async function () {
      let dateEstabishmentBody = generateBody();
      dateEstabishmentBody.business_info.year_establishment = '2030-09-20T17:49:25.016Z';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(dateEstabishmentBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Business establishment date');
    });
    it('Registration gramindo with null number of employee should return incomplete number of employee error message #TC-1321', async function () {
      let numberEmployeeBody = generateBody();
      numberEmployeeBody.business_info.number_Employee = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(numberEmployeeBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Number of employee');
    });
    it('Registration gramindo with null business description should return incomplete business description error message #TC-1322', async function () {
      let descBody = generateBody();
      descBody.business_info.company_description = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(descBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Business description');
    });
    it('Registration gramindo with null land line number should return incomplete line number error message #TC-1323', async function () {
      let landLineNumberBody = generateBody();
      landLineNumberBody.business_info.land_line_number = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(landLineNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Business Line number');
    });
    it('Registration gramindo with land line number below 5 digits should return invalid line number error message #TC-1324', async function () {
      let landLineNumberBody = generateBody();
      landLineNumberBody.business_info.land_line_number = help.randomInteger(4);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(landLineNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Business line number');
    });
    it('Registration gramindo with land line number above 12 digits should return invalid line number error message #TC-1325', async function () {
      let landLineNumberBody = generateBody();
      landLineNumberBody.business_info.land_line_number = help.randomInteger(13);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(landLineNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Business line number');
    });
    it('Registration gramindo with null profit margin should return incomplete profit margin error message #TC-1326', async function () {
      let profitMarginBody = generateBody();
      profitMarginBody.business_info.monthly_profit_margin = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(profitMarginBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Monthly Profit Margin');
    });
    it('Registration gramindo with profit margin above 99 should return invalid profit margin error message #TC-1327', async function () {
      let profitMarginBody = generateBody();
      profitMarginBody.business_info.monthly_profit_margin = 100;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(profitMarginBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Monthly Profit Margin');
    });
    it('Registration gramindo with null bank account name should return incomplete bank account name error message #TC-1328', async function () {
      let bankNameBody = generateBody();
      bankNameBody.bank_account.account_name = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank account name');
    });
    it('Registration gramindo with bank id is null should return incomplete bank account name error message #TC-1329', async function () {
      let bankIdBody = generateBody();
      bankIdBody.bank_account.bankid = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankIdBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank id');
    });
    it('Registration gramindo with null bank account number should return incomplete bank account number error message #TC-1330', async function () {
      let bankNumberBody = generateBody();
      bankNumberBody.bank_account.account_number = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Bank account number');
    });
    it('Registration gramindo with bank account number below 10 digits should return invalid bank account number error message #TC-1331', async function () {
      let bankNumberBody = generateBody();
      bankNumberBody.bank_account.account_number = help.randomInteger(9);

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : Bank account number');
    });
    it('Registration gramindo with null relation phone number should return incomplete relation phone number error message #TC-1332', async function () {
      let relationPhoneNumberBody = generateBody();
      relationPhoneNumberBody.relation_info.mobile_number = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(apiLegacyBaseUrl)
        .post(url)
        .set(headerPartnerGramindo)
        .send(relationPhoneNumberBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : Relation info mobile number');
    });
    it('Registration gramindo with null month cashflow history should return incomplete cashflow history error message #TC-1333', async function () {
      let monthBody = generateBody();
      monthBody.cashflow_history[0].month = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(monthBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : month cashflow history');
    });
    it('Registration gramindo with null values cashflow history should return incomplete cashflow history error message #TC-1334', async function () {
      let valueBody = generateBody();
      valueBody.cashflow_history[0].value = '';

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(valueBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : value cashflow history');
    });
    it('Registration gramindo with null year cashflow history should return incomplete cashflow history error message #TC-1335', async function () {
      let yearBody = generateBody();
      yearBody.cashflow_history[0].year = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(yearBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Incomplete data : year cashflow history');
    });
    it('Registration gramindo with year cashflow history later than current year should return invalid cashflow date error message #TC-1336', async function () {
      let yearBody = generateBody();
      yearBody.cashflow_history[0].year = 2025;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(yearBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.data.status).to.eql('Failed');
      expect(res.body.data.reason).to.eql('Invalid data / format : cashflow date');
    });
    it('Registration gramindo with null bank cover file should return invalid bank cover file error message #TC-1550', async function () {
      let bankCoverBody = generateBody();
      bankCoverBody.bank_account.bank_cover_file = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankCoverBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('tabungan file is invalid!');
    });
    it('Registration gramindo with null bank cover file name should return invalid bank cover file name error message #TC-1551', async function () {
      let bankCoverNameBody = generateBody();
      bankCoverNameBody.bank_account.bank_cover_filename = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(bankCoverNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('tabungan filename is invalid!');
    });
    it('Registration gramindo with null ktp file should return invalid ktp file error message #TC-1552', async function () {
      let ktpFileBody = generateBody();
      ktpFileBody.ktp.ktp_file = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpFileBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('ktp file is invalid!');
    });
    it('Registration gramindo with null ktp file name should return invalid ktp file name error message #TC-1553', async function () {
      let ktpFileNameBody = generateBody();
      ktpFileNameBody.ktp.ktp_filename = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(ktpFileNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('ktp filename is invalid!');
    });
    it('Registration gramindo with null selfie file should return invalid selfie file error message #TC-1554', async function () {
      let selfieFileBody = generateBody();
      selfieFileBody.personal_info.selfie_file = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(selfieFileBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('selfie file is invalid!');
    });
    it('Registration gramindo with null selfie file name should return invalid selfie file name error message #TC-1555', async function () {
      let selfieFileNameBody = generateBody();
      selfieFileNameBody.personal_info.selfie_filename = null;

      const startTime = await help.startTime();
      const res = await chai.request(apiLegacyBaseUrl).post(url).set(headerPartnerGramindo).send(selfieFileNameBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'critical');
      report.setIssue(this, 'RET-59');

      expect(res.body.meta.message).to.eql('error');
      expect(res.body.status).to.eql('selfie filename is invalid!');
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
      max_tenor: 24,
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
