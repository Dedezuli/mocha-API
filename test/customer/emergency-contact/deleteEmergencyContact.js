const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();

describe('Emergency Contact Delete', function () {
  const url = '/validate/customer/emergency-contact/borrower';
  let accessTokenIndividual;
  let accessTokenInstitutional;
  let customerIdIndividual;

  before(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['emergency-contact']);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['emergency-contact']);

    accessTokenInstitutional = registerResInstitutional.accessToken;
  });

  describe('#smoke', function () {
    it('Delete emergency contact should succeed #TC-568', async function () {
      const emergencyId = await createEmergencyContact(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${emergencyId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Should fail when delete emergency contact owned by other user #TC-569', async function () {
      const emergencyId = await createEmergencyContact(
        url,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${emergencyId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(404);
    });

    it('Should fail when delete emergency contact if borrower status is active #TC-570', async function () {
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

      const startTime = help.startTime();

      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${emergencyId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );

      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete emergency contact if borrower status is pending verification #TC-571', async function () {
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

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${emergencyId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when delete emergency contact if borrower status is inactive #TC-572', async function () {
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

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .del(`${url}/${emergencyId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});

async function createEmergencyContact (url, customerId, accessToken) {
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
