const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;
const boUser = require('@fixtures/backoffice_user');

describe('Bank Information Save All', function () {
  const url = '/validate/customer/bank-information/save-all';
  const urlChangeEmail = '/validate/users/qa/change-email';
  const urlLogin = '/validate/users/auth/login';

  let accessTokenIndividual;
  let accessTokenOtherUser;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdOtherUser;
  let usernameIndividual;
  let emailIndividual;

  before(async function () {
    report.setInfo(this, 'Attempting to login as backoffice admin');
    const loginBoAdminRes = await request.backofficeLogin(
      boUser.admin.username,
      boUser.admin.password
    );

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
    report.setInfo(
      this,
      `Login as backoffice admin successful with access token : ${accessTokenBoAdmin}`
    );
  });

  beforeEach(async function () {
    report.setInfo(this, 'Attempting to register individual borrower');
    const registerResIndividual = await request.borrowerRegister(true, ['bank-information']);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    usernameIndividual = registerResIndividual.userName;
    emailIndividual = registerResIndividual.emailAddress;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to register individual borrower');
    const otherUserRes = await request.borrowerRegister();

    customerIdOtherUser = otherUserRes.customerId;
    accessTokenOtherUser = otherUserRes.accessToken;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdOtherUser}`);
  });

  describe('#smoke', function () {
    it('Add bank information should succeed #TC-41', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to save in db new core when succeed to add bank information #TC-42', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to save in db legacy when succeed to add bank information #TC-43', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Update bank information should succeed #TC-44', async function () {
      const bankIds = await createBankInformation(url, customerIdIndividual, accessTokenIndividual);
      report.setInfo(this, bankIds);

      const body = generateBody(customerIdIndividual, bankIds[0]);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add bank information using customerId of different user #TC-45', async function () {
      const body = generateBody(customerIdOtherUser);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should fail when update bank information using bankInformationId owned by different user #TC-46', async function () {
      const bankIds = await createBankInformation(url, customerIdIndividual, accessTokenIndividual);
      report.setInfo(this, bankIds);

      const body = generateBody(customerIdOtherUser, bankIds[0]);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenOtherUser
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail when update add bank information with all using useAsDisbursement true #TC-48', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankInformationId: '',
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        },
        {
          customerId: customerIdIndividual,
          bankInformationId: '',
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without customerId #TC-49', async function () {
      const body = [
        {
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without bank account cover file #TC-50', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankType: 2,
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account cover file empty string #TC-51', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountCoverFile = '';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account cover file null #TC-52', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountCoverFile = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without master bank id #TC-53', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with master bank id empty string #TC-54', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].masterBankId = '';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with master bank id null #TC-55', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].masterBankId = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without bank account number #TC-56', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountHolderName: help.randomFullName(),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account number empty string #TC-57', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountNumber = '';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account number null #TC-58', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountNumber = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without bank account holder name #TC-59', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          useAsDisbursement: true
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account holder name empty string #TC-60', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountHolderName = '';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information with bank account holder name null #TC-61', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].bankAccountHolderName = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information without use as disbursement #TC-62', async function () {
      const body = [
        {
          customerId: customerIdIndividual,
          bankType: 2,
          bankAccountCoverFile: help.randomUrl(),
          masterBankId: 1,
          bankAccountNumber: help.randomInteger(10),
          bankAccountHolderName: help.randomFullName()
        }
      ];

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Should fail when add bank information with use as disbursement empty string #TC-63', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].useAsDisbursement = '';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Should fail when add bank information with use as disbursement null #TC-64', async function () {
      const body = generateBody(customerIdIndividual);
      body[0].useAsDisbursement = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Should fail when add bank information if borrower status is active #TC-65', async function () {
      const registerRes = await request.borrowerRegister(false);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const body = {
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
        .send(body);
      const bankBody = generateBody(customerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(bankBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when add bank information if borrower status is inactive #TC-66', async function () {
      const registerRes = await request.borrowerRegister(false);

      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const body = {
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
        .send(body);
      const bankBody = generateBody(customerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(bankBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail when update bank information if borrower status is pending verification #TC-67', async function () {
      const registerRes = await request.borrowerRegister(false, ['bank-information']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const bankIds = await createBankInformation(url, customerId, accessToken);
      report.setInfo(this, bankIds);

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

      const bankBody = generateBody(customerId);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(bankBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to save in db legacy when failed to sync bank info #TC-68', async function () {
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

      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to save in db new core when failed to sync bank info #TC-69', async function () {
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

      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});

function generateBody (customerId, bankId = '') {
  const body = [
    {
      customerId: customerId,
      bankAccountCoverFile: `bank_cover_${customerId}_${help.randomInteger(3)}.jpeg`,
      masterBankId: 4,
      bankAccountNumber: help.randomInteger(10),
      bankAccountHolderName: help.randomFullName(),
      useAsDisbursement: true,
      bankInformationId: bankId
    }
  ];
  return body;
}

async function createBankInformation (url, customerId, accessToken) {
  const bankIds = [];
  const bodyAdd = generateBody(customerId);
  const resAdd = await chai
    .request(request.getSvcUrl())
    .put(url)
    .set(
      request.createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(bodyAdd);
  resAdd.body.data.forEach((item) => {
    bankIds.push(item.bankInformationId);
  });
  return bankIds;
}
