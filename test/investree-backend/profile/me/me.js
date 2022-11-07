const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Cached User Profile', () => {
  const svcBaseUrl = req.getSvcUrl();
  const beBaseUrl = req.getBackendUrl();
  const url = '/profile/me';
  const loginUrl = '/auth/login/frontoffice';
  const foUpdateUrl = '/validate/users/frontoffice/update';
  const sendOtpUrl = '/validate/notification/otp';
  const verifyOtpUrl = '/validate/notification/otp/verify';
  const productPrefUrl = '/validate/customer/customer-information/product-preference/borrower';
  const changeStatusUrl = '/validate/customer/customer-information/change-status';

  let accessToken;
  let customerId;
  let boAccessToken;

  before(async function () {
    let loginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = loginRes.data.accessToken;
  });

  beforeEach(async function () {
    let registerRes = await req.borrowerRegister();
    let loginRes = await chai
      .request(beBaseUrl)
      .post(loginUrl)
      .set(req.createNewCoreHeaders())
      .send({
        email: registerRes.emailAddress,
        password: help.getDefaultPassword(),
        captcha: 'qa-bypass-captcha'
      });
    customerId = registerRes.customerId;
    accessToken = loginRes.body.data.accessToken;
  });

  describe('#smoke', () => {
    it('Get user profile should succeed', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(res).to.have.status(200);
    });

    it('User profile data should be mutated after full name is updated', async function () {
      this.skip();
      const updateBody = {
        fullname: help.randomFullName()
      };
      const updateRes = await chai
        .request(svcBaseUrl)
        .put(foUpdateUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(updateBody);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.fullName, `Full name should be equal to expectation`).to.eql(
        updateBody.fullname
      );
    });

    it('User profile data should be mutated after phone number is updated', async function () {
      this.skip();
      let registerBody = {
        phoneNumber: help.randomPhoneNumber(),
        email: help.randomEmail()
      };
      await req.frontofficeRegister(registerBody);

      let loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: registerBody.email,
          password: help.getDefaultPassword(),
          flag: 1
        });
      let accessToken = loginRes.body.data.accessToken;

      let sendOtpBody = {
        phoneNumber: help.randomPhoneNumber(),
        mobilePrefix: 1
      };
      await chai
        .request(svcBaseUrl)
        .post(sendOtpUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(sendOtpBody);

      await chai
        .request(svcBaseUrl)
        .post(verifyOtpUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({
          otp: '123456'
        });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.phoneNumber, `phoneNumber should be equal to expectation`).to.eql(
        sendOtpBody.phoneNumber
      );
    });

    it('User profile data should be mutated after otp status is verified', async function () {
      this.skip();
      let registerBody = {
        email: help.randomEmail()
      };
      await req.frontofficeRegister(registerBody);

      let loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: registerBody.email,
          password: help.getDefaultPassword(),
          flag: 1
        });
      let accessToken = loginRes.body.data.accessToken;

      await chai
        .request(svcBaseUrl)
        .post(verifyOtpUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({
          otp: '123456'
        });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.otpVerificationStatus, `OTP verification status should be true`).to.be
        .true;
    });

    it('User profile data should be mutated after user preference is filled', async function () {
      this.skip();
      let registerBody = {
        email: help.randomEmail()
      };
      await req.frontofficeRegister(registerBody);

      let loginRes = await chai
        .request(beBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: registerBody.email,
          password: help.getDefaultPassword(),
          flag: 1
        });
      let accessToken = loginRes.body.data.accessToken;
      let customerId = loginRes.body.data.customerId;

      await chai
        .request(svcBaseUrl)
        .post(verifyOtpUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({
          otp: '123456'
        });

      let productPrefBody = {
        companyName: help.randomCompanyName(),
        legalEntity: 1,
        userCategory: 2,
        productPreference: 3,
        productSelection: 2
      };

      await chai
        .request(svcBaseUrl)
        .post(`${productPrefUrl}}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(productPrefBody);

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(res.body.data.userPreference, `User preference should be equal to expectation`).to.eql(
        {
          id: 3,
          name: 'AllProduct'
        }
      );
      expect(res.body.data.userPreferenceStatus, `User preference status should be true`).to.be
        .true;
    });

    it('User profile data should be mutated after user status is updated to Active', async function () {
      this.skip();
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send({
          userType: 'Borrower',
          status: 'Active'
        });

      const startTime = help.startTime();
      const res = await chai
        .request(beBaseUrl)
        .get(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, 'NH-161');
      report.setSeverity(this, 'blocker');

      expect(
        res.body.data.registrationStatus.borrower,
        `Borrower registration status should be Active`
      ).to.eql({
        id: 3,
        name: 'Active'
      });
    });
  });
});
