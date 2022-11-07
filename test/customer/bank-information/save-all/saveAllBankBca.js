const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

describe('Bank Information Save All Bank BCA', function () {
  const url = '/validate/customer/bank-information/save-all';

  let accessTokenIndividual;
  // eslint-disable-next-line no-unused-vars
  let accessTokenInstitutional;
  let customerIdIndividual;
  let customerIdInstitutional;

  before(async function () {
    report.setInfo(this, 'Attempting to individual borrower register');
    const registerResIndividual = await request.borrowerRegister();
    report.setPayload(this, registerResIndividual);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to institutional borrower register');
    const registerResInstitutional = await request.borrowerRegister(true);
    report.setPayload(this, registerResInstitutional);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(this, `Institutional borrower registered with customerId ${customerIdInstitutional}`);
  });

  describe('#smoke', function () {
    it('Add bank information bank BCA bank account name Tahapan should succeed #TC-38', async function () {
      const randomInteger = help.randomInteger(3);

      const body = [{
        customerId: customerIdIndividual,
        bankInformationId: '',
        bankType: 2,
        bankAccountCoverFile: `bank_cover_${customerIdIndividual}_${randomInteger}.jpeg`,
        masterBankId: 2,
        bankAccountNumber: '0611104579',
        bankAccountHolderName: 'Tahapan',
        useAsDisbursement: true
      }];

      const startTime = await help.startTime();
      const res = await chai.request(request.getSvcUrl())
        .put(url)
        .set(request.createNewCoreHeaders({
          'X-Investree-Token': accessTokenIndividual
        }))
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Add bank information bank BCA bank account name Pertamina should succeed #TC-39', async function () {
      const randomInteger = help.randomInteger(3);

      const body = [{
        customerId: customerIdIndividual,
        bankInformationId: '',
        bankType: 2,
        bankAccountCoverFile: `bank_cover_${customerIdIndividual}_${randomInteger}.jpeg`,
        masterBankId: 2,
        bankAccountNumber: '0613006548',
        bankAccountHolderName: 'Pertamina',
        useAsDisbursement: true
      }];

      const startTime = await help.startTime();
      const res = await chai.request(request.getSvcUrl())
        .put(url)
        .set(request.createNewCoreHeaders({
          'X-Investree-Token': accessTokenIndividual
        }))
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Add bank information using non-existent bank BCA account should fail #TC-40', async function () {
      const randomInteger = help.randomInteger(3);

      const body = [{
        customerId: customerIdIndividual,
        bankInformationId: '',
        bankType: 2,
        bankAccountCoverFile: `bank_cover_${customerIdIndividual}_${randomInteger}.jpeg`,
        masterBankId: 2,
        bankAccountNumber: '0613006548',
        bankAccountHolderName: 'Pertamin',
        useAsDisbursement: true
      }];

      const startTime = await help.startTime();
      const res = await chai.request(request.getSvcUrl())
        .put(url)
        .set(request.createNewCoreHeaders({
          'X-Investree-Token': accessTokenIndividual
        }))
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});
