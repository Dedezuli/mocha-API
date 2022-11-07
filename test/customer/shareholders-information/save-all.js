const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const dbFun = require('@lib/dbFunction');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Shareholder Information Update', function () {
  const shareholdersInfoFoUrl = '/validate/customer/shareholders-information?userRoleType=1';
  const url = '/validate/customer/shareholders-information/save-all';
  const urlGetData = '/validate/customer/completing-data/backoffice/borrower';

  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdInstitutional;
  let usernameInstitutional;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResInstitutional = await req.borrowerRegister(true, ['shareholders-information']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Should succeed to update shareholder information #TC-856', async function () {
      const shareholderId = await createShareholderInformation(
        shareholdersInfoFoUrl,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: shareholderId,
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: shareholderId,
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Should Succeed to Delete Shareholder information and sync to legacy #TC-857', async function () {
      const shareholderId = await createShareholderInformation(
        shareholdersInfoFoUrl,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: shareholderId,
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: true,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: shareholderId,
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });
      await assertDeleteLegacySuccess(getData, getDataLegacy.body);
    });

    it('Should Succeed to add shareholder information #TC-858', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Shareholder information should sync to legacy #TC-859', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(5),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomDecimal(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${urlGetData}/${customerIdInstitutional}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );
      const shareholderId = res.body.data[0].id;

      const getDataLegacy = await chai
        .request(apiSyncBaseUrl)
        .get('/bfdkd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bfdkd_migration_lookup_id]': shareholderId
        });

      await assertDataUsingGet(getData, body, getDataLegacy.body);
    });

    it('Should be able to save data partially #TC-860', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: '',
              checkingFile: '',
              checkingResult: ''
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(5),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomDecimal(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Should fail to save in DB when add shareholder information using restricted email #TC-861', async function () {
      const shareholderId = await createShareholderInformation(
        shareholdersInfoFoUrl,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      await dbFun.changeEmailByUsername(usernameInstitutional);
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: shareholderId,
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: shareholderId,
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.jpg`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail to save in DB when delete shareholder information using restricted email #TC-862', async function () {
      const shareholderId = await createShareholderInformation(
        shareholdersInfoFoUrl,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      await dbFun.changeEmailByUsername(usernameInstitutional);
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: shareholderId,
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: true,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: shareholderId,
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should fail to save in DB when ID card is expired #TC-863', async function () {
      const shareholderId = await createShareholderInformation(
        shareholdersInfoFoUrl,
        customerIdInstitutional,
        accessTokenInstitutional
      );
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: shareholderId,
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: 1
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '1995-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: true,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: shareholderId,
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger('NPWP'),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using below 15 char NPWP #TC-864', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(14),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using more than 15 char NPWP #TC-865', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(16),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };
      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res).to.have.status(400);
    });

    it('Should failed when update data using future date of birth date #TC-866', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.futureDate(),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };
      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res).to.have.status(400);
    });

    it('Should failed when update data using below 17 years old person #TC-867', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.dateUnder17YearsOld(),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger('KTP'),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using below than 16 char KTP number #TC-868', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger(15),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using more than 16 char KTP number #TC-869', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            checkingDate: '',
            checkingFile: null,
            checkingResult: '',
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: '3000-12-31',
            identificationCardNumber: help.randomInteger(17),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: true,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: help.randomInteger(2),
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using more 100% stock ownership #TC-870', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: help.futureDate(),
            identificationCardNumber: help.randomInteger(16),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: false,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: 80,
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          },
          {
            id: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: help.futureDate(),
            identificationCardNumber: help.randomInteger(16),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: false,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: 80,
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using not pdf file in PG File #TC-871', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: help.futureDate(),
            identificationCardNumber: help.randomInteger(16),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: false,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.jpg`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.jpeg`,
            shareHolderId: '',
            stockOwnership: 80,
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using future date in PG Signed date #TC-872', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            shareHolderId: '',
            apuPptCheck: {
              checkingDate: help.randomDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: help.futureDate(),
            identificationCardNumber: help.randomInteger(16),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: false,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.futureDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.pdf`,
            stockOwnership: 80,
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });

    it('Should failed when update data using future date in Apu Ppt Checking Date #TC-873', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            shareHolderId: '',
            apuPptCheck: {
              checkingDate: help.futureDate(),
              checkingFile: `${help.randomUrl()}.pdf`,
              checkingResult: {
                id: 1,
                name: 'passed'
              }
            },
            dob: help.formatDate(new Date('2002-01-01')),
            emailAddress: help.randomEmail(),
            fullName: help.randomFullName(),
            identificationCardExpiryDate: help.futureDate(),
            identificationCardNumber: help.randomInteger(16),
            identificationCardUrl: `${help.randomUrl()}.pdf`,
            isDelete: false,
            isSaved: false,
            isLss: true,
            isPgs: true,
            isTss: true,
            lifeTimeId: false,
            mobileNumber: help.randomPhoneNumber(),
            mobilePrefix: 1,
            pgAmount: help.randomInteger(3),
            pgFile: `${help.randomUrl()}.pdf`,
            pgNumber: help.randomInteger(3),
            pgSignedDate: help.randomDate(),
            pgType: 'with spouse',
            position: 1,
            selfieUrl: `${help.randomUrl()}.pdf`,
            stockOwnership: 80,
            taxCardNumber: help.randomInteger(15),
            taxCardUrl: `${help.randomUrl()}.pdf`
          }
        ]
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(400);
    });
  });
});

async function createShareholderInformation (shareholdersInfoFoUrl, customerId, accessToken) {
  const body = generateBody(customerId);
  const res = await chai
    .request(svcBaseUrl)
    .post(shareholdersInfoFoUrl)
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
    position: 1,
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
  const shareHolderDateofBirth = data[length - 1].dob;
  const shareHolderIdentificationFile = data[length - 1].identificationCardUrl;
  const shareHolderIdentificationNumber = data[length - 1].identificationCardNumber;
  const shareHolderIdentificationExp = data[length - 1].identificationCardExpiryDate;
  const shareHolderSelfieUrl = data[length - 1].selfieUrl;
  const shareHolderTaxCardUrl = data[length - 1].taxCardUrl;
  const shareHolderTaxCardNumber = data[length - 1].taxCardNumber;
  const shareHolderLss = data[length - 1].isLss;
  const shareHolderPgs = data[length - 1].isPgs;
  const shareHolderPgNo = data[length - 1].pgNumber;
  const stringShareHolderPgAmount = bodyRequest.data[0].pgAmount.toString();
  const shareHolderPgSignedDate = data[length - 1].pgSignedDate;
  const shareholderPgFile = data[length - 1].pgFile;
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
  const stringStockOwnership = bodyRequest.data[0].stockOwnership.toString();
  let shareHolderLssLegacy = dataLegacy.bfdkd_ttd_loan_agreement;
  let shareHolderPgsLegacy = dataLegacy.bfdkd_pg;
  const shareHolderPgNoLegacy = dataLegacy.bfdkd_pg_no;
  const shareHolderPgAmountLegacy = dataLegacy.bfdkd_pg_nilai;
  let shareHolderPgSignedDateLegacy = dataLegacy.bfdkd_pg_tgl;
  const shareholderPgFileLegacy = dataLegacy.bfdkd_pg_file;

  // split dd/mm/yy from time
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy.split('T');
  shareHolderDateofBirthLegacy = shareHolderDateofBirthLegacy[0];
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy.split('T');
  shareHolderIdentificationExpLegacy = shareHolderIdentificationExpLegacy[0];
  shareHolderPgSignedDateLegacy = shareHolderPgSignedDateLegacy.split('T');
  shareHolderPgSignedDateLegacy = shareHolderPgSignedDateLegacy[0];
  // turn 'Y' to true
  if (shareHolderLssLegacy === 'Y') {
    shareHolderLssLegacy = true;
  } else {
    shareHolderLssLegacy = false;
  }

  if (shareHolderPgsLegacy === 'Y') {
    shareHolderPgsLegacy = true;
  } else {
    shareHolderPgsLegacy = false;
  }

  expect(bodyRequest.data[0]).to.have.property(
    'position',
    shareHolderPosition,
    'shareholder position is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'fullName',
    shareHolderName,
    'shareholder full name is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'mobilePrefix',
    shareHolderMobilePrefix,
    'shareholder mobile prefix is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'mobileNumber',
    shareHolderMobileNumber,
    'shareholder mobile number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'emailAddress',
    shareHolderEmailAddress,
    'shareholder email address is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'dob',
    shareHolderDateofBirth,
    'shareholder date of birth is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardUrl',
    shareHolderIdentificationFile,
    'shareholder identification file is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardNumber',
    shareHolderIdentificationNumber,
    'shareholder identification number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardExpiryDate',
    shareHolderIdentificationExp,
    'shareholder identification expiry date is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'selfieUrl',
    shareHolderSelfieUrl,
    'shareholder selfie url is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'taxCardUrl',
    shareHolderTaxCardUrl,
    'shareholder tax card url is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'taxCardNumber',
    shareHolderTaxCardNumber,
    'shareholder tax card number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'isLss',
    shareHolderLss,
    'shareholder isLss is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'isPgs',
    shareHolderPgs,
    'shareholder pgs is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgNumber',
    shareHolderPgNo,
    'shareholder pgNumber is not equal to the response'
  );
  expect(stringShareHolderPgAmount).to.equal(
    shareHolderPgAmountLegacy,
    'shareholder pgAmount is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgSignedDate',
    shareHolderPgSignedDate,
    'shareholder pg signed date is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgFile',
    shareholderPgFile,
    'shareholder pg file is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'position',
    shareHolderPositionLegacy,
    'shareholder position is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'fullName',
    shareHolderNameLegacy,
    'shareholder full name is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'mobileNumber',
    shareHolderMobileNumberLegacy,
    'shareholder mobile number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'emailAddress',
    shareHolderEmailAddressLegacy,
    'shareholder email address is not equal to the response'
  );
  expect(stringStockOwnership).to.equal(
    shareHolderStockOwnershipLegacy,
    'shareholder stock ownership is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'dob',
    shareHolderDateofBirthLegacy,
    'shareholder date of birth is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardUrl',
    shareHolderIdentificationFileLegacy,
    'shareholder identification file is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardNumber',
    shareHolderIdentificationNumberLegacy,
    'shareholder identification number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'identificationCardExpiryDate',
    shareHolderIdentificationExpLegacy,
    'shareholder identification expiry date is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'selfieUrl',
    shareHolderSelfieUrlLegacy,
    'shareholder selfie url is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'taxCardUrl',
    shareHolderTaxCardUrlLegacy,
    'shareholder tax card url is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'taxCardNumber',
    shareHolderTaxCardNumberLegacy,
    'shareholder tax card number is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'isLss',
    shareHolderLssLegacy,
    'shareholder isLss is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'isPgs',
    shareHolderPgsLegacy,
    'shareholder pgs is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgNumber',
    shareHolderPgNoLegacy,
    'shareholder pgNumber is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgSignedDate',
    shareHolderPgSignedDateLegacy,
    'shareholder pg signed date is not equal to the response'
  );
  expect(bodyRequest.data[0]).to.have.property(
    'pgFile',
    shareholderPgFileLegacy,
    'shareholder pg file is not equal to the response'
  );
}

function assertDeleteLegacySuccess (getData, getDataLegacy) {
  const data = getData.body.data.advancedInfo.shareHolderInformation.field;
  expect(data).to.be.an('array').that.is.empty;
  expect(getDataLegacy).to.be.an('array').that.is.empty;
}
