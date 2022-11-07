const help = require('@lib/helper');
const request = require('@lib/request');
const chai = require('chai');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const expect = require('chai').expect;

describe('Business Profile', function () {
  const url = '/validate/customer/business-profile';
  const urlGetData = '/validate/customer/completing-data/frontoffice/borrower?';
  const urlLogin = '/validate/users/auth/login';
  const urlChangeEmail = '/validate/users/qa/change-email';
  let accessTokenIndividual;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;
  let accessTokenInstitutional;
  let emailInstitutional;
  let emailIndividual;
  let usernameInstitutional;
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
    report.setInfo(this, 'Attempting to register individual borrower');
    const registerResIndividual = await request.borrowerRegister(false, ['business-profile']);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    emailIndividual = registerResIndividual.emailAddress;
    usernameIndividual = registerResIndividual.userName;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to register institutional borrower');
    const registerResInstitutional = await request.borrowerRegister(true, ['business-profile']);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    emailInstitutional = registerResInstitutional.emailAddress;
    usernameInstitutional = registerResInstitutional.userName;
    report.setInfo(this, `Registered with customerId ${customerIdInstitutional}`);
  });

  describe('#smoke', function () {
    it('Add business profile should succeed #TC-98', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should succeed to save in db when success to add business profile #TC-99', async function () {
      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );

      expect(getDataNewCore.body.meta).to.have.property('code', 200);
    });

    it('Add business profile using company name alphanumeric should succeed #TC-100', async function () {
      const randomInteger = parseInt(help.randomInteger(3));
      const body = generateBody(customerIdIndividual);
      body.companyName = `${help.randomCompanyName()} ${randomInteger}`;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Add business profile using company name special characters should succeed #TC-101', async function () {
      const randomInteger = parseInt(help.randomInteger(3));

      const body = generateBody(customerIdIndividual);
      body.companyName = `${help.randomCompanyName()}-${randomInteger}.`;

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Add business profile using landline number minimum 5 digits should succeed #TC-102', async function () {
      const body = generateBody(customerIdInstitutional);
      body.landLineNumber = help.randomPhoneNumber(5);

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
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add business profile using customerId of different user #TC-103', async function () {
      const body = generateBody(customerIdInstitutional);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should fail when add business profile using future date in date of establishment field #TC-104', async function () {
      const body = generateBody(customerIdIndividual);
      body.dateOfEstablishment = help.futureDate();

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should fail when add business profile landline number less than 5 digits #TC-105', async function () {
      const body = generateBody(customerIdIndividual);
      body.landLineNumber = help.randomPhoneNumber(4);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should fail when add business profile if borrower status is active #TC-106', async function () {
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

      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should fail when add business profile if borrower status is pending verification #TC-107', async function () {
      const registerRes = await request.borrowerRegister(false);
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

    it('Should fail when add business profile if borrower status is inactive #TC-108', async function () {
      const changeStatusBody = {
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
        .send(changeStatusBody);

      const body = generateBody(customerIdIndividual);

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
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

    it('Should fail to save in db when failed to sync data of institutional borrower #TC-109', async function () {
      const bodyChangeEmail = {
        newEmailAddress: `testqa${help.randomAlphaNumeric()}@investree.investree`,
        oldEmailAddress: emailInstitutional
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
        username: usernameInstitutional,
        password: help.getDefaultPassword()
      };

      const resLogin = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send(bodyLogin);
      accessTokenInstitutional = resLogin.body.data.accessToken;

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

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const getDataBpdRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerIdInstitutional
        });
      const getDataBpd = JSON.parse(getDataBpdRes.text);
      await assertNotSavedData(getDataNewCore, getDataBpd, body);
    });

    it('Should fail to save in db when failed to sync data of individual borrower #TC-110', async function () {
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
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataNewCore = await chai
        .request(request.getSvcUrl())
        .get(urlGetData)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const getDataBpdRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerIdIndividual
        });
      const getDataBpd = JSON.parse(getDataBpdRes.text);
      await assertNotSavedData(getDataNewCore, getDataBpd, body);
    });
  });
});

function generateBody (customerId) {
  const randomAddress = help.randomAddress();
  const body = {
    dateOfEstablishment: help.randomDate(2000),
    companyName: `${help.randomCompanyName()}`,
    numberOfEmployee: help.randomInteger(3),
    companyDescription:
      'front-end visualize applications. Voluptatem nesciunt molestiae. Ex dolorum eaque libero quidem impedit eius. Corporis hic dolor et provident nesciunt aspernatur error deserunt. Architecto voluptatibus itaque quasi id sint esse vero debitis repudiandae. Aliquid illum sit accusamus nihil quo possimus et.\n \rTempora et qui est blanditiis hic magni quo quam. Et ratione accusantium dolore perferendis. Aut cum autem rem. Doloremque nesciunt fugiat ut sint iusto consequuntur nesciunt voluptatem.\n \rEt nemo sed. Et voluptates sunt animi aspernatur est voluptatibus nulla. Reiciendis nemo officiis doloremque. Explicabo quos et voluptatum perspiciatis commodi corrupti cumque fugiat impedit. Adipisci laudantium neque cumque debitis praesentium possimus beatae quia. Assumenda pariatur recusandae.\n \rMaxime et quo occaecati voluptatem distinctio. Voluptatem atque eum possimus odio veritatis sequi et. Rerum dicta sunt velit esse ab et sit. Qui id cupiditate.\n \rTenetur magnam quibusdam facilis dolores magni aut rerum rerum. Dolorem maiores in cumque optio sit voluptas aut. Tempora odio eum.',
    companyAddress: randomAddress.address,
    province: randomAddress.province.id,
    city: randomAddress.city.id,
    district: randomAddress.district.id,
    village: randomAddress.subDistrict.id,
    industry: 'M',
    postalCode: randomAddress.postalCode,
    landLineNumber: help.randomPhoneNumber(),
    customerId: customerId
  };
  return body;
}

function assertNotSavedData (getDataNewCore, getDataBpd, bodyRequest) {
  const dateOfEstablishmentNewCore =
    getDataNewCore.body.data.advancedInfo.businessProfile.field.dateOfEstablishment;
  const companyNameNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.companyName;
  const numberOfEmployeeNewCore =
    getDataNewCore.body.data.advancedInfo.businessProfile.field.numberOfEmployee;
  const companyDescriptionNewCore =
    getDataNewCore.body.data.advancedInfo.businessProfile.field.companyDescription;
  const companyAddressNewCore =
    getDataNewCore.body.data.advancedInfo.businessProfile.field.companyAddress;
  const provinceNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.province;
  const cityNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.city;
  const districtNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.district;
  const villageNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.village;
  const industryNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.industry;
  const postalCodeNewCore = getDataNewCore.body.data.advancedInfo.businessProfile.field.postalCode;
  const landLineNumberNewCore =
    getDataNewCore.body.data.advancedInfo.businessProfile.field.landLineNumber;

  expect(bodyRequest)
    .to.have.property('dateOfEstablishment')
    .not.equal(
      dateOfEstablishmentNewCore,
      `date of establishment in new core should not ${bodyRequest.dateOfEstablishment}`
    );
  expect(bodyRequest)
    .to.have.property('companyName')
    .not.equal(
      companyNameNewCore,
      `company name in new core should not ${bodyRequest.companyName}`
    );
  expect(bodyRequest)
    .to.have.property('numberOfEmployee')
    .not.equal(
      numberOfEmployeeNewCore,
      `number of employee in new core should not ${bodyRequest.numberOfEmployee}`
    );
  expect(bodyRequest)
    .to.have.property('companyDescription')
    .not.equal(
      companyDescriptionNewCore,
      `company description in new core should not ${bodyRequest.companyDescription}`
    );
  expect(bodyRequest)
    .to.have.property('companyAddress')
    .not.equal(
      companyAddressNewCore,
      `company address in new core should not ${bodyRequest.companyAddress}`
    );
  expect(bodyRequest)
    .to.have.property('province')
    .not.equal(provinceNewCore, `province in new core should not ${bodyRequest.province}`);
  expect(bodyRequest)
    .to.have.property('city')
    .not.equal(cityNewCore, `city in new core should not ${bodyRequest.city}`);
  expect(bodyRequest)
    .to.have.property('district')
    .not.equal(districtNewCore, `district in new core should not ${bodyRequest.district}`);
  expect(bodyRequest)
    .to.have.property('village')
    .not.equal(villageNewCore, `village in new core should not ${bodyRequest.village}`);
  expect(bodyRequest)
    .to.have.property('postalCode')
    .not.equal(postalCodeNewCore, `postal code in new core should not ${bodyRequest.postalCode}`);
  expect(bodyRequest)
    .to.have.property('industry')
    .not.equal(industryNewCore, `industry in new core should not ${bodyRequest.industry}`);
  expect(bodyRequest)
    .to.have.property('landLineNumber')
    .not.equal(
      landLineNumberNewCore,
      `land line number in new core should not ${bodyRequest.landLineNumber}`
    );

  const dateOfEstablishmentLegacy = getDataBpd[0].bpd_company_year_start;
  const companyNameLegacy = getDataBpd[0].bpd_company_name;
  const numberOfEmployeeLegacy = getDataBpd[0].bpd_number_of_employees;
  const companyDescriptionLegacy = getDataBpd[0].bpd_company_desc;
  const companyAddressLegacy = getDataBpd[0].bpd_company_address;
  const provinceLegacy = getDataBpd[0].bpd_company_province_id;
  const cityLegacy = getDataBpd[0].bpd_company_kab_kot_id;
  const districtLegacy = getDataBpd[0].bpd_company_kecamatan_id;
  const subDistrictLegacy = getDataBpd[0].bpd_company_kelurahan_id;
  const postalCodeLegacy = getDataBpd[0].bpd_company_postal_code;
  const landLineNumberLegacy = getDataBpd[0].bpd_phone_number;

  expect(bodyRequest)
    .to.have.property('dateOfEstablishment')
    .not.equal(
      dateOfEstablishmentLegacy,
      `date of establishment in legacy should not ${bodyRequest.dateOfEstablishment}`
    );
  expect(bodyRequest)
    .to.have.property('companyName')
    .not.equal(companyNameLegacy, `company name in legacy should not ${bodyRequest.companyName}`);
  expect(bodyRequest)
    .to.have.property('numberOfEmployee')
    .not.equal(
      numberOfEmployeeLegacy,
      `number of employee in legacy should not ${bodyRequest.numberOfEmployee}`
    );
  expect(bodyRequest)
    .to.have.property('companyDescription')
    .not.equal(
      companyDescriptionLegacy,
      `company description in legacy should not ${bodyRequest.companyDescription}`
    );
  expect(bodyRequest)
    .to.have.property('companyAddress')
    .not.equal(
      companyAddressLegacy,
      `company address in legacy should not ${bodyRequest.companyAddress}`
    );
  expect(bodyRequest)
    .to.have.property('province')
    .not.equal(provinceLegacy, `province in legacy should not ${bodyRequest.province}`);
  expect(bodyRequest)
    .to.have.property('city')
    .not.equal(cityLegacy, `city in legacy should not ${bodyRequest.city}`);
  expect(bodyRequest)
    .to.have.property('district')
    .not.equal(districtLegacy, `district in legacy should not ${bodyRequest.district}`);
  expect(bodyRequest)
    .to.have.property('village')
    .not.equal(subDistrictLegacy, `village in legacy should not ${bodyRequest.village}`);
  expect(bodyRequest)
    .to.have.property('postalCode')
    .not.equal(postalCodeLegacy, `postal code in legacy should not ${bodyRequest.postalCode}`);
  expect(bodyRequest)
    .to.have.property('landLineNumber')
    .not.equal(
      landLineNumberLegacy,
      `land line number in legacy should not ${bodyRequest.landLineNumber}`
    );
}
