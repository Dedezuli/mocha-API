/*
 *  Table involved
 *  Parameter:
 *  - customer_information (ci_id)
 *
 *  Result:
 *  - customer_information
 *
 */

const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = require('chai').expect;
const dbFun = require('@lib/dbFunction');
const vars = require('@fixtures/vars');

const svcBaseUrl = request.getSvcUrl();
const apiSyncBaseUrl = request.getApiSyncUrl();
const headerNewcore = request.createNewCoreHeaders();

describe('Product Preference Update', function () {
  const url = '/validate/customer/customer-information/product-preference/borrower';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const urlLogin = '/validate/users/auth/login';
  let accessTokenIndividual;
  let accessTokenInstitutional;
  let customerIdIndividual;
  let customerIdInstitutional;
  let accessTokenRejectedIndividual;
  let accessTokenRejectedInstitutional;
  let customerIdRejectedIndividual;
  let customerIdRejectedInstitutional;

  before(async function () {
    report.setInfo(this, 'Attempting to do frontoffice register');
    const registerResIndividual = await request.borrowerRegister();
    report.setPayload(this, registerResIndividual);

    expect(registerResIndividual).to.have.property('customerId');
    expect(registerResIndividual).to.have.property('accessToken');
    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    report.setInfo(this, `Registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to do frontoffice register');
    const registerResInstitutional = await request.borrowerRegister(true);
    report.setPayload(this, registerResInstitutional);

    expect(registerResInstitutional).to.have.property('customerId');
    expect(registerResInstitutional).to.have.property('accessToken');
    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(this, `Registered with customerId ${customerIdInstitutional}`);
  });

  describe('#smoke', function () {
    // userType context for this endpoint 1 = lender, 2 = borrower
    it('Update product preference individual conventional should succeed #TC-254', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update product preference individual sharia should succeed #TC-255', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update product preference individual mix should succeed #TC-256', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update product preference institutional conventional should succeed #TC-257', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update product preference institutional sharia should succeed #TC-258', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update product preference institutional mix should succeed #TC-259', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should succeed to save in db when update product preference individual to conventional #TC-260', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db when update product preference individual to sharia #TC-261', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db when update product preference individual to mix #TC-262', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db when update product preference institutional to conventional #TC-263', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db when update product preference institutional to sharia #TC-264', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db new core when update product preference institutional to mix #TC-265', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      await assertSavedDataInNewCore(getData, body);
    });

    it('Should succeed to save in db legacy when success to update product preference individual to conventional #TC-266', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedDataInLegacy(body, getData.body);
    });

    it('Should succeed to save in db legacy when success to update product preference individual to sharia #TC-267', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedDataInLegacy(body, getData.body);
    });

    it('Should succeed to save in db legacy when success to update product preference individual to mix #TC-268', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdIndividual
        });
      await assertSavedDataInLegacy(body, getData.body);
    });

    it('Should succeed to save in db legacy when success to update product preference institutional to conventional #TC-269', async function () {
      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedDataInLegacy(body, getData.body);
    });

    it('Should succeed to save in db legacy when success to update product preference institutional to sharia #TC-270', async function () {
      const body = {
        productPreference: 2
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedDataInLegacy(body, getData.body);
    });

    it('Should succeed to save in db legacy when success to update product preference institutional to mix #TC-271', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdInstitutional
        });
      await assertSavedDataInLegacy(body, getData.body);
    });
  });

  describe('#negative', function () {
    it('Should fail when update product preference using customerId of different user #TC-272', async function () {
      const body = {
        productPreference: 3
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail update product preference when fill other than product preference field #TC-273', async function () {
      const body = {
        userCategory: '2'
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail update product preference without product preference field #TC-274', async function () {
      const body = {};

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail update product preference with product preference field empty string #TC-275', async function () {
      const body = {
        productPreference: ''
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail update product preference with product preference null #TC-276', async function () {
      const body = {
        productPreference: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail to save in db when update product preference with product preference null using institutional borrower #TC-277', async function () {
      const body = {
        productPreference: null
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenInstitutional
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Should fail to save in db when update product preference of selected individual borrower #TC-278', async function () {
      report.setInfo(this, 'Attempting to do frontoffice register');
      const registerResRejectedIndividual = await request.borrowerRegister(false);
      customerIdRejectedIndividual = registerResRejectedIndividual.customerId;
      accessTokenRejectedIndividual = registerResRejectedIndividual.accessToken;
      report.setInfo(this, `Registered with customerId ${customerIdRejectedIndividual}`);
      const username = registerResRejectedIndividual.userName;

      // change email
      await dbFun.changeEmailByUsername(username);

      // re-login
      const bodyLogin = { flag: 1, username: username, password: vars.default_password };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(headerNewcore)
        .send(bodyLogin);
      customerIdRejectedIndividual = resLogin.body.data.customerId;
      accessTokenRejectedIndividual = resLogin.body.data.accessToken;

      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdRejectedIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedIndividual
          })
        );

      await assertNotSavedInNewCore(getData, body);
    });

    it('Should fail to save in db when update product preference of selected institutional borrower #TC-279', async function () {
      report.setInfo(this, 'Attempting to do frontoffice register');
      const registerResRejectedInstitutional = await request.borrowerRegister(true);
      expect(registerResRejectedInstitutional).to.have.property('customerId');
      expect(registerResRejectedInstitutional).to.have.property('accessToken');
      customerIdRejectedInstitutional = registerResRejectedInstitutional.customerId;
      accessTokenRejectedInstitutional = registerResRejectedInstitutional.accessToken;
      report.setInfo(this, `Registered with customerId ${customerIdRejectedInstitutional}`);

      const username = registerResRejectedInstitutional.userName;

      // change email
      await dbFun.changeEmailByUsername(username);

      // re-login
      const bodyLogin = { flag: 1, username: username, password: vars.default_password };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(headerNewcore)
        .send(bodyLogin);
      customerIdRejectedInstitutional = resLogin.body.data.customerId;
      accessTokenRejectedInstitutional = resLogin.body.data.accessToken;

      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdRejectedInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedInstitutional
          })
        );
      await assertNotSavedInNewCore(getData, body);
    });

    it('Data in DB legacy should different with request when fail to save in db when update product preference of selected individual borrower #TC-280', async function () {
      report.setInfo(this, 'Attempting to do frontoffice register');
      const registerResRejectedIndividual = await request.borrowerRegister(false);
      report.setPayload(this, registerResRejectedIndividual);

      customerIdRejectedIndividual = registerResRejectedIndividual.customerId;
      accessTokenRejectedIndividual = registerResRejectedIndividual.accessToken;
      report.setInfo(this, `Registered with customerId ${customerIdRejectedIndividual}`);
      const username = registerResRejectedIndividual.userName;

      // change email
      await dbFun.changeEmailByUsername(username);

      // re-login
      const bodyLogin = { flag: 1, username: username, password: vars.default_password };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(headerNewcore)
        .send(bodyLogin);
      customerIdRejectedIndividual = resLogin.body.data.customerId;
      accessTokenRejectedIndividual = resLogin.body.data.accessToken;

      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdRejectedIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdRejectedIndividual
        });
      await assertNotSavedInLegacy(getData.body, body);
    });

    it('Data in DB legacy should different with request when fail to save in db when update product preference of selected institutional borrower #TC-281', async function () {
      report.setInfo(this, 'Attempting to do frontoffice register');
      const registerResRejectedInstitutional = await request.borrowerRegister(true);
      report.setPayload(this, registerResRejectedInstitutional);

      expect(registerResRejectedInstitutional).to.have.property('customerId');
      expect(registerResRejectedInstitutional).to.have.property('accessToken');
      customerIdRejectedInstitutional = registerResRejectedInstitutional.customerId;
      accessTokenRejectedInstitutional = registerResRejectedInstitutional.accessToken;
      report.setInfo(this, `Registered with customerId ${customerIdRejectedInstitutional}`);

      const username = registerResRejectedInstitutional.userName;

      // change email
      await dbFun.changeEmailByUsername(username);

      // re-login
      const bodyLogin = { flag: 1, username: username, password: vars.default_password };
      const resLogin = await chai
        .request(svcBaseUrl)
        .post(urlLogin)
        .set(headerNewcore)
        .send(bodyLogin);
      customerIdRejectedInstitutional = resLogin.body.data.customerId;
      accessTokenRejectedInstitutional = resLogin.body.data.accessToken;

      const body = {
        productPreference: 1
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerIdRejectedInstitutional}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenRejectedInstitutional
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerIdRejectedInstitutional
        });
      await assertNotSavedInLegacy(getData.body, body);
    });
  });
});

function assertSavedDataInNewCore (getData, bodyRequest) {
  const productPreferenceNewcore = getData.body.data.advancedInfo.productPreference.field.productPreferenceId;
  expect(bodyRequest).to.have.property('productPreference', productPreferenceNewcore, "Product preference of request isn't equal to product preference of response");
}

function assertNotSavedInNewCore (getData, bodyRequest) {
  const productPreferenceNewcore = getData.body.data.advancedInfo.productPreference.field.productPreferenceId;
  expect(bodyRequest.productPreference).not.equal(productPreferenceNewcore, 'product preference of request is equal to product preference of response');
}

function assertSavedDataInLegacy (bodyRequest, getData) {
  const productPreferenceLegacy = getData[0].bpd_loan_type;
  let productPreferenceReq = `${bodyRequest.productPreference}`;
  if (productPreferenceReq === '3') {
    productPreferenceReq = '1,2';
  }
  expect(productPreferenceReq).equal(productPreferenceLegacy, "Product preference of request isn't equal to product preference of response");
}

function assertNotSavedInLegacy (getData, bodyRequest) {
  const productPreferenceLegacy = getData[0].bpd_loan_type;
  let productPreferenceReq = `${bodyRequest.productPreference}`;
  if (productPreferenceReq === '3') {
    productPreferenceReq = '1,2';
  }
  expect(productPreferenceReq).not.equal(productPreferenceLegacy, 'Product preference of request is equal to product preference of response');
}
