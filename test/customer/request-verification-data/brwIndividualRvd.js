const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const db = require('@lib/dbFunction');
const newcoreDbConfig = require('@root/knexfile.js')[req.getEnv()];
const knex = require('knex')(newcoreDbConfig);
const boUser = require('@fixtures/backoffice_user');
const moment = require('moment');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Individual Borrower Request Verification Data', function () {
  const rvdUrl = '/validate/customer/request-verification-data';
  const brwDataUrl = '/validate/customer/completing-data/frontoffice/borrower';
  const psnProfileUrl = '/validate/customer/personal-profile';
  const loginUrl = '/validate/users/auth/login';
  const PENDING_VERIFICATION_STATUS = 3;
  let boAccessToken;

  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Individual borrower request data verification should succeed when data completion filled without financial information #TC-757', async function () {
      const registerRes = await req.borrowerRegister(false, ['e-statement', 'financial-statement']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes.body.data.registrationStatus.borrower.id).to.eql(
        PENDING_VERIFICATION_STATUS,
        `Expected status to equal ${PENDING_VERIFICATION_STATUS}, but got ${rvdRes.body.data.status}`
      );
    });

    it('Individual borrower request data verification should succeed when data completion filled with financial information #TC-758', async function () {
      const registerRes = await req.borrowerRegister();
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes.body.data.registrationStatus.borrower.id).to.eql(
        PENDING_VERIFICATION_STATUS,
        `Expected status to equal ${PENDING_VERIFICATION_STATUS}, but got ${rvdRes.body.data.status}`
      );
    });

    it('Individual borrower request data verification should succeed when data completion filled exceed total #TC-759', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerId,
        relationship: relationship,
        fullName: help.randomFullName(gender).toUpperCase(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        address: addr.address,
        province: addr.province.id,
        city: addr.city.id,
        district: addr.district.id,
        village: addr.subDistrict.id,
        postalCode: addr.postalCode,
        identityCardUrl: `ktp_emergency_${customerId}_${help.randomInteger(3)}.jpeg`,
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const emergencyContactUrl = '/validate/customer/emergency-contact';
      await chai
        .request(req.getSvcUrl())
        .post(emergencyContactUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(200);
    });

    it('Individual borrower request data verification without SKDU should succeed #TC-760', async function () {
      const registerRes = await req.borrowerRegister(false, ['skdu']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(200);
    });

    it('Individual borrower request data verification status should sync between new core and legacy #TC-762', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const brwDataRes = await chai
        .request(req.getSvcUrl())
        .get(brwDataUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      report.setPayload(this, brwDataRes);

      const regStatus = brwDataRes.body.data.basicInfo.registrationStatus.name;
      expect(regStatus).to.eql('Pending Verification');

      const bpdRes = await chai
        .request(req.getApiSyncUrl())
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });

      const bpdData = JSON.parse(bpdRes.text);
      expect(bpdData[0].bpd_right_data, "bpd_right_data does not equal to $'D'").to.eql('D');
      expect(bpdData[0].bpd_fill_finish_date, 'bpd_fill_finish_date is null').to.be.not.null;
    });

    it('Individual borrower request data verification should fill cr_fill_finish_at #TC-763', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const acceptedTime = moment().local().add(1, 'm').format('YYYY-MM-DD hh:mm:ss');
      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const row = await knex
        .select('cr_fill_finish_at')
        .from('customer_role')
        .where('cr_ci_id', customerId)
        .first();

      const fillFinishAt = moment(row.cr_fill_finish_at).local().format('YYYY-MM-DD hh:mm:ss');
      const isInTimeRange = moment(fillFinishAt).isBefore(acceptedTime);
      expect(
        isInTimeRange,
        `Expected cr_fill_finish_at around ${acceptedTime}. But got ${fillFinishAt}.`
      ).to.be.true;
    });
  });

  describe('#negative', function () {
    it('Individual borrower request data verification should fail when email is not verified #TC-764', async function () {
      const registerRes = await req.borrowerRegister(false, ['verify-email']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Email is not verified');
    });

    it('Individual borrower request data verification should fail when personal profile is empty #TC-765', async function () {
      const registerRes = await req.borrowerRegister(false, [
        'personal-profile-identification',
        'personal-profile-personal-data'
      ]);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Personal Profile is not completed');
    });

    it('Individual borrower request data verification should fail when personal profile is not completed #TC-766', async function () {
      const registerRes = await req.borrowerRegister(false, ['personal-profile-identification']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomAddress = help.randomAddress();
      const randomInteger = help.randomInteger(3);
      const body = {
        selfiePicture: `selfie_${customerId}_${randomInteger}.jpg`,
        idCardPicture: `id_card_${customerId}_${randomInteger}.jpg`,
        idCardNumber: help.randomInteger('KTP'),
        idCardExpiredDate: '3000-01-01',
        sameAsDomicileAddress: true,
        address: randomAddress.address,
        province: randomAddress.province.id,
        city: randomAddress.city.id,
        district: randomAddress.district.id,
        subDistrict: randomAddress.subDistrict.id,
        postalCode: randomAddress.postalCode,
        placeOfBirth: 514,
        dateOfBirth: help.randomDate(2000),
        religion: 1,
        education: 3,
        occupation: 4
      };

      await chai
        .request(req.getSvcUrl())
        .put(`${psnProfileUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Personal Profile is not completed');
    });

    it('Individual borrower request data verification should fail when business profile is empty #TC-767', async function () {
      const registerRes = await req.borrowerRegister(false, ['business-profile']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('BusinessProfile is Empty');
    });

    it('Individual borrower request data verification should fail when business profile is not completed #TC-768', async function () {
      const registerRes = await req.borrowerRegister(false, ['business-profile']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomAddress = help.randomAddress();
      const body = {
        customerId: customerId,
        companyName: 'Quality Assurance Company',
        legalEntity: 1,
        dateOfEstablishment: help.randomDate(2010),
        numberOfEmployee: help.randomInteger(3),
        companyDescription: help.randomDescription(5),
        companyAddress: randomAddress.address,
        province: randomAddress.province.id,
        city: randomAddress.city.id,
        district: randomAddress.district.id,
        village: randomAddress.subDistrict.id,
        postalCode: randomAddress.postalCode,
        landLineNumber: help.randomPhoneNumber()
      };

      const businessProfileUrl = '/validate/customer/business-profile';
      await chai
        .request(req.getSvcUrl())
        .post(businessProfileUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Business Profile is not completed');
    });

    it('Individual borrower request data verification should fail when emergency contact is empty #TC-769', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('EmergencyContact is Empty');
    });

    it('Individual borrower request data verification should fail when legal information is empty #TC-770', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Legal Information is not completed');
    });

    it('Individual borrower request data verification should fail when legal information filled with SKDU only #TC-771', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomInteger = help.randomInteger(3);
      const body = {
        customerId: customerId,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: `skdu_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

      const legalInfoUrl = '/validate/customer/legal-information';
      await chai
        .request(req.getSvcUrl())
        .post(legalInfoUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Legal Information is not completed');
    });

    it('Individual borrower request data verification should fail when user is already active #TC-772', async function () {
      const registerRes = await req.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(req.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Individual borrower request data verification should fail when user is inactive #TC-773', async function () {
      const registerRes = await req.borrowerRegister();
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(req.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Individual borrower request data verification should fail when user is already Pending Verification #TC-774', async function () {
      const registerRes = await req.borrowerRegister();
      const accessToken = registerRes.accessToken;

      let rvdStartTime = help.startTime();
      let rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      let rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      rvdStartTime = help.startTime();
      rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Individual borrower request data verification should fail when OTP is not verified #TC-775', async function () {
      const registerRes = await req.borrowerRegister(false, ['verify-otp']);
      const accessToken = registerRes.accessToken;

      let rvdStartTime = help.startTime();
      let rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      let rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      rvdStartTime = help.startTime();
      rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Individual borrower request data verification should not update status if failed to sync with legacy #TC-776', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const userName = registerRes.userName;

      await db.changeEmailByUsername(userName);
      const loginRes = await chai
        .request(req.getSvcUrl())
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: userName,
          password: help.getDefaultPassword(),
          flag: 1
        });
      const accessToken = loginRes.body.data.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const brwDataRes = await chai
        .request(req.getSvcUrl())
        .get(brwDataUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      report.setPayload(this, brwDataRes);

      const regStatus = brwDataRes.body.data.basicInfo.registrationStatus.name;
      expect(regStatus).to.not.eql('Pending Verification');

      const bpdRes = await chai
        .request(req.getApiSyncUrl())
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });

      const bpdData = JSON.parse(bpdRes.text);

      expect(bpdData[0].bpd_right_data, "bpd_right_data does not equal to 'D'").to.eql('D');
      expect(bpdData[0].bpd_fill_finish_date, 'bpd_fill_finish_date is not null').to.be.null;
    });

    it('Individual borrower request data verification should not fill cr_fill_finish_at if failed #TC-777', async function () {
      const registerRes = await req.borrowerRegister(false, ['verify-email']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const row = await knex
        .select('cr_fill_finish_at')
        .from('customer_role')
        .where('cr_ci_id', customerId)
        .first();

      expect(
        row.cr_fill_finish_at,
        `Expected cr_fill_finish_at to be null. But got value ${row.cr_fill_finish_at}`
      ).to.be.null;
    });
  });
});
