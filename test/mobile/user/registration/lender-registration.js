const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const mobileBaseUrl = req.getMobileApiUrl();
const registerUrl = '/v2/user/registration';

describe('Lender Registration on Mobile App', function () {
  describe('#smoke', function () {
    it('Lender registration should succeed #TC-1575', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(201);
    });

    it('Lender registration with newsLetter true should succeed #TC-1576', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: true
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(201);
    });

    it('Lender registration with fullname using special characters should succeed #TC-1577', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: "Automation. Lender 'BE",
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(201);
    });
  });

  describe('#negative', function () {
    it('Lender registration without fullname should fail #TC-1578', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber,
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without email should fail #TC-1579', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without password should fail #TC-1580', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without gender should fail #TC-1581', async function () {
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without phoneNumber should fail #TC-1582', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without phoneNumberPrefixId should fail #TC-1583', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without nationalityId should fail #TC-1584', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration without newsLetter should fail #TC-1585', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });
    it('Lender registration with non-numeric phoneNumber should fail #TC-1586', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: '0892839183A',
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration with non-numeric phoneNumberPrefixId should fail #TC-1587', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: '10A',
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration with non-numeric nationalityId should fail #TC-1588', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 'ABC',
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration with invalid email format should fail #TC-1589', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: '$(help.randomAlphaNumeric()) @investree.id',
        password: vars.default_password,
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });

    it('Lender registration with invalid password format should fail #TC-1590', async function () {
      const gender = Math.random() <= 0.5 ? 0 : 1;
      const body = {
        fullName: help.randomFullName(),
        email: help.randomEmail(),
        password: 'PassWord@ 1234',
        gender: gender ? 'M' : 'F',
        phoneNumber: help.randomPhoneNumber(),
        phoneNumberPrefixId: 104,
        nationalityId: 104,
        newsletter: false
      };

      const startTime = help.startTime();
      const res = await chai.request(mobileBaseUrl).post(registerUrl).send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setSeverity(this, 'blocker');
      expect(res).to.have.status(400);
    });
  });
});
