const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');

describe('Frontoffice User Update', function () {
  let customerIdIndividual;
  let accessTokenAdmin;
  let usernameRestricted;
  let customerIdRestricted;
  let customerIdOther;
  let usernameOther;
  let resDataBorrower;
  let resDataOtherBorrower;
  let urlIndividual;
  const urlGetData = '/validate/customer/completing-data/backoffice/borrower';
  const url = '/validate/users/frontoffice/update';

  before(async function () {
    report.setInfo(this, 'Attempting to do frontoffice borrower register');
    const borrower = await request.borrowerRegister(false);

    customerIdIndividual = borrower.customerId;
    report.setInfo(
      this,
      `Success to register a borrower with customer id : ${customerIdIndividual}`
    );

    const restrictedBorrower = await request.borrowerRegister(false, [
      'personal-profile-identification',
      'personal-profile-personal-data'
    ]);
    customerIdRestricted = restrictedBorrower.customerId;
    usernameRestricted = restrictedBorrower.userName;
    report.setInfo(
      this,
      `Success to register a borrower with customer id : ${customerIdRestricted}`
    );

    report.setInfo(this, 'Attempting to do backoffice login as admin');
    const resAdmin = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    accessTokenAdmin = resAdmin.data.accessToken;
    report.setInfo(
      this,
      `Success to login as back office user with access token : ${accessTokenAdmin}`
    );

    report.setInfo(this, "Attempting to get selected borrower's data by admin");
    resDataBorrower = await chai
      .request(request.getSvcUrl())
      .get(`${urlGetData}/${customerIdIndividual}`)
      .set(
        request.createNewCoreHeaders({
          'X-Investree-Token': accessTokenAdmin
        })
      );

    resDataOtherBorrower = await chai
      .request(request.getSvcUrl())
      .get(`${urlGetData}/${customerIdOther}`)
      .set(
        request.createNewCoreHeaders({
          'X-Investree-Token': accessTokenAdmin
        })
      );
    urlIndividual = `${url}/${customerIdIndividual}`;
  });

  describe('#smoke', function () {
    it('Backoffice user update personal information of borrower should succeed #TC-387', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Should success to save in db when backoffice user update personal information of borrower #TC-388', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function () {
    it('Should failed when backoffice user update borrower individual with not JPEG/PNG selfie #TC-389', async function () {
      const body = generateBody(customerIdIndividual);
      body.selfiePicture = `${help.randomUrl()}.pdf`;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual with date below 17 years old in date of birth #TC-390', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.dateOfBirth = help.dateUnder17YearsOld();

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual user name with not unique user name #TC-391', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = usernameOther;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual user name with below 8 char username #TC-392', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = help.randomAlphaNumeric(7);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual user name with more than 20 char username #TC-393', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = help.randomAlphaNumeric(21);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual ID Card Number with existing ID Card Number and not own by that borrower #TC-394', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber =
        resDataOtherBorrower.body.data.advancedInfo.personalProfile.field.idCardNumber;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual ID Card Number with below 16 char ID Card Number and not own by that borrower #TC-395', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber = help.randomInteger(15);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual ID Card Number with more than 16 char ID Card Number and not own by that borrower #TC-396', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber = help.randomInteger(17);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual ID Card Expired Date to today #TC-397', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardExpiredDate = help.formatDate(help.timestamp());

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual Province with null, but district not null #TC-398', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.province = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual city out of coverage selected province #TC-399', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.city = 24;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual postal code with below 5 char #TC-400', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.postalCode = help.randomInteger(4);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed when backoffice user update borrower individual postal code with more 5 char #TC-401', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.postalCode = help.randomInteger(6);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlIndividual)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        );
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should failed to sync when backoffice user update personal information of restricted borrower #TC-402', async function () {
      await dbFun.changeEmailByUsername(usernameRestricted);

      const body = generateBody(customerIdRestricted);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(`${url}/${customerIdRestricted}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(`${urlGetData}/${customerIdRestricted}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        );

      const filterRd = 'filter[where][{}]'.replace('{}', 'rd_new_core_id');
      const getDataLegacyRDRes = await chai
        .request(request.getApiSyncUrl())
        .get('/rd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterRd]: customerIdRestricted
        });
      const getDataLegacyRD = JSON.parse(getDataLegacyRDRes.text);

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const getDataLegacyBPDRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerIdRestricted
        });
      const getDataLegacyBPD = JSON.parse(getDataLegacyBPDRes.text);
      await assertRequestNotSavedDataToDatabase(
        body,
        getDataLegacyRD[0],
        getDataLegacyBPD[0],
        getDataNewCore
      );
    });
  });
});

function generateBody (customerId) {
  const fullAddress = help.randomAddress();
  const fullAddressDomicile = help.randomAddress();
  const placeOfBirth = help.randomAddress().city.id;
  const body = {
    address: fullAddress.address,
    city: fullAddress.city.id,
    dateOfBirth: help.formatDate(new Date('2002-11-01')),
    district: fullAddress.district.id,
    domicileAddress: fullAddressDomicile.address,
    domicileCity: fullAddressDomicile.city.id,
    domicileDistrict: fullAddressDomicile.district.id,
    domicilePostalCode: fullAddressDomicile.postalCode,
    domicileProvince: fullAddressDomicile.province.id,
    domicileSubDistrict: fullAddressDomicile.subDistrict.id,
    education: 1,
    id: parseInt(customerId),
    idCardExpiredDate: help.futureDate(),
    idCardNumber: help.randomInteger('KTP'),
    idCardPicture: `${help.randomUrl()}`,
    maritalStatus: 1,
    occupation: 1,
    placeOfBirth: placeOfBirth,
    postalCode: fullAddress.postalCode,
    province: fullAddress.province.id,
    religion: 1,
    salutation: help.setSalutation(help.randomGender()),
    sameAsDomicileAddress: false,
    selfiePicture: `${help.randomUrl()}`,
    subDistrict: fullAddress.subDistrict.id,
    username: help.randomAlphaNumeric(12),
    referralCodeRequest: {
      knowInvestreeFrom: 1
    },
    userCategory: 1
  };

  return body;
}

function generateBodyForUpdate (resDataBorrower) {
  const body = {
    address: resDataBorrower.body.data.advancedInfo.personalProfile.field.address,
    city: resDataBorrower.body.data.advancedInfo.personalProfile.field.city.id,
    dateOfBirth: resDataBorrower.body.data.advancedInfo.personalProfile.field.dateOfBirth,
    district: resDataBorrower.body.data.advancedInfo.personalProfile.field.district.id,
    domicileAddress: resDataBorrower.body.data.advancedInfo.personalProfile.field.domicileAddress,
    domicileCity: resDataBorrower.body.data.advancedInfo.personalProfile.field.domicileCity.id,
    domicileDistrict:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.domicileDistrict.id,
    domicilePostalCode:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.domicilePostalCode,
    domicileProvince:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.domicileProvince.id,
    domicileSubDistrict:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.domicileSubDistrict.id,
    education: resDataBorrower.body.data.advancedInfo.personalProfile.field.education.id,
    id: resDataBorrower.body.data.basicInfo.customerId,
    idCardExpiredDate:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.idCardExpiredDate,
    idCardNumber: resDataBorrower.body.data.advancedInfo.personalProfile.field.idCardNumber,
    idCardPicture: resDataBorrower.body.data.advancedInfo.personalProfile.field.idCardPicture,
    maritalStatus: resDataBorrower.body.data.advancedInfo.personalProfile.field.maritalStatus.id,
    occupation: resDataBorrower.body.data.advancedInfo.personalProfile.field.occupation.id,
    placeOfBirth: resDataBorrower.body.data.advancedInfo.personalProfile.field.placeOfBirth.id,
    postalCode: resDataBorrower.body.data.advancedInfo.personalProfile.field.postalCode,
    province: resDataBorrower.body.data.advancedInfo.personalProfile.field.province.id,
    religion: resDataBorrower.body.data.advancedInfo.personalProfile.field.religion.id,
    salutation: resDataBorrower.body.data.basicInfo.salutation,
    sameAsDomicileAddress:
      resDataBorrower.body.data.advancedInfo.personalProfile.field.sameAsDomicileAddress,
    selfiePicture: resDataBorrower.body.data.advancedInfo.personalProfile.field.selfiePicture,
    subDistrict: resDataBorrower.body.data.advancedInfo.personalProfile.field.subDistrict.id,
    username: resDataBorrower.body.data.basicInfo.username,
    referralCodeRequest: {
      knowInvestreeFrom: '1'
    }
  };
  return body;
}

function assertRequestNotSavedDataToDatabase (
  bodyRequest,
  getDataLegacyRD,
  getDataLegacyBPD,
  getDataNewCore
) {
  const address = getDataNewCore.body.data.advancedInfo.personalProfile.field.address;
  const city = getDataNewCore.body.data.advancedInfo.personalProfile.field.city;
  const dateOfBirth = getDataNewCore.body.data.advancedInfo.personalProfile.field.dateOfBirth;
  const district = getDataNewCore.body.data.advancedInfo.personalProfile.field.district;
  const domicileAddress =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileAddress;
  const domicileCity = getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileCity;
  const domicileDistrict =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileDistrict;
  const domicilePostalCode =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicilePostalCode;
  const domicileProvince =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileProvince;
  const domicileSubDistrict =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileSubDistrict;
  const education = getDataNewCore.body.data.advancedInfo.personalProfile.field.education;
  const idCardExpiredDate =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardExpiredDate;
  const idCardNumber = getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardNumber;
  const idCardPicture = getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardPicture;
  const maritalStatus = getDataNewCore.body.data.advancedInfo.personalProfile.field.maritalStatus;
  const occupation = getDataNewCore.body.data.advancedInfo.personalProfile.field.occupation;
  const placeOfBirth = getDataNewCore.body.data.advancedInfo.personalProfile.field.placeOfBirth;
  const postalCode = getDataNewCore.body.data.advancedInfo.personalProfile.field.postalCode;
  const province = getDataNewCore.body.data.advancedInfo.personalProfile.field.province;
  const religion = getDataNewCore.body.data.advancedInfo.personalProfile.field.religion;
  const selfiePicture = getDataNewCore.body.data.advancedInfo.personalProfile.field.selfiePicture;
  const subDistrict = getDataNewCore.body.data.advancedInfo.personalProfile.field.subDistrict;
  const knowInvestreeFrom =
    getDataNewCore.body.data.advancedInfo.referralInformation.field.knowInvestreeFrom;
  const dateOfBirthLegacy = getDataLegacyBPD.bpd_dob;
  const domicileAddressLegacy = getDataLegacyBPD.bpd_domicile_address;
  const domicileCityLegacy = getDataLegacyBPD.bpd_domicile_kab_kot;
  const domicileDistrictLegacy = getDataLegacyBPD.bpd_domicile_kecamatan;
  const domicilePostalCodeLegacy = getDataLegacyBPD.bpd_domicile_postal_code;
  const domicileProvinceLegacy = getDataLegacyBPD.bpd_domicile_province;
  const domicileSubDistrictLegacy = getDataLegacyBPD.bpd_domicile_kelurahan;
  const idLegacy = getDataLegacyBPD.bpd_migration_id;
  const idCardExpiredDateLegacy = getDataLegacyBPD.bpd_ktp_expired;
  const idCardNumberLegacy = getDataLegacyBPD.bpd_ktp;
  const idCardPictureLegacy = getDataLegacyBPD.bpd_ktp_file;
  const knowInvestreeFromLegacy = getDataLegacyRD.rd_know_investree_from;

  expect(address, 'address in new core should be null').to.be.null;
  expect(city, 'city in new core should be null').to.be.null;
  expect(dateOfBirth, 'dateOfBirth in new core should be null').to.be.null;
  expect(district, 'district in new core should be null').to.be.null;
  expect(domicileAddress, 'domicileAddress in new core should be null').to.be.null;
  expect(domicileCity, 'domicileCity in new core should be null').to.be.null;
  expect(domicileDistrict, 'domicileDistrict in new core should be null').to.be.null;
  expect(domicilePostalCode, 'domicilePostalCode in new core should be null').to.be.null;
  expect(domicileProvince, 'domicileProvince in new core should be null').to.be.null;
  expect(domicileSubDistrict, 'domicileSubDistrict in new core should be null').to.be.null;
  expect(education, 'education in new core should be null').to.be.null;
  expect(idCardExpiredDate, 'idCardExpiredDate in new core should be null').to.be.null;
  expect(idCardNumber, 'idCardNumber in new core should be null').to.be.null;
  expect(idCardPicture, 'idCardPicture in new core should be null').to.be.null;
  expect(maritalStatus, 'maritalStatus in new core should be null').to.be.null;
  expect(occupation, 'occupation in new core should be null').to.be.null;
  expect(placeOfBirth, 'placeOfBirth in new core should be null').to.be.null;
  expect(postalCode, 'postalCode in new core should be null').to.be.null;
  expect(province, 'province in new core should be null').to.be.null;
  expect(religion, 'religion in new core should be null').to.be.null;
  expect(selfiePicture, 'selfiePicture in new core should be null').to.be.null;
  expect(subDistrict, 'subDistrict in new core should be null').to.be.null;
  expect(knowInvestreeFrom, 'knowInvestreeFrom in new core should be null').to.be.null;
  expect(bodyRequest).to.have.property('id', idLegacy, "customer id doesn't equal");
  expect(dateOfBirthLegacy, 'date of birth in legacy should be null').to.be.null;
  expect(domicileAddressLegacy, 'domicile address in legacy should be null').to.be.null;
  expect(domicileCityLegacy, 'domicile city in legacy should be null').to.be.null;
  expect(domicileDistrictLegacy, 'domicile district in legacy should be null').to.be.null;
  expect(domicilePostalCodeLegacy, 'domicile postal code in legacy should be null').to.be.null;
  expect(domicileProvinceLegacy, 'domicile postal province in legacy should be null').to.be.null;
  expect(domicileSubDistrictLegacy, 'domicile district in legacy should be null').to.be.null;
  expect(idCardExpiredDateLegacy, 'idCardExpiredDate in legacy should be null').to.be.null;
  expect(idCardNumberLegacy, 'idCardNumberLegacy in legacy should be null').to.be.null;
  expect(idCardPictureLegacy, 'idCardPictureLegacy in legacy should be null').to.be.null;
  expect(knowInvestreeFromLegacy, 'knowInvestreeFrom in legacy should be null').to.be.null;
}
