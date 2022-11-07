/*
 *  Table involved
 *  Parameter:
 *  - customer_information (ci_id)
 *
 *  Result:
 *  - legal_information
 *    documentType
 *    npwp = 4 siup = 5 akta pendirian = 7 akta terbaru = 9 sk menkumhan = 8 tdp = 6 skdu = 28
 */

const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const db = require('@lib/dbFunction');
const boUser = require('@fixtures/backoffice_user');
const request = require('@lib/request');
const expect = require('chai').expect;
const chai = require('chai');

describe('Legal Information Institutional', function () {
  const loginUrl = '/validate/users/auth/login';
  const url = '/validate/customer/legal-information/borrower';
  const completingDataUrl = '/validate/customer/completing-data/borrower';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;

  before(async function () {
    report.setInfo(this, 'Attempting to login as backoffice admin');
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    report.setInfo(this, loginBoAdminRes);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
    report.setInfo(this, 'Login as backoffice admin successful');
  });

  beforeEach(async function () {
    report.setInfo(this, 'Attempting to register individual borrower');
    const registerResIndividual = await req.borrowerRegister(false, ['legal-information']);
    report.setInfo(this, registerResIndividual);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to register institutional borrower');
    const registerResInstitutional = await req.borrowerRegister(true, ['legal-information']);
    report.setInfo(this, registerResInstitutional);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(
      this,
      `Institutional borrower registered with customerId ${customerIdInstitutional}`
    );
  });

  describe('#smoke', function () {
    it('Add institutional legal information should succeed #TC-297', async function () {
      const body = generateBody(customerIdInstitutional);
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information with unique NPWP number should succeed #TC-298', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: '000000000000000'
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta.message).to.eql('Data already exist: NPWP');
    });

    it('Add institutional legal information SIUP using alphanumeric should succeed #TC-299', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 5,
              name: 'siup'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information SIUP using special characters should succeed #TC-300', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 5,
              name: 'siup'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/',
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information Akta Pendirian using alphanumeric should succeed #TC-301', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 7,
              name: 'aktaPendirian'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information Akta Pendirian using special characters should succeed #TC-302', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 7,
              name: 'aktaPendirian'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/',
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information Akta Terbaru using alphanumeric should succeed #TC-303', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 9,
              name: 'aktaTerbaru'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information Akta Terbaru using special characters should succeed #TC-304', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 9,
              name: 'aktaTerbaru'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/',
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information SK Menkumham using alphanumeric should succeed #TC-305', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 8,
              name: 'skMenkumham'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information SK Menkumham using special characters should succeed #TC-306', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 8,
              name: 'skMenkumham'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/',
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information TDP using alphanumeric should succeed #TC-307', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 6,
              name: 'tdp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information TDP using special characters should succeed #TC-308', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 6,
              name: 'tdp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/',
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information SKDU using alphanumeric should succeed #TC-309', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information SKDU using special characters should succeed #TC-310', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/'
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information should save the data successfully #TC-311', async function () {
      const body = generateBody(customerIdInstitutional);

      const addStartTime = await help.startTime();
      const addRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const addResponseTime = await help.responseTime(addStartTime);
      report.setPayload(this, addRes, addResponseTime);

      const cdStartTime = await help.startTime();
      const completingDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );

      const cdResponseTime = await help.responseTime(cdStartTime);
      const legalInformationData = completingDataRes.body.data.advancedInfo.legalInformation.field;
      report.setPayload(this, completingDataRes, cdResponseTime);
      assertNewCoreDataShouldExist(legalInformationData);
    });

    it('Add institutional legal information should sync data between new core and legacy #TC-312', async function () {
      const registerRes = await req.borrowerRegister(true, ['legal-information']);
      report.setInfo(this, registerRes);

      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const body = generateBody(customerId);

      const startTime = await help.startTime();

      const loginRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, loginRes, responseTime);
      const cdStartTime = await help.startTime();
      const getDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const cdResponseTime = await help.responseTime(cdStartTime);
      report.setPayload(this, getDataRes, cdResponseTime);
      const legalInformationData = getDataRes.body.data.advancedInfo.legalInformation.field;
      assertNewCoreDataShouldExist(legalInformationData);

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const bpdData = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerId
        })
        .then((res) => {
          return JSON.parse(res.text);
        });

      assertLegacyDataShouldExist(bpdData);
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add institutional legal information using customerId of different user #TC-313', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add institutional legal information NPWP should be numeric only #TC-314', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric(15).toUpperCase()
          }
        ]
      };

      const startTime = await help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add institutional legal information NPWP below 15 digits should fail #TC-315', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomInteger(10)
          }
        ]
      };

      const startTime = await help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add institutional legal information NPWP above 15 digits should fail #TC-316', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomInteger(20)
          }
        ]
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add institutional legal information SKDU using expiry date should fail #TC-317', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomInteger(20),
            documentExpiredDate: help.futureDate()
          }
        ]
      };

      const startTime = await help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add legal information if institutional borrower status is active #TC-318', async function () {
      const registerRes = await req.borrowerRegister(true, ['legal-information']);
      report.setInfo(this, registerRes);

      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(request.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add legal information if institutional borrower status is pending verification #TC-319', async function () {
      const registerRes = await req.borrowerRegister();
      report.setInfo(this, registerRes);

      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(request.getSvcUrl())
        .put(rvdUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});

      const body = generateBody(customerId);
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add legal information if institutional borrower status is inactive #TC-320', async function () {
      const registerRes = await req.borrowerRegister(true, ['legal-information']);
      report.setInfo(this, registerRes);

      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(request.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add institutional legal information should not save data if failed to sync with legacy #TC-321', async function () {
      const registerRes = await req.borrowerRegister(true, ['legal-information']);
      report.setInfo(this, registerRes);

      const customerId = registerRes.customerId;
      const userName = registerRes.userName;

      await db.changeEmailByUsername(userName);
      const loginBody = {
        username: userName,
        password: help.getDefaultPassword(),
        flag: 1
      };
      const loginRes = await chai
        .request(request.getSvcUrl())
        .post(loginUrl)
        .set(request.createNewCoreHeaders())
        .send(loginBody);

      const accessToken = loginRes.body.data.accessToken;
      const body = generateBody(customerId);
      const addStartTime = await help.startTime();
      const addRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const addResponseTime = await help.responseTime(addStartTime);

      report.setPayload(this, addRes, addResponseTime);

      const cdStartTime = await help.startTime();
      const completingDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const cdResponseTime = await help.responseTime(cdStartTime);

      const legalInformationData = completingDataRes.body.data.advancedInfo.legalInformation.field;
      assertNewCoreDataShouldNotExist(legalInformationData);

      report.setPayload(this, completingDataRes, cdResponseTime);
      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const bpdData = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerId
        })
        .then((res) => {
          return JSON.parse(res.text);
        });
      assertLegacyDataShouldNotExist(bpdData);
    });
  });
});

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    data: [
      {
        documentType: {
          id: 4,
          name: 'npwp'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomInteger('NPWP')
      },
      {
        documentType: {
          id: 5,
          name: 'siup'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase(),
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 7,
          name: 'aktaPendirian'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase(),
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 9,
          name: 'aktaTerbaru'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase(),
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 8,
          name: 'skMenkumham'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase(),
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 6,
          name: 'tdp'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase(),
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 28,
          name: 'skdu'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase()
      }
    ]
  };

  return body;
}

function assertNewCoreDataShouldExist (legalInfoField) {
  expect(legalInfoField.npwp.documentFile, 'New Core: Legal information NPWP document file is null')
    .to.be.not.null;
  expect(
    legalInfoField.npwp.documentNumber,
    'New Core: Legal information NPWP document number is null'
  ).to.be.not.null;
  expect(legalInfoField.siup.documentFile, 'New Core: Legal information SIUP document file is null')
    .to.be.not.null;
  expect(legalInfoField.siup.documentNumber, 'Legal information SIUP document number is null').to.be
    .not.null;
  expect(
    legalInfoField.aktaPendirian.documentFile,
    'Legal information Akta Pendirian document file is null'
  ).to.be.not.null;
  expect(
    legalInfoField.aktaPendirian.documentNumber,
    'Legal information Akta Pendirian document number is null'
  ).to.be.not.null;
  expect(
    legalInfoField.aktaTerbaru.documentFile,
    'Legal information Akta Terbaru document file is null'
  ).to.be.not.null;
  expect(
    legalInfoField.aktaTerbaru.documentNumber,
    'Legal information Akta Terbaru document number is null'
  ).to.be.not.null;
  expect(
    legalInfoField.skMenkumham.documentFile,
    'Legal information SK Menkumham document file is null'
  ).to.be.not.null;
  expect(
    legalInfoField.skMenkumham.documentNumber,
    'Legal information SK Menkumham document number is null'
  ).to.be.not.null;
  expect(legalInfoField.tdp.documentFile, 'Legal information TDP document file is null').to.be.not
    .null;
  expect(legalInfoField.tdp.documentNumber, 'Legal information TDP document number is null').to.be
    .not.null;
  expect(legalInfoField.skdu.documentFile, 'Legal information SKDU document file is null').to.be.not
    .null;
  expect(legalInfoField.skdu.documentNumber, 'Legal information SKDU document number is null').to.be
    .not.null;
}

function assertNewCoreDataShouldNotExist (legalInfoField) {
  expect(legalInfoField.npwp.documentFile, 'Legal information NPWP document file is not null').to.be
    .null;
  expect(legalInfoField.npwp.documentNumber, 'Legal information NPWP document number is not null')
    .to.be.null;
  expect(legalInfoField.siup.documentFile, 'Legal information SIUP document file is not null').to.be
    .null;
  expect(legalInfoField.siup.documentNumber, 'Legal information SIUP document number is not null')
    .to.be.null;
  expect(
    legalInfoField.aktaPendirian.documentFile,
    'Legal information Akta Pendirian document file is not null'
  ).to.be.null;
  expect(
    legalInfoField.aktaPendirian.documentNumber,
    'Legal information Akta Pendirian document number is not null'
  ).to.be.null;
  expect(
    legalInfoField.aktaTerbaru.documentFile,
    'Legal information Akta Terbaru document file is not null'
  ).to.be.null;
  expect(
    legalInfoField.aktaTerbaru.documentNumber,
    'Legal information Akta Terbaru document number is not null'
  ).to.be.null;
  expect(
    legalInfoField.skMenkumham.documentFile,
    'Legal information SK Menkumham document file is not null'
  ).to.be.null;
  expect(
    legalInfoField.skMenkumham.documentNumber,
    'Legal information SK Menkumham document number is not null'
  ).to.be.null;
  expect(legalInfoField.tdp.documentFile, 'Legal information TDP document file is not null').to.be
    .null;
  expect(legalInfoField.tdp.documentNumber, 'Legal information TDP document number is not null').to
    .be.null;
  expect(legalInfoField.skdu.documentFile, 'Legal information SKDU document file is not null').to.be
    .null;
  expect(legalInfoField.skdu.documentNumber, 'Legal information SKDU document number is not null')
    .to.be.null;
}

function assertLegacyDataShouldExist (bpdData) {
  expect(bpdData[0].bpd_cdoc_npwp_file, 'Legacy: Legal information NPWP document file is null').to
    .be.not.null;
  expect(bpdData[0].bpd_cdoc_npwp, 'Legacy: Legal information NPWP document number is null').to.be
    .not.null;
  expect(bpdData[0].bpd_npwp_no, 'Legacy: Legal information NPWP document number is null').to.be.not
    .null;
  expect(bpdData[0].bpd_cdoc_siup_file, 'Legacy: Legal information SIUP file is null').to.be.not
    .null;
  expect(bpdData[0].bpd_cdoc_siup_no, 'Legacy: Legal information SIUP number is null').to.be.not
    .null;
  expect(
    bpdData[0].bpd_cdoc_siup_expired_date,
    'Legacy: Legal information SIUP expired date is null'
  ).to.be.not.null;
  expect(
    bpdData[0].bpd_cdoc_akta_pendirian_file,
    'Legacy: Legal information Akta Pendirian file is null'
  ).to.be.not.null;
  expect(
    bpdData[0].bpd_cdoc_akta_pendirian_no,
    'Legacy: Legal information Akta Pendirian number is null'
  ).to.be.not.null;
  expect(
    bpdData[0].bpd_cdoc_akta_perubahan_no,
    'Legacy: Legal information Akta Perubahan number is null'
  ).to.be.not.null;
  expect(bpdData[0].bpd_cdoc_sk_menhumkam, 'Legacy: Legal information SK Menkumham is null').to.be
    .not.null;
  expect(bpdData[0].bpd_cdoc_tdp_file, 'Legacy: Legal information TDP file is null').to.be.not.null;
  expect(bpdData[0].bpd_cdoc_tdp_no, 'Legacy: Legal information TDP number is null').to.be.not.null;
  expect(bpdData[0].bpd_cdoc_tdp_expired_date, 'Legacy: Legal information TDP expired date is null')
    .to.be.not.null;
  expect(bpdData[0].bpd_cdoc_skdp_file, 'Legacy: Legal information SKDU file is null').to.be.not
    .null;
  expect(bpdData[0].bpd_cdoc_skdp, 'Legacy: Legal information SKDU number is null').to.be.not.null;
}

function assertLegacyDataShouldNotExist (bpdData) {
  expect(bpdData[0].bpd_cdoc_npwp_file, 'Legacy: Legal information NPWP document file is not null')
    .to.be.null;
  expect(bpdData[0].bpd_cdoc_npwp, 'Legacy: Legal information NPWP document number is not null').to
    .be.null;
  expect(bpdData[0].bpd_npwp_no, 'Legacy: Legal information NPWP document number is not null').to.be
    .null;
  expect(bpdData[0].bpd_cdoc_siup_file, 'Legacy: Legal information SIUP file is not null').to.be
    .null;
  expect(bpdData[0].bpd_cdoc_siup_no, 'Legacy: Legal information SIUP number is not null').to.be
    .null;
  expect(
    bpdData[0].bpd_cdoc_siup_expired_date,
    'Legacy: Legal information SIUP expired date is not null'
  ).to.be.null;
  expect(
    bpdData[0].bpd_cdoc_akta_pendirian_file,
    'Legacy: Legal information Akta Pendirian file is not null'
  ).to.be.null;
  expect(
    bpdData[0].bpd_cdoc_akta_pendirian_no,
    'Legacy: Legal information Akta Pendirian number is not null'
  ).to.be.null;
  expect(
    bpdData[0].bpd_cdoc_akta_perubahan_no,
    'Legacy: Legal information Akta Perubahan number is not null'
  ).to.be.null;
  expect(bpdData[0].bpd_cdoc_sk_menhumkam, 'Legacy: Legal information SK Menkumham is not null').to
    .be.null;
  expect(bpdData[0].bpd_cdoc_tdp_file, 'Legacy: Legal information TDP file is not null').to.be.null;
  expect(bpdData[0].bpd_cdoc_tdp_no, 'Legacy: Legal information TDP number is not null').to.be.null;
  expect(
    bpdData[0].bpd_cdoc_tdp_expired_date,
    'Legacy: Legal information TDP expired date is not null'
  ).to.be.null;
  expect(bpdData[0].bpd_cdoc_skdp_file, 'Legacy: Legal information SKDU file is not null').to.be
    .null;
  expect(bpdData[0].bpd_cdoc_skdp, 'Legacy: Legal information SKDU number is not null').to.be.null;
}
