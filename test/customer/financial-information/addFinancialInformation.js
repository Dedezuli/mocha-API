const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

describe('Financial Information Add', function () {
  const url = '/validate/customer/financial-information/borrower';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const loginUrl = '/validate/users/auth/login';
  const MAXIMUM_FILE_YEAR_DATE = 5;

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;
  let usernameIndividual;
  let usernameInstitutional;

  before(async function () {
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
  });

  beforeEach(async function () {
    const registerResIndividual = await req.borrowerRegister(false, [
      'e-statement',
      'financial-statement'
    ]);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    usernameIndividual = registerResIndividual.userName;

    const registerResInstitutional = await req.borrowerRegister(true, [
      'e-statement',
      'financial-statement'
    ]);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    usernameInstitutional = registerResInstitutional.userName;
  });

  describe('#smoke', function () {
    it('Add financial information individual e-statement should succeed #TC-653', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

    it('Add financial information institutional e-statement should succeed #TC-654', async function () {
      const body = {
        customerId: customerIdInstitutional,
        statementFileType: 30,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(200);
    });

    it('Should succeed to save in db new core when add financial information individual e-statement #TC-655', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: 30,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

    it('Should succeed to save in db legacy when add financial information institutional e-statement #TC-656', async function () {
      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertDataInLegacy(getData.body, body);
    });

    it('Add financial information institutional financial statement should succeed #TC-657', async function () {
      const body = {
        customerId: customerIdInstitutional,
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(200);
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add financial information using customerId of different user #TC-658', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(200);
    });

    it('Should fail when add financial information file type other than e-statement 30 and financial statement 10 #TC-659', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '1',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res.body.meta.message).to.eql(
        'Data not valid. Please check following field: Statement File Type'
      );
    });

    it('Add financial information statement date should not be future date #TC-660', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: 30,
        statementUrl: help.randomUrl(),
        statementFileDate: help.futureDate()
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than today');
    });

    it('Add financial information user should can not fill statement date without statement file type #TC-661', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(400);
    });

    it('Add financial information user should can not fill statement date without statement file url #TC-662', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(400);
    });

    it('Should fail when add financial information with statement file type empty string #TC-663', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res.body.meta.message).to.eql('Statement FileType cannot be blank');
    });

    it('Should fail when add financial information with statement file type null #TC-664', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: null,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res.body.meta.message).to.eql('Statement FileType cannot be blank');
    });

    it('Should fail when add financial information with statement file url empty string #TC-665', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: '',
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(400);
    });

    it('Should fail when add financial information with statement file url null #TC-666', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: null,
        statementFileDate: help.backDateByYear(MAXIMUM_FILE_YEAR_DATE)
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

      expect(res).to.have.status(400);
    });

    it('Add financial information individual e-statement 6 years before this year should fail #TC-667', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information individual financial statement 6 years before this year should fail #TC-668', async function () {
      const body = {
        customerId: customerIdIndividual,
        statementFileType: '10',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional e-statement 6 years before this year should fail #TC-669', async function () {
      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional financial statement 6 years before this year should fail #TC-670', async function () {
      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '10',
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(6)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information individual financial statement 5 years 1 month before this year should fail #TC-671', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = {
        customerId: customerIdIndividual,
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileDate: help.formatDate(date)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information individual e-statement 5 years 1 month before this year should fail #TC-672', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = {
        customerId: customerIdIndividual,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.formatDate(date)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional financial statement 5 years 1 month before this year should fail #TC-673', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '10',
        statementUrl: help.randomUrl(),
        statementFileDate: help.formatDate(date)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Add financial information institutional e-statement 5 years 1 month before this year should fail #TC-674', async function () {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      date.setMonth(date.getMonth() - 1);

      const body = {
        customerId: customerIdInstitutional,
        statementFileType: '30',
        statementUrl: help.randomUrl(),
        statementFileDate: help.formatDate(date)
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

      expect(res.body.meta.message).to.eql('Statement Date cannot more than 5 years');
    });

    it('Should fail when add financial information if borrower status is active #TC-675', async function () {
      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdIndividual);

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

      expect(res).to.have.status(400);
    });

    it('Should fail when add financial information if borrower status is pending verification #TC-676', async function () {
      const rvdUrl = '/validate/customer/request-verification-data';
      await chai
        .request(svcBaseUrl)
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send({});

      const body = generateBody(customerIdIndividual);

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

      expect(res).to.have.status(400);
    });

    it('Should fail when add financial information if borrower status is inactive #TC-677', async function () {
      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(svcBaseUrl)
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);

      const body = generateBody(customerIdIndividual);

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

      expect(res).to.have.status(400);
    });

    it('Should failed to save in db legacy when failed to sync add financial information individual user #TC-678', async function () {
      await dbFun.changeEmailByUsername(usernameIndividual);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameIndividual,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);

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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('should fail to save in db legacy when failed to sync add information financial statement individual user #TC-679', async function () {
      await dbFun.changeEmailByUsername(usernameIndividual);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameIndividual,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);
      body.statementFileType = 10;

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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('Should failed to save in DB legacy when failed to sync add financial information institutional user #TC-680', async function () {
      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdInstitutional);

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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('should fail to save in db legacy when failed to sync add information financial statement institutional user #TC-681', async function () {
      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdInstitutional);
      body.statementFileType = 10;

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

      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('Should failed to save in DB newcore when failed to sync add financial information individual user #TC-682', async function () {
      await dbFun.changeEmailByUsername(usernameIndividual);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameIndividual,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);

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

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('should fail to save in db newcore when failed to sync add information financial statement individual user #TC-683', async function () {
      await dbFun.changeEmailByUsername(usernameIndividual);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameIndividual,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);
      body.statementFileType = 10;

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

    it('Should failed to save in DB newcore when failed to sync add financial information institutional user #TC-684', async function () {
      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdInstitutional);

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

      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('should fail to save in db newcore when failed to sync add information financial statement institutional user #TC-685', async function () {
      await dbFun.changeEmailByUsername(usernameInstitutional);

      const loginRes = await chai
        .request(svcBaseUrl)
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          flag: 1,
          username: usernameInstitutional,
          password: help.getDefaultPassword()
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = generateBody(customerIdIndividual);
      body.statementFileType = 10;

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

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    statementFileType: 30,
    statementUrl: help.randomUrl(),
    statementFileDate: help.backDateByYear(5)
  };

  return body;
}

function assertSavedDataInNewCore (getData, bodyRequest) {
  let statementData;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementData = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  } else {
    statementData = getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  }
  const arrayData = statementData.length - 1;
  const statementFileType = statementData[arrayData].statementFileType;
  const statementUrl = statementData[arrayData].statementUrl;
  const statementFileAt = statementData[arrayData].statementFileAt;
  expect(bodyRequest).to.have.property(
    'statementFileType',
    statementFileType,
    `statement file type should be ${statementFileType}`
  );
  expect(bodyRequest).to.have.property(
    'statementUrl',
    statementUrl,
    `statement url should be ${statementUrl}`
  );
  expect(bodyRequest).to.have.property(
    'statementFileDate',
    statementFileAt,
    `statement file date should be ${statementFileAt}`
  );
}

function assertNotSavedInNewCore (getData, bodyRequest) {
  let statementData;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementData = getData.body.data.advancedInfo.financialInformation.field.eStatements;
  } else {
    statementData = getData.body.data.advancedInfo.financialInformation.field.financialStatements;
  }
  expect(statementData, 'data of financial information should be empty').to.be.empty;
}

function assertDataInLegacy (getData, bodyRequest) {
  const statementData = getData[0];
  let statementUrl;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementUrl = statementData.bpd_cdoc_rekening_koran;
  } else {
    statementUrl = statementData.bpd_cdoc_laporan_keuangan;
  }
  expect(bodyRequest).to.have.property(
    'statementUrl',
    statementUrl,
    `statement url should be ${statementUrl}`
  );
}

function assertNotSavedInLegacy (getData, bodyRequest) {
  const statementData = getData[0];
  let statementUrl;
  if (`${bodyRequest.statementFileType}` === '30') {
    statementUrl = statementData.bpd_cdoc_rekening_koran;
  } else {
    statementUrl = statementData.bpd_cdoc_laporan_keuangan;
  }
  expect(bodyRequest.statementUrl).not.equal(
    statementUrl,
    `statement url should be ${statementUrl}`
  );
}
