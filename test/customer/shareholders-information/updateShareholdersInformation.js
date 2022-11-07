const help = require('@lib/helper');
const req = require('@lib/request');
const vars = require('@fixtures/vars');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Shareholder Information Update', function () {
  const url = '/validate/customer/shareholders-information';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const loginUrl = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdInstitutional;
  let usernameInstitutional;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['shareholders-information']);

    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['shareholders-information']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Update shareholder information should succeed #TC-825', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
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

    it('Update shareholder information uncheck isLss isPgs isTss false should succeed #TC-826', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: false,
        isPgs: false,
        isTss: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
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

    it('Should sync with legacy for updating shareholder information #TC-827', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: 'Immanuel',
        mobilePrefix: 1,
        mobileNumber: 99000000001,
        emailAddress: 'porororor@accc.cc',
        stockOwnership: 1.11,
        dob: '1985-09-02',
        identificationCardUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        identificationCardNumber: 8031023102301203,
        identificationCardExpiryDate: '3000-12-31',
        selfieUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        taxCardUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: false,
        isPgs: false,
        isTss: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
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

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });
      await assertDataUsingGet(getData, body, getDataLegacy.body);
    });
  });

  describe('#negative', function () {
    it('Should fail when update shareholder information using customerId of different user #TC-828', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
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

    it('Should fail when add shareholder information with stock ownership above 100 #TC-829', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 101,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql(
        'Data not valid. Please check following field: stock ownership more than 100%'
      );
    });

    it('Should fail when update shareholder information with NPWP number below 15 digits #TC-830', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger(14),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('NPWP must be 15 digits');
    });

    it('Should fail when update shareholder information with NPWP number above 15 digits #TC-831', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger(16),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('NPWP must be 15 digits');
    });

    it('Update shareholder information NPWP expiry date should not be past date #TC-832', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.randomDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Update shareholder information date of birth should not be more than today #TC-833', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.futureDate(),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Date of Birth cannot more than today');
    });

    it('Should fail when update shareholder information with KTP number below 16 digits #TC-834', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger(15),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('IdentityCardNumber must be 16 characters long');
    });

    it('Should fail when update shareholder information with KTP number above 16 digits #TC-835', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger(17),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('IdentityCardNumber must be 16 characters long');
    });

    it('Update shareholder information KTP expired date should not be past date #TC-836', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.randomDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta.message).to.eql('Identification Expiry Date cannot less than today');
    });

    it('Should fail when update shareholder information if borrower status is active #TC-837', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update shareholder information if borrower status is pending verification #TC-838', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send({});

      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update shareholder information if borrower status is inactive #TC-839', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdInstitutional);

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail when update shareholder information using restricted email #TC-840', async function () {
      const shareholderId = await createShareholderInformation(
        url,
        customerIdInstitutional,
        accessTokenInstitutional
      );

      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: vars.default_password
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = {
        customerId: customerIdInstitutional,
        position: 2,
        fullName: 'Immanuel',
        mobilePrefix: 1,
        mobileNumber: 99000000001,
        emailAddress: 'porororor@accc.cc',
        stockOwnership: 3.11,
        dob: '1985-09-02',
        identificationCardUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        identificationCardNumber: 8031023102301203,
        identificationCardExpiryDate: '3000-12-31',
        selfieUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        taxCardUrl:
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/KTP_KARTU_TANDA_PENDUDUK/KTP_KARTU_TANDA_PENDUDUK_Mjk1MTE=_1_1578035028545.png',
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: false,
        isPgs: false,
        isTss: false
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${shareholderId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
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
            'X-Investree-Token': accessToken
          })
        );

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });
      await assertFailedGetData(getData, body, getDataLegacy.body);
    });

    it('data should failed to save in newcore and legacy if the position is null #TC-841', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: null,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the fullname is null #TC-842', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: '',
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the phone is null #TC-843', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: '',
        emailAddress: help.randomEmail(),
        phone: '',
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP'),
        isLss: true,
        isPgs: true,
        isTss: true
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the email is null #TC-844', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: '',
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl(),
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the id file is null #TC-845', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: '',
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the id number is null #TC-846', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl,
        identificationCardNumber: '',
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the tax file is null #TC-847', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl,
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: '',
        taxCardNumber: help.randomInteger('NPWP')
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('data should failed to save in newcore and legacy if the tax number is null #TC-848', async function () {
      const body = {
        customerId: customerIdInstitutional,
        position: 5,
        fullName: help.randomFullName(),
        mobilePrefix: 1,
        mobileNumber: help.randomPhoneNumber(12),
        emailAddress: help.randomEmail(),
        stockOwnership: 1.11,
        dob: help.randomDate(2000),
        identificationCardUrl: help.randomUrl,
        identificationCardNumber: help.randomInteger('KTP'),
        identificationCardExpiryDate: help.futureDate(),
        selfieUrl: help.randomUrl(),
        taxCardUrl: help.randomUrl(),
        taxCardNumber: ''
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});

async function createShareholderInformation (url, customerId, accessToken) {
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

  return res.body.data.id;
}

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    position: 5,
    fullName: help.randomFullName(),
    mobilePrefix: 1,
    mobileNumber: help.randomPhoneNumber(12),
    emailAddress: help.randomEmail(),
    stockOwnership: 1.11,
    dob: help.randomDate(2000),
    identificationCardUrl: help.randomUrl(),
    identificationCardNumber: help.randomInteger('KTP'),
    identificationCardExpiryDate: help.futureDate(),
    selfieUrl: help.randomUrl(),
    taxCardUrl: help.randomUrl(),
    taxCardNumber: help.randomInteger('NPWP'),
    isLss: true,
    isPgs: true,
    isTss: true
  };

  return body;
}

function assertDataUsingGet (getData, bodyRequest, getDataLegacy) {
  const data = getData.body.data.advancedInfo.shareHolderInformation.field;
  const length = data.length;
  const shareHolderPosition = data[length - 1].position.id;
  const shareHolderName = data[length - 1].fullName;
  const shareHolderMobilePrefix = data[length - 1].mobilePrefix.id;
  const shareHolderMobileNumber = data[length - 1].mobileNumber;
  const shareHolderEmailAddress = data[length - 1].emailAddress;
  const shareHolderStockOwnership = data[length - 1].stockOwnership;
  const shareHolderDateofBirth = data[length - 1].dob;
  const shareHolderIdentificationFile = data[length - 1].identificationCardUrl;
  const shareHolderIdentificationNumber = data[length - 1].identificationCardNumber;
  const shareHolderIdentificationExp = data[length - 1].identificationCardExpiryDate;
  const shareHolderSelfieUrl = data[length - 1].selfieUrl;
  const shareHolderTaxCardUrl = data[length - 1].taxCardUrl;
  const shareHolderTaxCardNumber = data[length - 1].taxCardNumber;
  const lengthLegacy = getDataLegacy.length;
  const dataLegacy = getDataLegacy[lengthLegacy - 1];
  const shareHolderPositionLegacy = dataLegacy.bfdkd_cdoc_person_position;
  const shareHolderNameLegacy = dataLegacy.bfdkd_cdoc_person_name;
  const shareHolderMobileNumberLegacy = dataLegacy.bfdkd_phone_number;
  const shareHolderEmailAddressLegacy = dataLegacy.bfdkd_cdoc_person_email;
  const shareHolderStockOwnershipLegacy = dataLegacy.bfdkd_pg_saham;
  let shareHolderDateofBirthLegacy = dataLegacy.bfdkd_bod;
  const shareHolderIdentificationFileLegacy = dataLegacy.bfdkd_cdoc_ktp_file;
  const shareHolderIdentificationNumberLegacy = dataLegacy.bfdkd_cdoc_ktp_no;
  let shareHolderIdentificationExpLegacy = dataLegacy.bfdkd_cdoc_ktp_expired;
  const shareHolderSelfieUrlLegacy = dataLegacy.bfdkd_selfie_with_ktp;
  const shareHolderTaxCardUrlLegacy = dataLegacy.bfdkd_cdoc_npwp_file;
  const shareHolderTaxCardNumberLegacy = dataLegacy.bfdkd_cdoc_npwp_no;
  const stringMobileNumber = `${bodyRequest.mobileNumber}`;
  const stringIdentificationNumber = `${bodyRequest.identificationCardNumber}`;
  const stringStockOwnershipLegacy = `${bodyRequest.stockOwnership}`;
  const stringMobileNumberLegacy = `${bodyRequest.mobileNumber}`;
  const stringIdentificationNumberLegacy = `${bodyRequest.identificationCardNumber}`;
  // split dd/mm/yy from time
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy.split('T');
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy[0];
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy.split('T');
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy[0];

  expect(bodyRequest).to.have.property(
    'position',
    shareHolderPosition,
    'shareholder position is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'fullName',
    shareHolderName,
    'shareholder full name is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'mobilePrefix',
    shareHolderMobilePrefix,
    'shareholder mobile prefix is not equal to the response'
  );
  expect(stringMobileNumber).to.equal(
    shareHolderMobileNumber,
    'shareholder mobile number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'emailAddress',
    shareHolderEmailAddress,
    'shareholder email address is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'stockOwnership',
    shareHolderStockOwnership,
    'shareholder stock ownership is not equal to the response'
  );
  expect(bodyRequest.dob).to.equal(
    shareHolderDateofBirth,
    'shareholder date of birth is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardUrl',
    shareHolderIdentificationFile,
    'shareholder identification file is not equal to the response'
  );
  expect(stringIdentificationNumber).to.equal(
    shareHolderIdentificationNumber,
    'shareholder identification number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardExpiryDate',
    shareHolderIdentificationExp,
    'shareholder identification expiry date is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'selfieUrl',
    shareHolderSelfieUrl,
    'shareholder selfie url is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'taxCardUrl',
    shareHolderTaxCardUrl,
    'shareholder tax card url is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'taxCardNumber',
    shareHolderTaxCardNumber,
    'shareholder tax card number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'position',
    shareHolderPositionLegacy,
    'shareholder position is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'fullName',
    shareHolderNameLegacy,
    'shareholder full name is not equal to the response'
  );
  expect(stringMobileNumberLegacy).to.equal(
    shareHolderMobileNumberLegacy,
    'shareholder mobile number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'emailAddress',
    shareHolderEmailAddressLegacy,
    'shareholder email address is not equal to the response'
  );
  expect(stringStockOwnershipLegacy).to.equal(
    shareHolderStockOwnershipLegacy,
    'shareholder stock ownership is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'dob',
    shareHolderDateofBirthLegacy,
    'shareholder date of birth is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardUrl',
    shareHolderIdentificationFileLegacy,
    'shareholder identification file is not equal to the response'
  );
  expect(stringIdentificationNumberLegacy).to.equal(
    shareHolderIdentificationNumberLegacy,
    'shareholder identification number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardExpiryDate',
    shareHolderIdentificationExpLegacy,
    'shareholder identification expiry date is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'selfieUrl',
    shareHolderSelfieUrlLegacy,
    'shareholder selfie url is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'taxCardUrl',
    shareHolderTaxCardUrlLegacy,
    'shareholder tax card url is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'taxCardNumber',
    shareHolderTaxCardNumberLegacy,
    'shareholder tax card number is not equal to the response'
  );
}

function assertFailedGetData (getData, bodyRequest, getDataLegacy) {
  const data = getData.body.data.advancedInfo.shareHolderInformation.field;
  const length = data.length;
  const shareHolderPosition = data[length - 1].position.id;
  const shareHolderName = data[length - 1].fullName;
  const shareHolderMobilePrefix = data[length - 1].mobilePrefix.id;
  const shareHolderMobileNumber = data[length - 1].mobileNumber;
  const shareHolderEmailAddress = data[length - 1].emailAddress;
  const shareHolderStockOwnership = data[length - 1].stockOwnership;
  const shareHolderDateofBirth = data[length - 1].dob;
  const shareHolderIdentificationFile = data[length - 1].identificationCardUrl;
  const shareHolderIdentificationNumber = data[length - 1].identificationCardNumber;
  const shareHolderIdentificationExp = data[length - 1].identificationCardExpiryDate;
  const shareHolderSelfieUrl = data[length - 1].selfieUrl;
  const shareHolderTaxCardUrl = data[length - 1].taxCardUrl;
  const shareHolderTaxCardNumber = data[length - 1].taxCardNumber;
  const lengthLegacy = getDataLegacy.length;
  const dataLegacy = getDataLegacy[lengthLegacy - 1];
  const shareHolderPositionLegacy = dataLegacy.bfdkd_cdoc_person_position;
  const shareHolderNameLegacy = dataLegacy.bfdkd_cdoc_person_name;
  const shareHolderMobileNumberLegacy = dataLegacy.bfdkd_phone_number;
  const shareHolderEmailAddressLegacy = dataLegacy.bfdkd_cdoc_person_email;
  const shareHolderStockOwnershipLegacy = dataLegacy.bfdkd_pg_saham;
  let shareHolderDateofBirthLegacy = dataLegacy.bfdkd_bod;
  const shareHolderIdentificationFileLegacy = dataLegacy.bfdkd_cdoc_ktp_file;
  const shareHolderIdentificationNumberLegacy = dataLegacy.bfdkd_cdoc_ktp_no;
  let shareHolderIdentificationExpLegacy = dataLegacy.bfdkd_cdoc_ktp_expired;
  const shareHolderSelfieUrlLegacy = dataLegacy.bfdkd_selfie_with_ktp;
  const shareHolderTaxCardUrlLegacy = dataLegacy.bfdkd_cdoc_npwp_file;
  const shareHolderTaxCardNumberLegacy = dataLegacy.bfdkd_cdoc_npwp_no;
  const stringMobileNumber = `${bodyRequest.mobileNumber}`;
  const stringIdentificationNumber = `${bodyRequest.identificationCardNumber}`;
  const stringStockOwnershipLegacy = `${bodyRequest.stockOwnership}`;
  const stringMobileNumberLegacy = `${bodyRequest.mobileNumber}`;
  const stringIdentificationNumberLegacy = `${bodyRequest.identificationCardNumber}`;
  // split dd/mm/yy from time
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy.split('T');
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy[0];
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy.split('T');
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy[0];

  expect(bodyRequest).not.equal(
    'position',
    shareHolderPosition,
    'shareholder position is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'fullName',
    shareHolderName,
    'shareholder full name is n equal to the response'
  );
  expect(bodyRequest).not.equal(
    'mobilePrefix',
    shareHolderMobilePrefix,
    'shareholder mobile prefix is equal to the response'
  );
  expect(stringMobileNumber).not.equal(
    shareHolderMobileNumber,
    'shareholder mobile number is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'emailAddress',
    shareHolderEmailAddress,
    'shareholder email address is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'stockOwnership',
    shareHolderStockOwnership,
    'shareholder stock ownership is equal to the response'
  );
  expect(bodyRequest.dob).not.equal(
    shareHolderDateofBirth,
    'shareholder date of birth is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'identificationCardUrl',
    shareHolderIdentificationFile,
    'shareholder identification file is equal to the response'
  );
  expect(stringIdentificationNumber).not.equal(
    shareHolderIdentificationNumber,
    'shareholder identification number is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'identificationCardExpiryDate',
    shareHolderIdentificationExp,
    'shareholder identification expiry date is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'selfieUrl',
    shareHolderSelfieUrl,
    'shareholder selfie url is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'taxCardUrl',
    shareHolderTaxCardUrl,
    'shareholder tax card url is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'taxCardNumber',
    shareHolderTaxCardNumber,
    'shareholder tax card number is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'position',
    shareHolderPositionLegacy,
    'shareholder position is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'fullName',
    shareHolderNameLegacy,
    'shareholder full name is equal to the response'
  );
  expect(stringMobileNumberLegacy).not.equal(
    shareHolderMobileNumberLegacy,
    'shareholder mobile number is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'emailAddress',
    shareHolderEmailAddressLegacy,
    'shareholder email address is equal to the response'
  );
  expect(stringStockOwnershipLegacy).not.equal(
    shareHolderStockOwnershipLegacy,
    'shareholder stock ownership is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'dob',
    shareHolderDateofBirthLegacy,
    'shareholder date of birth is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'identificationCardUrl',
    shareHolderIdentificationFileLegacy,
    'shareholder identification file is equal to the response'
  );
  expect(stringIdentificationNumberLegacy).not.equal(
    shareHolderIdentificationNumberLegacy,
    'shareholder identification number is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'identificationCardExpiryDate',
    shareHolderIdentificationExpLegacy,
    'shareholder identification expiry date is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'selfieUrl',
    shareHolderSelfieUrlLegacy,
    'shareholder selfie url is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'taxCardUrl',
    shareHolderTaxCardUrlLegacy,
    'shareholder tax card url is equal to the response'
  );
  expect(bodyRequest).not.equal(
    'taxCardNumber',
    shareHolderTaxCardNumberLegacy,
    'shareholder tax card number is equal to the response'
  );
}
