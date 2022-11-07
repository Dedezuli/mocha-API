const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');
const expect = chai.expect;

describe('Shareholder Information Add', function () {
  const url = '/validate/customer/shareholders-information?userRoleType=1';

  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  let accessTokenIndividual;
  let accessTokenInstitutional;
  let customerIdInstitutional;
  let usernameInstitutional;

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false, ['shareholders-information']);

    accessTokenIndividual = registerResIndividual.accessToken;

    const registerResInstitutional = await req.borrowerRegister(true, ['shareholders-information']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Add shareholder information should succeed #TC-801', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Add shareholder information uncheck isLss isPgs isTss false should succeed #TC-802', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Shareholder information that saved in newcore and legacy should sync #TC-803', async function () {
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
        taxCardNumber: help.randomInteger('NPWP')
      };
      const startTime = help.startTime();
      const res = await chai
        .request(req.getSvcUrl())
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(req.getSvcUrl())
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );

      const shareholderId = res.body.data.id;
      const getDataLegacy = await chai
        .request(req.getApiSyncUrl())
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });
      await assertDataUsingGet(getData, body, getDataLegacy.body);
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add shareholder information using customerId of different user #TC-804', async function () {
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
        .request(req.getSvcUrl())
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

    it('Should fail when add shareholder information with stock ownership above 100 #TC-805', async function () {
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
        .request(req.getSvcUrl())
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

    it('Should fail when add shareholder information with NPWP number below 15 digits #TC-806', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Should fail when add shareholder information with NPWP number above 15 digits #TC-807', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Add shareholder information NPWP expiry date should not pass the validity period #TC-808', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Add shareholder information date of birth should not greater than today #TC-809', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Should fail when add shareholder information with KTP number below 16 digits #TC-810', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Should fail when add shareholder information with KTP number above 16 digits #TC-811', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Add shareholder information KTP expired date should not be past date #TC-812', async function () {
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
        .request(req.getSvcUrl())
        .post(url)
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

    it('Should fail when add shareholder information if borrower status is active #TC-813', async function () {
      const registerRes = await req.borrowerRegister(true);
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
        .request(req.getSvcUrl())
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
        .request(req.getSvcUrl())
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

    it('Should fail when add shareholder information if borrower status is pending verification #TC-814', async function () {
      const registerRes = await req.borrowerRegister(true);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(req.getSvcUrl())
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
        .request(req.getSvcUrl())
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

    it('Should fail when add shareholder information if borrower status is inactive #TC-815', async function () {
      const registerRes = await req.borrowerRegister(true);
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
        .request(req.getSvcUrl())
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
        .request(req.getSvcUrl())
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

    it('Should fail to save in DB when add shareholder information using restricted email #TC-816', async function () {
      await dbFun.changeEmailByUsername(usernameInstitutional);

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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if position is null #TC-817', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the fullname is null #TC-818', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the phone is null #TC-819', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the email is null #TC-820', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the id file is null #TC-821', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the id number is null #TC-822', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the tax file is null #TC-823', async function () {
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
        .request(req.getSvcUrl())
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

    it('Data should failed to save in newcore and legacy if the tax number is null #TC-824', async function () {
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
        .request(req.getSvcUrl())
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
  const stringStockOwnership = `${bodyRequest.stockOwnership}`;

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
  expect(bodyRequest).to.have.property(
    'mobileNumber',
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
  expect(bodyRequest).to.have.property(
    'dob',
    shareHolderDateofBirth,
    'shareholder date of birth is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardUrl',
    shareHolderIdentificationFile,
    'shareholder identification file is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'identificationCardNumber',
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
  expect(bodyRequest).to.have.property(
    'mobileNumber',
    shareHolderMobileNumberLegacy,
    'shareholder mobile number is not equal to the response'
  );
  expect(bodyRequest).to.have.property(
    'emailAddress',
    shareHolderEmailAddressLegacy,
    'shareholder email address is not equal to the response'
  );
  expect(stringStockOwnership).to.equal(
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
  expect(bodyRequest).to.have.property(
    'identificationCardNumber',
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
