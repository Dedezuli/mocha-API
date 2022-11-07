const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Register Borrower via Investree Backend', () => {
  const beBaseUrl = req.getBackendUrl();
  const svcBaseUrl = req.getSvcUrl();
  const registerUrl = '/auth/registration/borrower';
  const verifyOtpUrl = '/validate/notification/otp/verify';

  describe('#smoke', () => {
    it('Register as borrower should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "agreePrivacy": true,
        "agreeSubscribe": true,
        "email": help.randomEmail(),
        "fullname": help.randomFullName(gender),
        "mobilePrefix": 1,
        "nationality": 104,
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "referralCode": "",
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "userType": 1,
        "username": help.randomAlphaNumeric()
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Successful register as borrower should be immediately able to verify OTP', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "agreePrivacy": true,
        "agreeSubscribe": true,
        "email": help.randomEmail(),
        "fullname": help.randomFullName(gender),
        "mobilePrefix": 1,
        "nationality": 104,
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "referralCode": "",
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "userType": 1,
        "username": help.randomAlphaNumeric()
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const verifyOtpStartTime = help.startTime();
      const verifyOtpRes = await chai.request(svcBaseUrl)
        .post(verifyOtpUrl)
        .set(req.createNewCoreHeaders({
          "X-Investree-Token": res.body.data.accessToken
        }))
        .send({
          "otp": "123456"
        });
      const verifyOtpResponseTime = help.responseTime(verifyOtpStartTime);
      
      report.setPayload(this, verifyOtpRes, verifyOtpResponseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "critical");

      expect(verifyOtpRes, 'Verify OTP failed').to.have.status(200);
    });

    it('Register borrower with Indonesian nationality should return WNI true', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.data).to.have.property('wni', true);
    });

    it('Register borrower with non-Indonesian nationality should return WNI false', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 103,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.data).to.have.property('wni', false);
    });

    it('Register borrower using existing username should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": "jangandihapus",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql(`Data username sudah ada`);
    });

    it('Register borrower with username using 8 characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(8),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower with username using 20 characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(20),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower with fullname using special characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": "M. Yusuf Ihya' An-Nabawi",
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower using existing email should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": "jangandihapus@investree.id",
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Data email address sudah ada');
    });

    it('Register borrower with phone number using 9 characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(9),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower with phone number using 12 characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(12),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower disagree to subscribe should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": false,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower disagree to privacy should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": false,
        "agreePrivacy": false,
        "userType": 1,
        "referralCode": ""
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Syarat & Ketentuan dan Kebijakan Privasi wajib diisi');
    });

    it('Register borrower with fullname using swedish latin characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": "Segol Åkerlund Sjöström",
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Register borrower with fullname using non-latin characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": "度鳴杜 寅无符",
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', () => {
    it('Register borrower with nonexistent salutation should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": "Dr.",
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with salutation empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": "",
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with salutation null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": null,
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('salutation tidak dapat kosong');
    });

    it('Register borrower with username empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": "",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with username null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": null,
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('username tidak dapat kosong');
    });

    it('Register borrower with username containing uppercase should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": "AsdadAsda",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Username Harus berisi huruf kecil, dan angka');
    });

    it('Register borrower username using trailing whitespace should be failed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": `   ${help.randomAlphaNumeric()}  `,
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Username Harus berisi huruf kecil, dan angka')
    });

    it('Register borrower with username using extra middle space should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let alphaNumeric = help.randomAlphaNumeric(7);
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": `${alphaNumeric} ${alphaNumeric}`,
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Username Harus berisi huruf kecil, dan angka');
    });

    it('Register borrower with username using whitespaces only should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": "              ",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with username using 7 characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(7),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Username harus diantara 8 sampai 20 karakter');
    });

    it('Register borrower with username using 21 characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(21),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Username harus diantara 8 sampai 20 karakter');
    });

    it('Register borrower with fullname null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": null,
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('full name tidak dapat kosong');
    });

    it('Register borrower with fullname using numeric characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": `${help.randomFullName()} 123`,
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Kolom full name hanya dapat disi dengan karakter');
    });

    it('Register borrower with fullname empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": "",
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower fullname using trailing whitespace should be trimmed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": `  ${help.randomFullName()}   `,
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.data.fullName).to.eql(body.fullname.trim());
    });

    it('Register borrower fullname using whitespaces only should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": "            ",
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower invalid email format should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": `-- \"rtest@asd@investree.id`,
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with email empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": "",
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with email null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": null,
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with phone number empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": "",
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with phone number null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": null,
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with phone number using non-numeric characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": "lkjaskdl@$%",
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with phone number using 8 characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(8),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Nomor telepon harus diantara 9 sampai 12 karakter');
    });

    it('Register borrower with phone number using 13 characters should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(13),
        "mobilePrefix": "1",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res.body.meta.message).to.eql('Nomor telepon harus diantara 9 sampai 12 karakter');
    });

    it('Register borrower with mobile prefix empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "",
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with mobile prefix null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": null,
        "agreeSubscribe": true,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with subscribe empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": "",
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with subscribe null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": null,
        "agreePrivacy": true,
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with privacy empty string should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": false,
        "agreePrivacy": "",
        "referralCode": "",
        "userType": 1
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Register borrower with privacy null should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender ? 'Mrs.' : 'Mr.',
        "nationality": 104,
        "username": help.randomAlphaNumeric(),
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "password": vars.default_password,
        "phoneNumber": help.randomPhoneNumber(),
        "mobilePrefix": "1",
        "agreeSubscribe": false,
        "agreePrivacy": null
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-158");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });
  });
});