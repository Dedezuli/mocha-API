const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');

describe('Bank Information Delete', function () {
  const urlPut = '/validate/customer/bank-information/save-all';
  const url = '/validate/customer/bank-information/borrower';
  const rvdUrl = '/validate/customer/request-verification-data';
  const urlLogin = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;
  let emailIndividual;
  let usernameIndividual;

  before(async function () {
    report.setInfo(this, 'Attempting to login as backoffice admin');
    const loginBoAdminRes = await request.backofficeLogin(
      boUser.admin.username,
      boUser.admin.password
    );

    expect(loginBoAdminRes.data).to.have.property('accessToken');
    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
    report.setInfo(
      this,
      `Login as backoffice admin successful with access token : ${accessTokenBoAdmin}`
    );
  });

  beforeEach(async function () {
    report.setInfo(this, 'Attempting to do frontoffice register');
    const registerResIndividual = await request.borrowerRegister(false, ['bank-information']);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    emailIndividual = registerResIndividual.emailAddress;
    usernameIndividual = registerResIndividual.userName;
    report.setInfo(this, `Registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to do frontoffice register');
    const registerResInstitutional = await request.borrowerRegister(true, ['bank-information']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(this, `Registered with customerId ${customerIdInstitutional}`);
  });

  describe('#smoke', function () {
    it('Delete bank information should succeed #TC-28', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to delete data in db new core when delete bank information #TC-29', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to delete data in db legacy when delete bank information #TC-30', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Should fail when delete bank information owned by other user #TC-31', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail when delete bank information if borrower status is active #TC-32', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );
      report.setInfo(this, bankIds);

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(request.getSvcUrl())
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when delete bank information if borrower status is inactive #TC-33', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );
      report.setInfo(this, bankIds);

      const body = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      await chai
        .request(request.getSvcUrl())
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when delete bank information if borrower status is pending verification #TC-34', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );
      report.setInfo(this, bankIds);

      await chai
        .request(request.getSvcUrl())
        .put(rvdUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send({});

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail to delete in db new core when delete bank information owned by other user #TC-35', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should failed to delete bank information in db legacy when failed to sync data #TC-36', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );
      const urlChangeEmail = '/validate/users/qa/change-email';
      const bodyChangeEmail = {
        newEmailAddress: `testqa${help.randomAlphaNumeric()}@investree.investree`,
        oldEmailAddress: emailIndividual
      };
      await chai
        .request(request.getSvcUrl())
        .put(urlChangeEmail)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(bodyChangeEmail);

      const bodyLogin = {
        flag: 1,
        username: usernameIndividual,
        password: help.getDefaultPassword()
      };

      const resLogin = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(bodyLogin);
      accessTokenIndividual = resLogin.body.data.accessToken;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to delete bank information in db new core when failed to sync data #TC-37', async function () {
      const bankIds = await createBankInformation(
        urlPut,
        customerIdIndividual,
        accessTokenIndividual
      );

      const urlChangeEmail = '/validate/users/qa/change-email';
      const bodyChangeEmail = {
        newEmailAddress: `testqa${help.randomAlphaNumeric()}@investree.investree`,
        oldEmailAddress: emailIndividual
      };
      await chai
        .request(request.getSvcUrl())
        .put(urlChangeEmail)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(bodyChangeEmail);

      const bodyLogin = {
        flag: 1,
        username: usernameIndividual,
        password: help.getDefaultPassword()
      };
      const resLogin = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(bodyLogin);
      accessTokenIndividual = resLogin.body.data.accessToken;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .del(`${url}/${bankIds[0]}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});

async function createBankInformation (urlPut, customerId, accessToken) {
  const bankIds = [];
  const bodyAdd = [
    {
      customerId: customerId,
      bankType: 2,
      bankAccountCoverFile: help.randomUrl(),
      masterBankId: 1,
      bankAccountNumber: help.randomInteger(10),
      bankAccountHolderName: help.randomFullName(),
      useAsDisbursement: false
    },
    {
      customerId: customerId,
      bankType: 2,
      bankAccountCoverFile: help.randomUrl(),
      masterBankId: 1,
      bankAccountNumber: help.randomInteger(10),
      bankAccountHolderName: help.randomFullName(),
      useAsDisbursement: true
    }
  ];

  const resAdd = await chai
    .request(request.getSvcUrl())
    .put(urlPut)
    .set(
      request.createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(bodyAdd);

  const data = resAdd.body.data;

  data.forEach((item) => {
    bankIds.push(item.bankInformationId);
  });
  return bankIds;
}
