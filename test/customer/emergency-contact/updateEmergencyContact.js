const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();

describe('Emergency Contact Update', function () {
  const url = '/validate/customer/emergency-contact/borrower';
  let emergencyIdIndividual;
  let emergencyIdOtherUser;
  let accessTokenIndividual;
  let customerIdIndividual;
  let customerIdOtherUser;
  let accessTokenOtherUser;

  before(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['emergency-contact']);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResOtherUser = await req.borrowerRegister(false, ['emergency-contact']);
    report.setPayload(this, registerResOtherUser);

    customerIdOtherUser = registerResOtherUser.customerId;
    accessTokenOtherUser = registerResOtherUser.accessToken;

    emergencyIdIndividual = await createEmergencyContact(
      url,
      customerIdIndividual,
      accessTokenIndividual
    );

    emergencyIdOtherUser = await createEmergencyContact(
      url,
      customerIdOtherUser,
      accessTokenOtherUser
    );
  });

  describe('#smoke', function () {
    it('Update emergency contact should succeed #TC-573', async function () {
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
        .put(`${url}/${emergencyIdIndividual}`)
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

    it('Update emergency contact using lifetime KTP should succeed #TC-574', async function () {
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
        .put(`${url}/${emergencyIdIndividual}`)
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
    it('Should fail when update emergency contact using emergencyId owned by different user #TC-575', async function () {
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
        .put(`${url}/${emergencyIdOtherUser}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(404);
    });

    it('Should succeed by replacing its true customerId when update emergency contact using customerId of different user #TC-576', async function () {
      const gender = help.randomGender();
      const relationship = gender ? 4 : 3;
      const addr = help.randomAddress();
      const body = {
        customerId: customerIdOtherUser,
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
        .put(`${url}/${emergencyIdIndividual}`)
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

    it('Should fail when update emergency contact with KTP number below 16 digits #TC-577', async function () {
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
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update emergency contact with KTP number above 16 digits #TC-578', async function () {
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
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update emergency contact with KTP using expired date #TC-579', async function () {
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
        identityExpiryDate: help.randomDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyIdIndividual}`)
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

    it('Should fail when update emergency contact with mobile number below 9 digits #TC-580', async function () {
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
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update emergency contact with mobile number above 12 digits #TC-581', async function () {
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
        identityExpiryDate: help.futureDate(),
        isDelete: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update emergency contact if borrower status is active #TC-582', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const emergencyId = await createEmergencyContact(url, customerId, accessToken);

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

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyId}`)
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

    it('Should fail when update emergency contact if borrower status is pending verification #TC-583', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const emergencyId = await createEmergencyContact(url, customerId, accessToken);

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

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyId}`)
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

    it('Should fail when update emergency contact if borrower status is inactive #TC-584', async function () {
      const registerRes = await req.borrowerRegister(false, ['emergency-contact']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const emergencyId = await createEmergencyContact(url, customerId, accessToken);

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

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${emergencyId}`)
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

async function createEmergencyContact (url, customerId, accessToken) {
  const body = generateBody(customerId);

  const res = await chai
    .request(svcBaseUrl)
    .post(url)
    .set(
      req.createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(body);
  return res.body.data.emergencyId;
}

function generateBody (customerId) {
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
    identityCardUrl: help.randomUrl(),
    identityCardNumber: help.randomInteger('KTP'),
    identityExpiryDate: help.futureDate(),
    isDelete: false
  };

  return body;
}
