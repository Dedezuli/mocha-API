const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const vars = require('@fixtures/vars');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Personal Profile Borrower Identification', function () {
  const url = '/validate/customer/personal-profile/identification/borrower';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const urlLogin = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;

  before(async function () {
    const registerResIndividual = await req.borrowerRegister(false);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;

    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Add personal profile identification of individual borrower should succeed #TC-726', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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

    it('Add personal profile identification of institutional borrower should succeed #TC-727', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should succeed to save in db new core when add personal profile identification of individual borrower #TC-728', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      await assertSavedInNewCore(getData, body);
    });

    it('Should succeed to save in db new core when add personal profile identification of institutional borrower #TC-729', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      await assertSavedInNewCore(getData, body);
    });

    it('Should succeed to save in DB legacy when add personal profile identification of institutional borrower #TC-730', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedInLegacy(bpdRes.body, body);
    });

    it('Should succeed to save in DB legacy when add personal profile identification of individual borrower #TC-731', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedInLegacy(bpdRes.body, body);
    });

    it('Add personal profile identification using idCardExpiredDate 3000-12-31 should set idCardLifetime true #TC-732', async function () {
      const body = generateBody();
      body.idCardExpiredDate = '3000-12-31';

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.data.personalProfile).to.have.property('idCardLifetime', true);
    });
  });

  describe('#negative', function () {
    it('Add personal profile identification idCardExpiredDate alphanumeric should fail #TC-733', async function () {
      const body = generateBody();
      body.idCardExpiredDate = help.randomAlphaNumeric();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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

    it('Should fail to save in db new core when add personal profile identification with alphanumeric idCardExpiredDate #TC-734', async function () {
      const registerResIndividualNew = await req.borrowerRegister(false, [
        'personal-profile-identification'
      ]);
      const accessTokenIndividualNew = registerResIndividualNew.accessToken;

      const body = generateBody();
      body.idCardExpiredDate = help.randomAlphaNumeric();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividualNew
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividualNew
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should fail when add personal profile identification if borrower status is active #TC-735', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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

    it('Should fail when add personal profile identification if borrower status is pending verification #TC-736', async function () {
      const registerRes = await req.borrowerRegister();
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

      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Your status is restricted to update/add');
    });

    it('Should fail when add personal profile identification if borrower status is inactive #TC-737', async function () {
      const registerRes = await req.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerId);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
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

    it('Should failed to update individual borrower with selected account (@investree.investree) #TC-738', async function () {
      const registerResRejectedIndividual = await req.borrowerRegister(false, [
        'personal-profile-identification'
      ]);

      let accessTokenRejectedIndividual = registerResRejectedIndividual.accessToken;
      const username = registerResRejectedIndividual.userName;

      const body = generateBody();

      await dbFun.changeEmailByUsername(username);

      const bodyLogin = {
        flag: 1,
        username: username,
        password: vars.default_password
      };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(req.createNewCoreHeaders())
        .send(bodyLogin);
      accessTokenRejectedIndividual = resLogin.body.data.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed to update institutional borrower with selected account (@investree.investree) #TC-739', async function () {
      const registerResRejectedInstitutional = await req.borrowerRegister(true, [
        'personal-profile-identification'
      ]);

      let accessTokenRejectedInstitutional = registerResRejectedInstitutional.accessToken;
      const username = registerResRejectedInstitutional.userName;

      await dbFun.changeEmailByUsername(username);

      const bodyLogin = {
        flag: 1,
        username: username,
        password: vars.default_password
      };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(req.createNewCoreHeaders())
        .send(bodyLogin);
      accessTokenRejectedInstitutional = resLogin.body.data.accessToken;

      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed to save in DB legacy when update individual borrower with restricted account (@investree.investree) #TC-740', async function () {
      const registerResRejectedIndividual = await req.borrowerRegister(false);

      let customerIdRejectedIndividual = registerResRejectedIndividual.customerId;
      let accessTokenRejectedIndividual = registerResRejectedIndividual.accessToken;
      const username = registerResRejectedIndividual.userName;

      const body = {
        selfiePicture: null,
        idCardPicture: null,
        idCardNumber: null,
        idCardExpiredDate: null,
        address: null,
        province: null,
        city: null,
        district: null,
        subDistrict: null,
        postalCode: null
      };

      await dbFun.changeEmailByUsername(username);

      const bodyLogin = {
        flag: 1,
        username: username,
        password: vars.default_password
      };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(req.createNewCoreHeaders())
        .send(bodyLogin);
      customerIdRejectedIndividual = resLogin.body.data.customerId;
      accessTokenRejectedIndividual = resLogin.body.data.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedIndividual
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdRejectedIndividual
        });
      await assertNotSavedInLegacy(bpdRes.body, body);
    });

    it('Should failed to save in DB legacy when update institutional borrower with restricted account (@investree.investree) #TC-741', async function () {
      const registerResRejectedInstitutional = await req.borrowerRegister(true);

      let customerIdRejectedInstitutional = registerResRejectedInstitutional.customerId;
      let accessTokenRejectedInstitutional = registerResRejectedInstitutional.accessToken;
      const username = registerResRejectedInstitutional.userName;

      await dbFun.changeEmailByUsername(username);

      const bodyLogin = {
        flag: 1,
        username: username,
        password: vars.default_password
      };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(req.createNewCoreHeaders())
        .send(bodyLogin);
      customerIdRejectedInstitutional = resLogin.body.data.customerId;
      accessTokenRejectedInstitutional = resLogin.body.data.accessToken;

      const body = {
        selfiePicture: null,
        idCardPicture: null,
        idCardNumber: null,
        idCardExpiredDate: null,
        address: null,
        province: null,
        city: null,
        district: null,
        subDistrict: null,
        postalCode: null
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdRejectedInstitutional
        });
      await assertNotSavedInLegacy(bpdRes.body, body);
    });
  });
});

function generateBody () {
  const idCardNumber = help.randomInteger('KTP');
  const randomAddress = help.randomAddress();

  const body = {
    selfiePicture: `${help.randomUrl()}.jpg`,
    idCardPicture: `${help.randomUrl()}.jpg`,
    idCardNumber: idCardNumber,
    idCardExpiredDate: '3000-12-31',
    address: randomAddress.address,
    province: randomAddress.province.id,
    city: randomAddress.city.id,
    district: randomAddress.district.id,
    subDistrict: randomAddress.subDistrict.id,
    postalCode: randomAddress.postalCode
  };

  return body;
}

function assertSavedInNewCore (getData, bodyRequest) {
  const selfiePicture = getData.body.data.advancedInfo.personalProfile.field.selfiePicture;
  const idCardPicture = getData.body.data.advancedInfo.personalProfile.field.idCardPicture;
  const idCardNumber = getData.body.data.advancedInfo.personalProfile.field.idCardNumber;
  const idCardExpiredDate = getData.body.data.advancedInfo.personalProfile.field.idCardExpiredDate;
  const address = getData.body.data.advancedInfo.personalProfile.field.address;
  const province = getData.body.data.advancedInfo.personalProfile.field.province.id;
  const city = getData.body.data.advancedInfo.personalProfile.field.city.id;
  const district = getData.body.data.advancedInfo.personalProfile.field.district.id;
  const subDistrict = getData.body.data.advancedInfo.personalProfile.field.subDistrict.id;
  const postalCode = getData.body.data.advancedInfo.personalProfile.field.postalCode;
  expect(bodyRequest).to.have.property('selfiePicture', selfiePicture);
  expect(bodyRequest).to.have.property('idCardPicture', idCardPicture);
  expect(bodyRequest).to.have.property('idCardNumber', idCardNumber);
  expect(bodyRequest).to.have.property('idCardExpiredDate', idCardExpiredDate);
  expect(bodyRequest).to.have.property('address', address);
  expect(bodyRequest).to.have.property('province', province);
  expect(bodyRequest).to.have.property('city', city);
  expect(bodyRequest).to.have.property('district', district);
  expect(bodyRequest).to.have.property('subDistrict', subDistrict);
  expect(bodyRequest).to.have.property('postalCode', postalCode);
}

function assertNotSavedInNewCore (getData, bodyRequest) {
  const selfiePicture = getData.body.data.advancedInfo.personalProfile.field.selfiePicture;
  const idCardPicture = getData.body.data.advancedInfo.personalProfile.field.idCardPicture;
  const idCardNumber = getData.body.data.advancedInfo.personalProfile.field.idCardNumber;
  const idCardExpiredDate = getData.body.data.advancedInfo.personalProfile.field.idCardExpiredDate;
  const address = getData.body.data.advancedInfo.personalProfile.field.address;
  const province = getData.body.data.advancedInfo.personalProfile.field.province;
  const city = getData.body.data.advancedInfo.personalProfile.field.city;
  const district = getData.body.data.advancedInfo.personalProfile.field.district;
  const subDistrict = getData.body.data.advancedInfo.personalProfile.field.subDistrict;
  const postalCode = getData.body.data.advancedInfo.personalProfile.field.postalCode;
  expect(bodyRequest).to.have.property('selfiePicture').not.equal(selfiePicture);
  expect(bodyRequest).to.have.property('idCardPicture').not.equal(idCardPicture);
  expect(bodyRequest).to.have.property('idCardNumber').not.equal(idCardNumber);
  expect(bodyRequest).to.have.property('idCardExpiredDate').not.equal(idCardExpiredDate);
  expect(bodyRequest).to.have.property('address').not.equal(address);
  expect(bodyRequest).to.have.property('province').not.equal(province);
  expect(bodyRequest).to.have.property('city').not.equal(city);
  expect(bodyRequest).to.have.property('district').not.equal(district);
  expect(bodyRequest).to.have.property('subDistrict').not.equal(subDistrict);
  expect(bodyRequest).to.have.property('postalCode').not.equal(postalCode);
}

function assertNotSavedInLegacy (getData, bodyRequest) {
  const dataBpd = getData[0];

  // data legacy
  const idCardPictureLegacy = dataBpd.bpd_ktp_file;
  const idCardNumberLegacy = dataBpd.bpd_ktp;
  const idCardExpiredDateLegacy = dataBpd.bpd_ktp_expired;

  // expecting legacy
  expect(bodyRequest)
    .to.have.property('idCardPicture')
    .not.equal(
      idCardPictureLegacy,
      'ID card picture request is equal with ID card picture in legacy'
    );
  expect(bodyRequest)
    .to.have.property('idCardNumber')
    .not.equal(idCardNumberLegacy, 'ID card number is equal with ID card number in legacy');
  expect(bodyRequest)
    .to.have.property('idCardExpiredDate')
    .not.equal(
      idCardExpiredDateLegacy,
      'ID card expired data is equal with ID card expired data in legacy'
    );
}

function assertSavedInLegacy (getData, bodyRequest) {
  const dataBpd = getData[0];

  // data legacy
  const idCardPictureLegacy = dataBpd.bpd_ktp_file;
  const idCardNumberLegacy = dataBpd.bpd_ktp;
  let idCardExpiredDateLegacy = dataBpd.bpd_ktp_expired;
  idCardExpiredDateLegacy = idCardExpiredDateLegacy.split('T');
  idCardExpiredDateLegacy = idCardExpiredDateLegacy[0];

  // expecting legacy
  expect(bodyRequest).to.have.property(
    'idCardPicture',
    idCardPictureLegacy,
    'ID card picture request is not equal with ID card picture in legacy'
  );
  expect(bodyRequest).to.have.property(
    'idCardNumber',
    idCardNumberLegacy,
    'ID card number is not equal with ID card number in legacy'
  );
  expect(bodyRequest).to.have.property(
    'idCardExpiredDate',
    idCardExpiredDateLegacy,
    'ID card expired data is not equal with ID card expired data in legacy'
  );
}
