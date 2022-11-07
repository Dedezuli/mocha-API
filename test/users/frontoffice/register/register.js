const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const vars = require('@fixtures/vars');
const expect = require('chai').expect;
const chai = require('chai');
const captcha = help.randomAlphaNumeric();

describe('Frontoffice Register', function () {
  const url = '/validate/users/frontoffice/register';
  describe('#smoke', function () {
    it('Register frontoffice user should succeed #TC-342', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 104,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with Indonesian nationality should return WNI true #TC-343', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 104,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('wni', true);
    });

    it('Register frontoffice user with non-Indonesian nationality should return WNI false #TC-344', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 103,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.data).to.have.property('wni', false);
    });

    it('Register frontoffice user using existing username should fail #TC-345', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: 'jangandihapus',
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with username using 8 characters should succeed #TC-346', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(8);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with username using 20 characters should succeed #TC-347', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(20);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with fullname using special characters should succeed #TC-348', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: "M. Yusuf Ihya' An-Nabawi",
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user using existing email should fail  #TC-349', async function () {
      const gender = help.randomGender();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: help.randomAlphaNumeric(),
        fullname: help.randomFullName(gender).toUpperCase(),
        email: 'jangandihapus@investree.id',
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number using 9 characters should succeed #TC-350', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(9),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with phone number using 12 characters should succeed #TC-351', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(12),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user disagree to subscribe should succeed #TC-352', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: false,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user disagree to privacy should fail #TC-353', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: false,
        agreePrivacy: false,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice with fullname using swedish latin characters should succeed #TC-354', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: 'Segol Åkerlund Sjöström',
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice with fullname using non-latin characters should succeed #TC-355', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: '度鳴杜 寅无符',
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Register frontoffice user without request header should fail #TC-356', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const res = await chai.request(request.getSvcUrl()).post(url).send(body);
      report.setPayload(this, res);
      expect(res).to.have.property('statusCode', 400);
    });

    it('Register frontoffice user with nonexistent salutation should fail #TC-357', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: 'Dr.',
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Register frontoffice user with salutation empty string should fail #TC-358', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: '',
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with salutation null should fail #TC-359', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: null,
        nationality: 1,
        username: alphaNumeric,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with username empty string should fail #TC-360', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: '',
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with username null should fail #TC-361', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: null,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with username containing uppercase should fail #TC-362', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: 'AsdadAsda',
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice username using trailing whitespace should be trimmed #TC-363', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `   ${alphaNumeric}  `,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice with username using extra middle space should fail #TC-364', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(7);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric} ${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice with username using whitespaces only should fail #TC-365', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(7);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: '              ',
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice with username using 7 characters should fail #TC-366', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(7);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice with username using 21 characters should fail #TC-367', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric(21);
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with fullname null should fail #TC-368', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: null,
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with fullname using numeric characters should fail #TC-369', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: `${help.randomFullName()} 123`,
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice with fullname empty string should fail #TC-370', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: '',
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user fullname using trailing whitespace should be trimmed #TC-371', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: `  ${help.randomFullName()}   `,
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user fullname using whitespaces only should fail #TC-372', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: '            ',
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user invalid email format should fail #TC-373', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: '-- `"rtest@asd@investree.id',
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with email empty string should fail #TC-374', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: '',
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with email null should fail #TC-375', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: null,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number empty string should fail #TC-376', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: '',
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number null should fail #TC-377', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: null,
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number using non-numeric characters should fail #TC-378', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: 'lkjaskdl@$%',
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number using 8 characters should fail #TC-379', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(8),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with phone number using 13 characters should fail #TC-380', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(13),
        mobilePrefix: '1',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with mobile prefix empty string should fail #TC-381', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '',
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with mobile prefix null should fail #TC-382', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: null,
        agreeSubscribe: true,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with subscribe empty string should succeed #TC-383', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: '',
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with subscribe null should succeed #TC-384', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: null,
        agreePrivacy: true,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Register frontoffice user with privacy empty string should fail #TC-385', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: false,
        agreePrivacy: '',
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Register frontoffice user with privacy null should fail #TC-386', async function () {
      const gender = help.randomGender();
      const alphaNumeric = help.randomAlphaNumeric();
      const body = {
        salutation: help.setSalutation(gender),
        nationality: 1,
        username: `${alphaNumeric}`,
        fullname: help.randomFullName(gender).toUpperCase(),
        email: `rtest${alphaNumeric}@investree.id`,
        password: vars.default_password,
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: '1',
        agreeSubscribe: false,
        agreePrivacy: null,
        captcha: captcha
      };

      const startTime = await help.startTime();
      const res = await request.frontofficeRegister(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});
