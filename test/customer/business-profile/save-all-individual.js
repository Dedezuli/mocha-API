const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const chai = require('chai');
const boUser = require('@fixtures/backoffice_user');

describe('Business Profile', function () {
  const url = '/validate/customer/business-profile/save-all';
  const urlGet = '/validate/customer/completing-data/backoffice/borrower';

  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdOtherIndividual;
  let randomAddress;

  before(async function () {
    report.setInfo(this, 'Attempting to login as backoffice admin');
    randomAddress = help.randomAddress();
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
    const registerResIndividual = await request.borrowerRegister();

    customerIdIndividual = registerResIndividual.customerId;
    report.setInfo(this, `Registered with customerId ${customerIdIndividual}`);

    const registerResOtherIndividual = await request.borrowerRegister();

    customerIdOtherIndividual = registerResOtherIndividual.customerId;
    report.setInfo(this, `Registered with customerId ${customerIdOtherIndividual}`);
  });

  describe('#smoke', function () {
    it('Update business information should succeed #TC-141', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to update data when number of employee is zero #TC-149', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.businessProfile.numberOfEmployee = 0;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should succeed to save in db when succeed to change data and activate VA business information #TC-142', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);

      await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(`${changeStatusUrl}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(changeStatusBody);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should succeed to save in db when succeed to unverify VA #TC-143', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);

      await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      const changeStatusBody = {
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
        .send(changeStatusBody);
      const urlUnverifyVA = '/validate/customer/unverify-va/borrower';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(`${urlUnverifyVA}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(null);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should succeed to save in db when succeed to verify VA from resend VA #TC-144', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);

      await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);

      const changeStatusBody = {
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
        .send(changeStatusBody);

      const urlUnverifyVA = '/validate/customer/unverify-va/borrower';

      await chai
        .request(request.getSvcUrl())
        .put(`${urlUnverifyVA}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(null);

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(`${urlGet}/${customerIdIndividual}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        );

      const vaID =
        getDataNewCore.body.data.advancedInfo.bankInformation.field.va[1].bankInformationId;
      const vaIDSyariah =
        getDataNewCore.body.data.advancedInfo.bankInformation.field.va[0].bankInformationId;

      const urlResendVa = `/validate/customer/customer-information/resend-va/borrower/${customerIdIndividual}`;

      const startTimeOne = await help.startTime();
      const resVa = await chai
        .request(request.getSvcUrl())
        .put(`${urlResendVa}/${vaID}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(null);
      const responseTimeOne = await help.responseTime(startTimeOne);

      report.setPayload(this, resVa, responseTimeOne);

      const startTimeTwo = await help.startTime();
      const resVaSyariah = await chai
        .request(request.getSvcUrl())
        .put(`${urlResendVa}/${vaIDSyariah}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(null);
      const responseTimeTwo = await help.responseTime(startTimeTwo);

      report.setPayload(this, resVaSyariah, responseTimeTwo);
      expect(resVa.body.meta).to.have.property('code', 200);
      expect(resVaSyariah.body.meta).to.have.property('code', 200);
    });

    it('Update business information with not null checking result should success #TC-145', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.apuPptInformation.checkingDate = help.randomDate();
      body.apuPptInformation.checkingFile = `${help.randomUrl()}.pdf`;
      body.apuPptInformation.checkingResult = 1;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Should failed to update data when NPWP is not unique #TC-146', async function () {
      const bodyOtherBorrower = await genBody(
        customerIdOtherIndividual,
        randomAddress,
        accessTokenBoAdmin
      );
      const resOtherBorrower = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(bodyOtherBorrower);
      const npwpOtherBorrower = resOtherBorrower.body.data.legalInfoGroup.npwp.documentNumber;

      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.legalInformation[0].documentNumber = npwpOtherBorrower;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when using below 15 npwp digit number #TC-147', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.legalInformation[0].documentNumber = help.randomInteger(14);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when using more than 15 npwp digit number #TC-148', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.legalInformation[0].documentNumber = help.randomInteger(16);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when phone number is negative number #TC-150', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.businessProfile.landLineNumber = '-00001';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when province is null but city is not null #TC-151', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.businessProfile.province = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when city out of province coverage #TC-152', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.businessProfile.province = '1';
      body.businessProfile.city = '24';

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when bank account is null #TC-153', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.bankInformation = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 500);
    });

    it('Should failed to update data when no selected disbursement bank account #TC-154', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.bankInformation[0].useAsDisbursement = false;
      body.bankInformation[1].useAsDisbursement = false;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when more than 1 selected disbursement bank account #TC-155', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      for (let i = 0; i < 2; i++) {
        body.bankInformation[i].useAsDisbursement = true;
      }

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when date of establishment in future (more than today) #TC-156', async function () {
      const body = await genBody(customerIdIndividual, randomAddress, accessTokenBoAdmin);
      body.businessProfile.dateOfEstablishment = help.futureDate();

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('It should failed to save in db when failed to sync #TC-157', async function () {
      const register = await request.borrowerRegister(false, [
        'business-profile',
        'legal-information',
        'bank-information'
      ]);
      const customerId = register.customerId;
      const email = register.emailAddress;

      const urlChangeEmail = '/validate/users/qa/change-email';
      const bodyChangeEmail = {
        newEmailAddress: `testqa${help.randomAlphaNumeric()}@investree.investree`,
        oldEmailAddress: email
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

      const body = await genBody(customerId, randomAddress, accessTokenBoAdmin);
      body.productPreference.productPreference = 2;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });
  });
});

async function genBody (customerId, randomAddress, accessTokenBoAdmin) {
  const urlGetBorrowerData = '/validate/customer/completing-data/backoffice/borrower';
  const getBorrowerData = await chai
    .request(request.getSvcUrl())
    .get(`${urlGetBorrowerData}/${customerId}`)
    .set(
      request.createNewCoreHeaders({
        'X-Investree-Token': accessTokenBoAdmin
      })
    );

  const lengthBank = getBorrowerData.body.data.advancedInfo.bankInformation.field.bankAccount.length;
  const body = {
    customerId: customerId,
    businessProfile: {
      companyName: `${help.randomCompanyName()} ${help.randomInteger(4)} Ind QA`,
      industry: '69',
      dateOfEstablishment: help.randomDate(),
      numberOfEmployee: `1${help.randomInteger(2)}`,
      companyDescription: help.randomDescription(),
      companyAddress: randomAddress.address,
      province: randomAddress.province.id,
      city: randomAddress.city.id,
      district: randomAddress.district.id,
      village: randomAddress.subDistrict.id,
      postalCode: randomAddress.postalCode,
      landLineNumber: help.randomInteger(9)
    },
    productPreference: {
      productPreference: 3
    },
    apuPptInformation: {
      apuPptId: '',
      customerId: customerId,
      checkingDate: help.randomDate(),
      checkingFile: `${help.randomUrl()}.pdf`,
      checkingResult: 1
    },
    bankInformation: [],
    legalInformation: [
      {
        documentType: {
          id: 4,
          name: 'NPWP'
        },
        documentFile: `${help.randomUrl()}.jpeg`,
        documentNumber: help.randomInteger('NPWP'),
        documentExpired: null
      },
      {
        documentType: {
          id: 28,
          name: 'SKDU'
        },
        documentFile: `${help.randomUrl()}.jpeg`,
        documentNumber: help.randomAlphaNumeric(10),
        documentExpired: null
      }
    ],
    partnershipInformation: [
      {
        type: 3,
        partnerId: 4,
        name: 'TOKOPEDIA',
        category: 2,
        startOfRelation: help.backDateByYear(3),
        seller: help.randomAlphaNumeric(),
        sellerLink: help.randomAlphaNumeric(),
        sellerLocation: 2,
        buildingLocOwnership: 1,
        lengthOfOwnership: help.randomInteger(3),
        internalRating: help.randomAlphaNumeric(),
        externalRating: help.randomAlphaNumeric()
      }
    ]
  };

  for (let i = 0; i < 2; i++) {
    const data = {
      bankInformationId: '',
      bankType: {
        id: 29,
        name: 'Bank Account'
      },
      masterBank: {
        id: 1,
        name: 'BANK MANDIRI '
      },
      bankAccountCoverFile: `${help.randomUrl()}.jpeg`,
      bankAccountNumber: help.randomInteger(10),
      bankAccountHolderName: help.randomFullName(),
      useAsDisbursement: false,
      useAsWithdrawal: false,
      isDelete: false,
      newAnchorBank: false,
      masterBankId: 1
    };
    body.bankInformation.push(data);
  }
  body.bankInformation[0].useAsDisbursement = true;
  for (let j = 0; j < lengthBank; j++) {
    body.bankInformation[j].bankInformationId =
      getBorrowerData.body.data.advancedInfo.bankInformation.field.bankAccount[j].bankInformationId;
  }
  return body;
}
