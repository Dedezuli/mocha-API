const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Register Lender via Investree Backend', () => {
  const beBaseUrl = req.getBackendUrl();
  const registerUrl = '/auth/registration/lender';

  describe('#smoke', () => {
    it('Lender registration should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });

    it('Lender registration with fullname using special characters should succeed', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": "M. Yusuf Ihya' An-Nabawi",
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', () => {
    it('Lender registration without salutation should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration without fullname should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration without mobile prefix should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration with non-numeric mobile number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": "123SXC12345",
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration using 8 digits mobile number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(8),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration using 13 digits mobile number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(13),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration using leading zero mobile number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": '0' + help.randomPhoneNumber(9).toString(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration without mobile number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration without password should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration using password with no uppercase should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": "asdasdasd123",
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration using password with no number should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": "Aasdddasda",
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration with subscription agreement false should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": true,
        "agreeSubscribe": false
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });

    it('Lender registration with privacy agreement false should fail', async function() {
      let gender = Math.random() <= 0.5 ? 0 : 1;
      let body = {
        "salutation": gender? "Mrs.": "Mr.",
        "fullname": help.randomFullName(gender),
        "email": help.randomEmail(),
        "mobilePrefix": "1",
        "phoneNumber": help.randomPhoneNumber(),
        "password": vars.default_password,
        "referralCode": "",
        "agreePrivacy": false,
        "agreeSubscribe": true
      };

      const startTime = help.startTime();
      const res = await chai.request(beBaseUrl)
        .post(registerUrl)
        .set(req.createNewCoreHeaders())
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-249");
      report.setSeverity(this, "blocker");

      expect(res).to.have.status(400);
    });
  });
});