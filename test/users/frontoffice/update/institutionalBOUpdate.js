const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const dbFun = require('@lib/dbFunction');
const chai = require('chai');

describe('Frontoffice User Update', function () {
  let customerIdInstitutional;
  let accessTokenAdmin;
  let usernameRestricted;
  let customerIdRestricted;
  let customerIdOther;
  let usernameOther;
  let resDataBorrower;
  let resDataOtherBorrower;
  let urlInstitutional;
  const urlGetData = '/validate/customer/completing-data/backoffice/borrower';
  const url = '/validate/users/frontoffice/update';

  before(async function () {
    report.setInfo(this, 'Attempting to do frontoffice borrower register');
    const borrower = await request.borrowerRegister(true);

    customerIdInstitutional = borrower.customerId;
    report.setInfo(
      this,
      `Success to register a borrower with customer id : ${customerIdInstitutional}`
    );

    const otherBorrower = await request.borrowerRegister(true);
    customerIdOther = otherBorrower.customerId;
    usernameOther = otherBorrower.userName;
    report.setInfo(this, `Success to register a borrower with customer id : ${customerIdOther}`);

    const restrictedBorrower = await request.borrowerRegister(true, [
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
      .get(`${urlGetData}/${customerIdInstitutional}`)
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
    urlInstitutional = `${url}/${customerIdInstitutional}`;
  });

  describe('#smoke', function () {
    it('Backoffice user update personal information of borrower should succeed #TC-405', async function () {
      const body = generateBody(customerIdInstitutional);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should success to save in db when backoffice user update personal information of borrower #TC-406', async function () {
      const body = generateBody(customerIdInstitutional);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenAdmin
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(`${urlGetData}/${customerIdInstitutional}`)
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
          [filterRd]: customerIdInstitutional
        });
      const getDataLegacyRD = JSON.parse(getDataLegacyRDRes.text);

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const getDataLegacyBPDRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerIdInstitutional
        });
      const getDataLegacyBPD = JSON.parse(getDataLegacyBPDRes.text);

      await assertRequestSavedDataToDatabase(
        body,
        getDataLegacyRD[0],
        getDataLegacyBPD[0],
        getDataNewCore
      );
    });
  });

  describe('#negative', function () {
    it('Should failed when backoffice user update borrower institutional with not JPEG/PNG selfie #TC-407', async function () {
      const body = generateBody(customerIdInstitutional);
      body.selfiePicture = `${help.randomUrl()}.pdf`;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional with date below 17 years old in date of birth #TC-408', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.dateOfBirth = help.dateUnder17YearsOld();

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional user name with not unique user name #TC-409', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = usernameOther;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional user name with below 8 char username #TC-410', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = help.randomAlphaNumeric(7);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional user name with more than 20 char username #TC-411', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.username = help.randomAlphaNumeric(21);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional ID Card Number with existing ID Card Number and not own by that borrower #TC-412', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber =
        resDataOtherBorrower.body.data.advancedInfo.personalProfile.field.idCardNumber;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional ID Card Number with below 16 char ID Card Number and not own by that borrower #TC-413', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber = help.randomInteger(15);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional ID Card Number with more than 16 char ID Card Number and not own by that borrower #TC-414', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardNumber = help.randomInteger(17);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional ID Card Expired Date to today #TC-415', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.idCardExpiredDate = help.formatDate(help.timestamp());

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional Province with null, but district not null #TC-416', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.province = null;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional city out of coverage selected province #TC-417', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.city = 24;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional postal code with below 5 char #TC-418', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.postalCode = help.randomInteger(4);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed when backoffice user update borrower institutional postal code with more 5 char #TC-419', async function () {
      const body = generateBodyForUpdate(resDataBorrower);
      body.postalCode = help.randomInteger(6);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(urlInstitutional)
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

    it('Should failed to sync when backoffice user update personal information of restricted borrower #TC-420', async function () {
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
        .get(`${urlGetData}/${customerIdInstitutional}`)
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
          [filterRd]: customerIdInstitutional
        });
      const getDataLegacyRD = JSON.parse(getDataLegacyRDRes.text);

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const getDataLegacyBPDRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerIdInstitutional
        });
      const getDataLegacyBPD = JSON.parse(getDataLegacyBPDRes.text);

      await assertRequestSavedDataToDatabase(
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
    id: customerId,
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
      knowInvestreeFrom: '1'
    }
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

function assertRequestSavedDataToDatabase (
  bodyRequest,
  getDataLegacyRD,
  getDataLegacyBPD,
  getDataNewCore
) {
  const address = getDataNewCore.body.data.advancedInfo.personalProfile.field.address;
  const city = getDataNewCore.body.data.advancedInfo.personalProfile.field.city.id;
  const dateOfBirth = getDataNewCore.body.data.advancedInfo.personalProfile.field.dateOfBirth;
  const district = getDataNewCore.body.data.advancedInfo.personalProfile.field.district.id;
  const domicileAddress =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileAddress;
  const domicileCity = getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileCity.id;
  const domicileCityName =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileCity.name;
  const domicileDistrict =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileDistrict.id;
  const domicileDistrictName =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileDistrict.name;
  const domicilePostalCode =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicilePostalCode;
  const domicileProvince =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileProvince.id;
  const domicileProvinceName =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileProvince.name;
  const domicileSubDistrict =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileSubDistrict.id;
  const domicileSubDistrictName =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.domicileSubDistrict.name;
  const education = getDataNewCore.body.data.advancedInfo.personalProfile.field.education.id;
  const idCardExpiredDate =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardExpiredDate;
  const idCardNumber = getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardNumber;
  const idCardPicture = getDataNewCore.body.data.advancedInfo.personalProfile.field.idCardPicture;
  const maritalStatus =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.maritalStatus.id;
  const occupation = getDataNewCore.body.data.advancedInfo.personalProfile.field.occupation.id;
  const placeOfBirth = getDataNewCore.body.data.advancedInfo.personalProfile.field.placeOfBirth.id;
  const postalCode = getDataNewCore.body.data.advancedInfo.personalProfile.field.postalCode;
  const province = getDataNewCore.body.data.advancedInfo.personalProfile.field.province.id;
  const religion = getDataNewCore.body.data.advancedInfo.personalProfile.field.religion.id;
  const salutation = getDataNewCore.body.data.basicInfo.salutation;
  const sameAsDomicileAddress =
    getDataNewCore.body.data.advancedInfo.personalProfile.field.sameAsDomicileAddress;
  const selfiePicture = getDataNewCore.body.data.advancedInfo.personalProfile.field.selfiePicture;
  const subDistrict = getDataNewCore.body.data.advancedInfo.personalProfile.field.subDistrict.id;
  const username = getDataNewCore.body.data.basicInfo.username;
  let dateOfBirthLegacy = getDataLegacyBPD.bpd_dob;
  dateOfBirthLegacy = dateOfBirthLegacy.split('T');
  dateOfBirthLegacy = dateOfBirthLegacy[0];
  const domicileAddressLegacy = getDataLegacyBPD.bpd_domicile_address;
  const domicileCityLegacy = getDataLegacyBPD.bpd_domicile_kab_kot;
  const domicileDistrictLegacy = getDataLegacyBPD.bpd_domicile_kecamatan;
  const domicilePostalCodeLegacy = getDataLegacyBPD.bpd_domicile_postal_code;
  const domicileProvinceLegacy = getDataLegacyBPD.bpd_domicile_province;
  const domicileSubDistrictLegacy = getDataLegacyBPD.bpd_domicile_kelurahan;
  const idLegacy = getDataLegacyBPD.bpd_migration_id;
  let idCardExpiredDateLegacy = getDataLegacyBPD.bpd_ktp_expired;
  idCardExpiredDateLegacy = idCardExpiredDateLegacy.split('T');
  idCardExpiredDateLegacy = idCardExpiredDateLegacy[0];
  const idCardNumberLegacy = getDataLegacyBPD.bpd_ktp;
  const idCardPictureLegacy = getDataLegacyBPD.bpd_ktp_file;
  const salutationLegacy = getDataLegacyRD.rd_salutation;

  expect(bodyRequest).to.have.property(
    'address',
    address,
    "address of request doesn't equal data to address that already saved"
  );
  expect(bodyRequest).to.have.property(
    'city',
    city,
    "city of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'dateOfBirth',
    dateOfBirth,
    "date of birth of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'district',
    district,
    "district of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileAddress',
    domicileAddress,
    "domicile address of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileCity',
    domicileCity,
    "domicile city of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileDistrict',
    domicileDistrict,
    "domicile of district of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicilePostalCode',
    domicilePostalCode,
    "domicile of postal code doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileProvince',
    domicileProvince,
    "district of province request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileSubDistrict',
    domicileSubDistrict,
    "domicile of sub district request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'education',
    education,
    "education of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardExpiredDate',
    idCardExpiredDate,
    "idcard expired date of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardNumber',
    idCardNumber,
    "idcard number of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardPicture',
    idCardPicture,
    "idcard url picture of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'maritalStatus',
    maritalStatus,
    "marital status of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'occupation',
    occupation,
    "occupation of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'placeOfBirth',
    placeOfBirth,
    "place of birth of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'postalCode',
    postalCode,
    "postal code of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'province',
    province,
    "province of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'religion',
    religion,
    "religion of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'salutation',
    salutation,
    "salutation of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'sameAsDomicileAddress',
    sameAsDomicileAddress,
    "same as domicile address of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'selfiePicture',
    selfiePicture,
    "selfie picture of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'subDistrict',
    subDistrict,
    "sub district of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'username',
    username,
    "username of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property('id', idLegacy, "customer id doesn't equal");
  expect(bodyRequest).to.have.property(
    'dateOfBirth',
    dateOfBirthLegacy,
    "date of birth of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicileAddress',
    domicileAddressLegacy,
    "domicile address of request doesn't equal to data that already saved"
  );
  expect(domicileCityName).to.equal(
    `KOTA ${domicileCityLegacy}`,
    "domicile city of request doesn't equal to data that already saved"
  );
  expect(domicileDistrictName).to.equal(
    domicileDistrictLegacy,
    "domicile of district of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'domicilePostalCode',
    domicilePostalCodeLegacy,
    "domicile of postal code doesn't equal to data that already saved"
  );
  expect(domicileProvinceName).to.equal(
    domicileProvinceLegacy,
    "district of province request doesn't equal to data that already saved"
  );
  expect(domicileSubDistrictName).to.equal(
    domicileSubDistrictLegacy,
    "domicile of sub district request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardExpiredDate',
    idCardExpiredDateLegacy,
    "idcard expired date of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardNumber',
    idCardNumberLegacy,
    "idcard number of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'idCardPicture',
    idCardPictureLegacy,
    "idcard url picture of request doesn't equal to data that already saved"
  );
  expect(bodyRequest).to.have.property(
    'salutation',
    salutationLegacy,
    "salutation of request doesn't equal to data that already saved"
  );
}
