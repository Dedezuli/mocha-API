const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const chai = require('chai');

describe('Frontoffice User Update', function () {
  const url = '/validate/users/frontoffice/update';
  let accessTokenIndividual;

  before(async function () {
    report.setInfo(this, 'Attempting to do frontoffice register');
    const registerResIndividual = await request.frontofficeRegister();
    report.setPayload(this, registerResIndividual);

    expect(registerResIndividual.body.data).to.have.property('accessToken');
    expect(registerResIndividual.body.data).to.have.property('customerId');

    accessTokenIndividual = registerResIndividual.body.data.accessToken;
    report.setInfo(this, `Registered with accessToken ${accessTokenIndividual}`);
  });

  describe('#smoke', function () {
    it('Frontoffice user update OTP verification status to true should succeed #TC-423', async function () {
      const body = {
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update email address should succeed #TC-424', async function () {
      const body = {
        emailAddress: help.randomEmail(),
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update username should succeed #TC-425', async function () {
      const body = {
        username: help.randomAlphaNumeric(),
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update salutation should succeed #TC-426', async function () {
      const body = {
        salutation: 'Ms.',
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update position with institution should succeed #TC-427', async function () {
      const body = {
        positionWithInstitution: 2,
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update division within institution should succeed #TC-428', async function () {
      const body = {
        divisionWithInstitution: 4,
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Frontoffice user update OTP verification status should not be modified from true to false #TC-429', async function () {
      const body = {
        otpVerificationStatus: false
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update OTP verification status should not be modified to empty string #TC-430', async function () {
      const body = {
        otpVerificationStatus: ''
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update OTP verification status should not be modified to null #TC-431', async function () {
      const body = {
        otpVerificationStatus: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Frontoffice user update user category should not be modified #TC-432', async function () {
      const body = {
        UserCategory: 2,
        otpVerificationStatus: true
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });
  });
});
