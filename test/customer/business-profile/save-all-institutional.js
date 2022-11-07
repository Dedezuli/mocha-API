const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');

describe('Business Profile', function () {
  const url = '/validate/customer/business-profile/save-all';
  let accessTokenBoAdmin;
  let customerIdOtherInstitutional;
  let customerIdInstitutional;
  let customerId;
  let npwpOtherBorrower;
  let username;
  const randomAddress = help.randomAddress();

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
    const registerResInstitutional = await request.borrowerRegister(true);
    customerIdInstitutional = registerResInstitutional.customerId;
    report.setInfo(this, `Registered with customerId ${customerIdInstitutional}`);

    const registerResOtherInstitutional = await request.borrowerRegister(true);
    customerIdOtherInstitutional = registerResOtherInstitutional.customerId;
    report.setInfo(this, `Registered with customerId ${customerIdOtherInstitutional}`);
  });

  describe('#smoke', function () {
    it('Should success to update business info without background checking #TC-158', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.apuPptInformation.checkingDate = '';
      body.apuPptInformation.checkingFile = null;
      body.apuPptInformation.checkingResult = null;

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

    it('Should success to update business info without Group Information #TC-159', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.businessProfile.groupCompany = '';
      body.businessProfile.groupDescription = '';
      body.businessProfile.listOfPayor = '';
      body.businessProfile.relationshipWithBank = false;

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

    it('Should success to update business info without partnership info #TC-160', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);

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

    it('Should success to save in db when success to update business info of Project Financing Borrower #TC-161', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);

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

    it('Should success to save in db when success to update business info of WCTL Borrower #TC-162', async function () {
      const registerRes = await request.borrowerRegister(true, [], { productSelection: 3 });
      customerId = registerRes.customerId;
      const body = await genBody(customerId, randomAddress, accessTokenBoAdmin);

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
    it('Should failed to update data when number of employee is zero #TC-163', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to update data when phone number is negative number #TC-164', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.businessProfile.landLineNumber = '-000001';

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

    it('Should failed to update data when province is null but city is not null #TC-165', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.businessProfile.province = '';

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

    it('Should failed to update data when city out of province coverage #TC-166', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.businessProfile.province = 1;
      body.businessProfile.city = 24;

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

    it('Should failed to update data when date of establishment in future (more than today) #TC-167', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when bank account is null #TC-168', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when no selected disbursement bank account #TC-169', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when more than 1 selected disbursement bank account #TC-170', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.bankInformation[0].useAsDisbursement = true;
      body.bankInformation[1].useAsDisbursement = true;

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

    it('Should failed to update data when NPWP is not unique #TC-171', async function () {
      const bodyOtherBorrower = await genBody(
        customerIdOtherInstitutional,
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
      npwpOtherBorrower = resOtherBorrower.body.data.legalInfoGroup.npwp.documentNumber;

      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when NPWP below 15 digit number #TC-172', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when NPWP more 15 digit number #TC-173', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
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

    it('Should failed to update data when NPWP file format not in JPEG/PNG/PDF #TC-174', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[0].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when SIUP file format not in JPEG/PNG/PDF #TC-175', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[1].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when Akta Pendirian file format not in JPEG/PNG/PDF #TC-176', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[2].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when Akta Terbaru file format not in JPEG/PNG/PDF #TC-177', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[3].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when MENKUHAM file format not in JPEG/PNG/PDF #TC-178', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[4].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when TDP file format not in JPEG/PNG/PDF #TC-179', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[5].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to update data when SKDU file format not in JPEG/PNG/PDF #TC-180', async function () {
      const body = await genBody(customerIdInstitutional, randomAddress, accessTokenBoAdmin);
      body.legalInformation[6].documentFile = `${help.randomUrl()}.txt`;

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

    it('Should failed to save in db when failed to sync #TC-181', async function () {
      const register = await request.borrowerRegister(true, [
        'business-profile',
        'legal-information',
        'bank-information'
      ]);
      customerId = register.customerId;
      username = register.userName;

      await dbFun.changeEmailByUsername(username);

      const body = await genBody(customerId, randomAddress, accessTokenBoAdmin);

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
    .set(request.createNewCoreHeaders({ 'X-Investree-Token': accessTokenBoAdmin }));

  const lengthBank = getBorrowerData.body.data.advancedInfo.bankInformation.field.bankAccount.length;
  const body = {
    customerId: customerId,
    businessProfile: {
      companyName: `${help.randomCompanyName()} ${help.randomInteger(4)} Ins QA`,
      companyNarration: 'Lorem ipsum dolor sit amet.',
      legalEntity: 1,
      industry: '861',
      dateOfEstablishment: help.randomDate(),
      numberOfEmployee: `1${help.randomInteger(1)}`,
      companyDescription:
        'virtual leverage communities. Facere quis sapiente ut ratione ea dolor aspernatur',
      companyAddress: randomAddress.address,
      province: randomAddress.province.id,
      city: randomAddress.city.id,
      district: randomAddress.district.id,
      village: randomAddress.subDistrict.id,
      postalCode: randomAddress.postalCode,
      landLineNumber: help.randomInteger(9),
      groupCompany: `${help.randomCompanyName()} Ins QA`,
      groupDescription: help.randomAlphaNumeric(),
      listOfPayor: 'asdadas,adasd',
      relationshipWithBank: true
    },
    productPreference: {
      productPreference: 3
    },
    apuPptInformation: {
      apuPptId: '',
      customerId: customerId,
      checkingDate: help.randomDate(),
      checkingFile: help.randomUrl(),
      checkingResult: 1
    },
    bankInformation: [],
    legalInformation: [
      {
        documentType: {
          id: 4,
          name: 'NPWP'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomInteger('NPWP'),
        documentRegistered: null,
        documentExpiredDate: null
      },
      {
        documentType: {
          id: 5,
          name: 'SIUP'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 7,
          name: 'Akta Pendirian'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 9,
          name: 'Akta Terbaru'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 8,
          name: 'MENKUHAM'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 6,
          name: 'TDP'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: help.futureDate()
      },
      {
        documentType: {
          id: 28,
          name: 'SKDU'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric(),
        documentRegistered: null,
        documentExpiredDate: null
      }
    ],
    partnershipInformation: [
      {
        partnershipInfoId: null,
        type: '2',
        name: 'pt. bank dbs',
        category: null,
        startOfRelation: help.backDateByYear(2),
        seller: null,
        sellerLink: null,
        sellerLocation: null,
        buildingLocOwnership: '',
        lengthOfRelation: null,
        lengthOfOwnership: null,
        internalRating: null,
        partnerId: 3,
        externalRating: null
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
