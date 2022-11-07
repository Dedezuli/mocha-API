const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const svcBaseUrl = req.getSvcUrl();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Emergency Contact Add', function () {
  const url = '/validate/customer/emergency-contact/borrower';
  let accessTokenIndividual;
  let customerIdIndividual;
  let customerIdInstitutional;

  before(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['emergency-contact']);
    report.setPayload(this, registerResIndividual);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['emergency-contact']);

    customerIdInstitutional = registerResInstitutional.customerId;
  });

  describe('#smoke', function () {
    it('Add emergency contact should succeed #TC-556', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Add emergency contact using lifetime KTP should succeed #TC-557', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing its true customerId when add emergency contact using customerId of different user #TC-558', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdInstitutional,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Add emergency contact with isDelete true should not delete data #TC-559', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdInstitutional,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: '3000-12-31',
        isDelete: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should fail when add emergency contact with KTP number below 16 digits #TC-560', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger(15),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('IdentityCardNumber must be 16 characters long');
    });

    it('Should fail when add emergency contact with KTP number above 16 digits #TC-561', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger(17),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('IdentityCardNumber must be 16 characters long');
    });

    it('Should fail when add emergency contact with KTP using expired date #TC-562', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.randomDate(2010),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('IdentityCardExpiryDate cannot less than today');
    });

    it('Should fail when add emergency contact with mobile number below 9 digits #TC-563', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
        relationship: relationship,
        fullName: help.randomFullName(gender).toUpperCase(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(8),
        emailAddress: help.randomEmail(),
        address: addr.address,
        province: addr.province.id,
        city: addr.city.id,
        district: addr.district.id,
        village: addr.subDistrict.id,
        postalCode: addr.postalCode,
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('MobileNumber must be must be 9 - 12 digits');
    });

    it('Should fail when add emergency contact with mobile number above 12 digits #TC-564', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
        relationship: relationship,
        fullName: help.randomFullName(gender).toUpperCase(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(13),
        emailAddress: help.randomEmail(),
        address: addr.address,
        province: addr.province.id,
        city: addr.city.id,
        district: addr.district.id,
        village: addr.subDistrict.id,
        postalCode: addr.postalCode,
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: '3000-12-31',
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('MobileNumber must be must be 9 - 12 digits');
    });

    it('Should fail when add emergency contact if borrower status is active #TC-565', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const loginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
      const boAccessToken = loginRes.data.accessToken;

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when add emergency contact if borrower status is pending verification #TC-566', async function () {
      const registerRes = await req.borrowerRegister(false);
      const accessToken = registerRes.accessToken;

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});

      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when add emergency contact if borrower status is inactive #TC-567', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const loginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
      const boAccessToken = loginRes.data.accessToken;

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdIndividual,
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
        identityCardUrl: help.randomUrl(),
        identityCardNumber: help.randomInteger('KTP'),
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});
