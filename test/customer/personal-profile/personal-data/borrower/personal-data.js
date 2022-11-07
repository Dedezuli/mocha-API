const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const vars = require('@fixtures/vars');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Personal Profile Borrower Personal Data', function () {
  const url = '/validate/customer/personal-profile/personal-data/borrower';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const urlLogin = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdInstitutional;

  before(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['financial-information']);

    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['financial-information']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;

    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Add personal profile personal data of individual borrower should succeed #TC-742', async function () {
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

    it('Should succeed to save in db new core when add personal profile personal data of individual borrower #TC-743', async function () {
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
      await assertSavedDataInNewCore(getData, body);
    });

    it('Add personal profile personal data of institutional borrower should succeed #TC-744', async function () {
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

    it('Should succeed to save in db new core when add personal profile personal data of institutional borrower #TC-745', async function () {
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
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db legacy when add personal profile personal data of borrower #TC-746', async function () {
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
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedDataInLegacy(getData.body, body);
    });

    it('Add personal profile personal data date of birth should not be under 17 years old #TC-747', async function () {
      const dateOfBirth = help.dateUnder17YearsOld();

      const body = generateBody();
      body.dateOfBirth = dateOfBirth;

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

      expect(res.body.meta.message).to.eql('dateOfBirth must be less than 17 years ago');
    });

    it('Add personal profile personal data date of birth under 17 years old should not check month only #TC-748', async function () {
      const date = new Date();

      if (date.getDate() === 1) {
        report.setInfo(this, 'This test case skipped because today is 1st day of the month');
        this.skip();
      }

      date.setDate(1);
      date.setFullYear(date.getFullYear() - 17);
      const dateOfBirth = help.formatDate(date);

      const body = generateBody();
      body.dateOfBirth = dateOfBirth;

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
  });

  describe('#negative', function () {
    it('Should fail when add personal profile personal data if borrower status is active #TC-749', async function () {
      const registerRes = await req.borrowerRegister(true);
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

    it('Should fail when add personal profile personal data if borrower status is pending verification #TC-750', async function () {
      const registerRes = await req.borrowerRegister(true);
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

    it('Should fail when add personal profile personal data if borrower status is inactive #TC-751', async function () {
      const registerRes = await req.borrowerRegister(true);
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

    it('Should failed to update individual borrower with restricted email #TC-752', async function () {
      const registerResRejectedIndividual = await req.borrowerRegister(false, [
        'personal-profile-personal-data'
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

    it('Should failed to update institutional borrower with restricted email #TC-753', async function () {
      const registerResRejectedInstitutional = await req.borrowerRegister(true, [
        'personal-profile-personal-data'
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

    it('Should failed to save in db new core when update institutional borrower with restricted email #TC-754', async function () {
      const registerResRejectedInstitutional = await req.borrowerRegister(true, [
        'personal-profile-personal-data'
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

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedInstitutional
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should failed to save in db new core when update individual borrower with restricted email #TC-755', async function () {
      const registerResRejectedIndividual = await req.borrowerRegister(false, [
        'personal-profile-personal-data'
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

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenRejectedIndividual
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should failed to save in db legacy when update individual borrower with restricted email #TC-756', async function () {
      const registerResRejectedIndividual = await req.borrowerRegister(false, [
        'personal-profile-personal-data'
      ]);

      const customerIdRejectedIndividual = registerResRejectedIndividual.customerId;
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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdRejectedIndividual
        });
      await assertNotSavedDataInLegacy(getData.body);
    });
  });
});

function generateBody () {
  const randomAddress = help.randomAddress();
  const dateOfBirth = help.randomDate(2000);

  const body = {
    placeOfBirth: 514,
    dateOfBirth: dateOfBirth,
    religion: 1,
    education: 3,
    occupation: 4,
    maritalStatus: 1,
    domicileAddress: randomAddress.address,
    domicileProvince: randomAddress.province.id,
    domicileCity: randomAddress.city.id,
    domicileDistrict: randomAddress.district.id,
    domicileSubDistrict: randomAddress.subDistrict.id,
    domicilePostalCode: randomAddress.postalCode,
    sameAsDomicileAddress: false
  };

  return body;
}

function assertSavedDataInNewCore (getData, bodyRequest) {
  const placeOfBirth = getData.body.data.advancedInfo.personalProfile.field.placeOfBirth.id;
  const dateOfBirth = getData.body.data.advancedInfo.personalProfile.field.dateOfBirth;
  const religion = getData.body.data.advancedInfo.personalProfile.field.religion.id;
  const education = getData.body.data.advancedInfo.personalProfile.field.education.id;
  const occupation = getData.body.data.advancedInfo.personalProfile.field.occupation.id;
  const maritalStatus = getData.body.data.advancedInfo.personalProfile.field.maritalStatus.id;
  const domicileAddress = getData.body.data.advancedInfo.personalProfile.field.domicileAddress;
  const domicileCity = getData.body.data.advancedInfo.personalProfile.field.domicileCity.id;
  const domicileDistrict = getData.body.data.advancedInfo.personalProfile.field.domicileDistrict.id;
  const domicileSubDistrict =
    getData.body.data.advancedInfo.personalProfile.field.domicileSubDistrict.id;
  const domicilePostalCode =
    getData.body.data.advancedInfo.personalProfile.field.domicilePostalCode;
  const sameAsDomicileAddress =
    getData.body.data.advancedInfo.personalProfile.field.sameAsDomicileAddress;
  expect(bodyRequest).to.have.property(
    'placeOfBirth',
    placeOfBirth,
    'place of birth request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'dateOfBirth',
    dateOfBirth,
    'date of birth request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'religion',
    religion,
    'religion request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'education',
    education,
    'education request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'occupation',
    occupation,
    'ocupation request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'maritalStatus',
    maritalStatus,
    'marital status request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicileAddress',
    domicileAddress,
    'domicile address request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicileCity',
    domicileCity,
    'domicile city request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicileDistrict',
    domicileDistrict,
    'domicile district request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicileSubDistrict',
    domicileSubDistrict,
    'domicile sub district request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicilePostalCode',
    domicilePostalCode,
    'domicile postal code request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'sameAsDomicileAddress',
    sameAsDomicileAddress,
    'same as domicile address request is not equal to response get'
  );
}

function assertNotSavedInNewCore (getData, bodyRequest) {
  const placeOfBirth = getData.body.data.advancedInfo.personalProfile.field.placeOfBirth;
  const dateOfBirth = getData.body.data.advancedInfo.personalProfile.field.dateOfBirth;
  const religion = getData.body.data.advancedInfo.personalProfile.field.religion;
  const education = getData.body.data.advancedInfo.personalProfile.field.education;
  const occupation = getData.body.data.advancedInfo.personalProfile.field.occupation;
  const maritalStatus = getData.body.data.advancedInfo.personalProfile.field.maritalStatus;
  const domicileAddress = getData.body.data.advancedInfo.personalProfile.field.domicileAddress;
  const domicileCity = getData.body.data.advancedInfo.personalProfile.field.domicileCity;
  const domicileDistrict = getData.body.data.advancedInfo.personalProfile.field.domicileDistrict;
  const domicileSubDistrict =
    getData.body.data.advancedInfo.personalProfile.field.domicileSubDistrict;
  const domicilePostalCode =
    getData.body.data.advancedInfo.personalProfile.field.domicilePostalCode;
  expect(bodyRequest)
    .to.have.property('placeOfBirth')
    .not.equal(placeOfBirth, 'place of birth request is equal to response get');
  expect(bodyRequest)
    .to.have.property('dateOfBirth')
    .not.equal(dateOfBirth, 'date of birth request is equal to response get');
  expect(bodyRequest)
    .to.have.property('religion')
    .not.equal(religion, 'religion request is equal to response get');
  expect(bodyRequest)
    .to.have.property('education')
    .not.equal(education, 'education request is equal to response get');
  expect(bodyRequest)
    .to.have.property('occupation')
    .not.equal(occupation, 'ocupation request is equal to response get');
  expect(bodyRequest)
    .to.have.property('maritalStatus')
    .not.equal(maritalStatus, 'marital status request is equal to response get');
  expect(bodyRequest)
    .to.have.property('domicileAddress')
    .not.equal(domicileAddress, 'domicile address request is equal to response get');
  expect(bodyRequest)
    .to.have.property('domicileCity')
    .not.equal(domicileCity, 'domicile city request is equal to response get');
  expect(bodyRequest)
    .to.have.property('domicileDistrict')
    .not.equal(domicileDistrict, 'domicile district request is equal to response get');
  expect(bodyRequest)
    .to.have.property('domicileSubDistrict')
    .not.equal(domicileSubDistrict, 'domicile sub district request is equal to response get');
  expect(bodyRequest)
    .to.have.property('domicilePostalCode')
    .not.equal(domicilePostalCode, 'domicile postal code request is equal to response get');
}

function assertSavedDataInLegacy (getData, bodyRequest) {
  const data = getData[0];
  const pob = `${data.bpd_pob}`;
  let dob = data.bpd_dob;
  dob = dob.split('T');
  dob = dob[0];
  const domicileAddress = data.bpd_domicile_address;
  const domicileProvince = data.bpd_domicile_province;
  const domicileCity = data.bpd_domicile_kab_kot;
  const domicileVillage = data.bpd_domicile_kelurahan;
  const domicileDistrict = data.bpd_domicile_kecamatan;
  const domicilePostalCode = data.bpd_domicile_postal_code;
  expect(pob).to.equal('JAYAPURA', 'place of birth request is not equal to response get');
  expect(bodyRequest).to.have.property(
    'dateOfBirth',
    dob,
    'date of birth request is not equal to response get'
  );
  expect(bodyRequest).to.have.property(
    'domicileAddress',
    domicileAddress,
    'domicile address request is not equal to response get'
  );
  expect(domicileProvince, 'failed to save domicile province').is.not.empty;
  expect(domicileCity, 'failed to save domicile city').is.not.empty;
  expect(domicileDistrict, 'failed to save domicile district').is.not.empty;
  expect(domicileVillage, 'failed to save domicile village').is.not.empty;
  expect(bodyRequest).to.have.property(
    'domicilePostalCode',
    domicilePostalCode,
    'domicile postal code request is not equal to response get'
  );
}

function assertNotSavedDataInLegacy (getData) {
  const data = getData[0];
  const pob = data.bpd_pob;
  const dob = data.bpd_dob;
  const domicileAddress = data.bpd_domicile_address;
  const domicileProvince = data.bpd_domicile_province;
  const domicileCity = data.bpd_domicile_kab_kot;
  const domicileVillage = data.bpd_domicile_kelurahan;
  const domicileDistrict = data.bpd_domicile_kecamatan;
  const domicilePostalCode = data.bpd_domicile_postal_code;
  expect(pob).to.be.null;
  expect(dob).to.be.null;
  expect(domicileAddress).to.be.null;
  expect(domicileProvince).to.be.null;
  expect(domicileCity).to.be.null;
  expect(domicileVillage).to.be.null;
  expect(domicileDistrict).to.be.null;
  expect(domicilePostalCode).to.be.null;
}
