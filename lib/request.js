const config = require('@root/config');
const help = require('@lib/helper');
const vars = require('@fixtures/vars');
const boUser = require('@fixtures/backoffice_user');
const Promise = require('bluebird');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

async function frontofficeRegister(body) {
  let gender = help.randomGender();
  let alphaNumeric = help.randomAlphaNumeric();
  let defaultNationality = 104;
  let mergedBody = {
    salutation: help.setSalutation(gender),
    nationality: defaultNationality,
    username: alphaNumeric,
    fullname: help.randomFullName(gender).toUpperCase(),
    email: help.randomEmail(),
    password: vars.default_password,
    phoneNumber: help.randomPhoneNumber(),
    mobilePrefix: 1,
    agreeSubscribe: true,
    agreePrivacy: true,
    userType: 1,
    referralCode: '',
    captcha: help.randomAlphaNumeric(),
    ...body
  };

  return chai
    .request(getSvcUrl())
    .post('/validate/users/frontoffice/register')
    .set('X-Investree-Key', vars.header_key)
    .set('X-Investree-Token', vars.header_token)
    .set('X-Investree-Signature', vars.header_signature)
    .set('X-Investree-TimeStamp', help.timestamp())
    .set('Content-Type', 'application/json')
    .send(mergedBody);
}

/**
 * Borrower end-to-end from register until data completion
 *
 * @param {boolean} isInstitutional
 * @param {Array} exclude if needed to not fill some data completion
 *                 let exclude = [
 *                    'personal-profile',
 *                    'legal-information'
 *                 ]
 * @param {Object} body custom body on any request
 *                      On creating institutional borrower (isInstitutional = true),
 *                      fill the product selection that you want (2 or 3)
 *                      {"productSelection": integer between 2 or 3}
 *                      if you left it with empty, it will assign productSelection to 2 (default)
 *
 * @returns {Object} customerId accessToken userName emailAddress
 */
async function borrowerRegister(isInstitutional = false, exclude = [], body = null) {
  const PROD_SELECT_OSF = 1;
  const PROD_SELECT_PROJECT_FINANCING = 2;

  let customerId;
  let accessToken;
  let userName;
  let emailAddress = `test.${help.randomAlphaNumeric(15)}@investree.id`;
  let customBody = body;

  if (!customBody) {
    customBody = {
      email: emailAddress
    };
  } else if (customBody && !customBody.email) {
    customBody.email = emailAddress;
  }

  if (exclude && exclude.includes('all')) {
    exclude = [
      'personal-profile-identification',
      'personal-profile-personal-data',
      'business-profile',
      'legal-information',
      'bank-information',
      'e-statement',
      'financial-statement',
      'emergency-contact',
      'shareholders-information',
      'verify-email'
    ];
  } else if (exclude && exclude.includes('all-except-verify-email')) {
    exclude = [
      'personal-profile-identification',
      'personal-profile-personal-data',
      'business-profile',
      'legal-information',
      'bank-information',
      'e-statement',
      'financial-statement',
      'emergency-contact',
      'shareholders-information'
    ];
  }

  let registerRes = await frontofficeRegister(customBody);
  customerId = registerRes.body.data.customerId;
  accessToken = registerRes.body.data.accessToken;
  userName = registerRes.body.data.userName;

  // verify OTP
  if (!exclude.includes('verify-otp')) {
    let verifyOtpUrl = '/validate/notification/otp/verify';
    await chai
      .request(getSvcUrl())
      .post(verifyOtpUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send({
        otp: '123456'
      });
  }

  let prodPrefBody = {
    userCategory: 1,
    productPreference: 3,
    userType: 1,
    productSelection: PROD_SELECT_OSF
  };

  if (isInstitutional) {
    prodPrefBody.userCategory = 2;
    prodPrefBody.companyName = `Ins QA ${help.randomAlphaNumeric()}`;
    prodPrefBody.legalEntity = 1;
    if (customBody === null || (customBody != null && customBody.productSelection == undefined)) {
      prodPrefBody.productSelection = PROD_SELECT_PROJECT_FINANCING;
    } else {
      prodPrefBody.productSelection = customBody.productSelection;
    }
  }

  let productPreferenceUrl = '/validate/customer/customer-information/product-preference/borrower';
  await chai
    .request(getSvcUrl())
    .post(`${productPreferenceUrl}/${customerId}`)
    .set(
      createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(prodPrefBody);

  let picBody = {
    userCategory: '1',
    username: userName
  };

  if (isInstitutional) {
    picBody.userCategory = 2;
    picBody.divisionWithInstitution = 4;
    picBody.positionWithInstitution = 2;
  }

  let foUpdateUrl = '/validate/users/frontoffice/update';
  await chai
    .request(getSvcUrl())
    .put(foUpdateUrl)
    .set(
      createNewCoreHeaders({
        'X-Investree-Token': accessToken
      })
    )
    .send(picBody);

  if (exclude && !exclude.includes('personal-profile-identification')) {
    let randomAddress = help.randomAddress();
    let randomInteger = help.randomInteger(3);
    let identificationBody = {
      selfiePicture: `selfie_${customerId}_${randomInteger}.jpg`,
      idCardPicture: `id_card_${customerId}_${randomInteger}.jpg`,
      idCardNumber: help.randomInteger('KTP'),
      idCardExpiredDate: '3000-01-01',
      address: randomAddress.address,
      province: randomAddress.province.id,
      city: randomAddress.city.id,
      district: randomAddress.district.id,
      subDistrict: randomAddress.subDistrict.id,
      postalCode: randomAddress.postalCode
    };
    let personalProfileIdentificationUrl =
      '/validate/customer/personal-profile/identification/borrower';
    await chai
      .request(getSvcUrl())
      .put(personalProfileIdentificationUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(identificationBody);
  }

  if (!exclude.includes('personal-profile-personal-data')) {
    let personalDataBody = {
      placeOfBirth: 514,
      dateOfBirth: help.randomDate(2000),
      religion: 1,
      education: 3,
      occupation: 4,
      maritalStatus: 1,
      sameAsDomicileAddress: true
    };
    let personalProfilePersonalDataUrl =
      '/validate/customer/personal-profile/personal-data/borrower';
    await chai
      .request(getSvcUrl())
      .put(personalProfilePersonalDataUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(personalDataBody);
  }

  if (!exclude.includes('business-profile')) {
    let randomAddress = help.randomAddress();
    let businessProfileBody = {
      customerId: customerId,
      companyName: `Ins QA ${help.randomAlphaNumeric()}`,
      legalEntity: 1,
      industry: 'M',
      dateOfEstablishment: help.randomDate(2010),
      numberOfEmployee: help.randomInteger(3),
      companyDescription: help.randomDescription(5),
      companyAddress: randomAddress.address,
      province: randomAddress.province.id,
      city: randomAddress.city.id,
      district: randomAddress.district.id,
      village: randomAddress.subDistrict.id,
      postalCode: randomAddress.postalCode,
      landLineNumber: help.randomPhoneNumber()
    };
    if (isInstitutional == false) {
      businessProfileBody.companyName = `Ind QA ${help.randomAlphaNumeric()}`;
    }

    let businessProfileUrl = '/validate/customer/business-profile';
    await chai
      .request(getSvcUrl())
      .post(businessProfileUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(businessProfileBody);
  }

  if (!exclude.includes('legal-information')) {
    let randomInteger = help.randomInteger(3);
    let body = {
      customerId: customerId,
      data: [
        {
          documentType: {
            id: 4,
            name: 'npwp'
          },
          documentFile: `npwp_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomInteger('NPWP')
        }
      ]
    };

    if (exclude === null || !exclude.includes('skdu')) {
      let skdu = [
        {
          documentType: {
            id: 28,
            name: 'skdu'
          },
          documentFile: `skdu_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase()
        }
      ];
      body.data.push(...skdu);
    }

    if (isInstitutional) {
      let newData = [
        {
          documentType: {
            id: 5,
            name: 'siup'
          },
          documentFile: `siup_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase(),
          documentExpiredDate: help.futureDate()
        },
        {
          documentType: {
            id: 7,
            name: 'aktaPendirian'
          },
          documentFile: `akta_pendirian_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase(),
          documentExpiredDate: help.futureDate()
        },
        {
          documentType: {
            id: 9,
            name: 'aktaTerbaru'
          },
          documentFile: `akta_terbaru_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase(),
          documentExpiredDate: help.futureDate()
        },
        {
          documentType: {
            id: 8,
            name: 'skMenkumham'
          },
          documentFile: `sk_menkumham_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase(),
          documentExpiredDate: help.futureDate()
        },
        {
          documentType: {
            id: 6,
            name: 'tdp'
          },
          documentFile: `tdp_${customerId}_${randomInteger}.jpeg`,
          documentNumber: help.randomAlphaNumeric().toUpperCase(),
          documentExpiredDate: help.futureDate()
        }
      ];
      body.data.push(...newData);
    }

    let legalInfoUrl = '/validate/customer/legal-information/borrower';
    await chai
      .request(getSvcUrl())
      .post(legalInfoUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(body);
  }

  if (!exclude.includes('bank-information')) {
    let body = [
      {
        customerId: customerId,
        bankInformationId: '',
        bankType: 2,
        bankAccountCoverFile: `bank_cover_${customerId}_${help.randomInteger(3)}.jpeg`,
        masterBankId: 1,
        bankAccountNumber: help.randomInteger(10),
        bankAccountHolderName: help.randomFullName(),
        useAsDisbursement: true
      }
    ];

    let bankInfoUrl = '/validate/customer/bank-information/save-all';
    await chai
      .request(getSvcUrl())
      .put(bankInfoUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(body);
  }

  if (!exclude.includes('e-statement')) {
    // e-statement
    let bodies = [
      {
        customerId: customerId,
        statementFileType: 30,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(5)
      }
    ];

    let financialInfoUrl = '/validate/customer/financial-information/borrower';

    if (isInstitutional) {
      // minimum 6
      for (let i = 0; i < 5; i++) {
        let body = {
          customerId: customerId,
          statementFileType: 30,
          statementUrl: help.randomUrl(),
          statementFileDate: help.backDateByYear(5)
        };
        bodies.push(body);
      }
    }

    await Promise.map(bodies, async (body) => {
      await chai
        .request(getSvcUrl())
        .post(financialInfoUrl)
        .set(
          createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
    });
  }

  if (!exclude.includes('financial-statement')) {
    // financial statement
    let bodies = [
      {
        customerId: customerId,
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(5)
      }
    ];

    let financialInfoUrl = '/validate/customer/financial-information/borrower';

    if (isInstitutional) {
      // minimum 2
      let body = {
        customerId: customerId,
        statementFileType: 10,
        statementUrl: help.randomUrl(),
        statementFileDate: help.backDateByYear(5)
      };
      bodies.push(body);
    }

    await Promise.map(bodies, async (body) => {
      await chai
        .request(getSvcUrl())
        .post(financialInfoUrl)
        .set(
          createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
    });
  }

  if (!exclude.includes('emergency-contact')) {
    let gender = help.randomGender();
    let relationship = gender ? 4 : 3;
    let addr = help.randomAddress();
    let body = {
      customerId: customerId,
      relationship: relationship,
      fullName: help.randomFullName(gender).toUpperCase(),
      mobilePrefix: 1,
      mobileNumber: help.randomPhoneNumber(12),
      emailAddress: help.randomEmail(),
      address: addr.address,
      province: addr.province.id,
      city: addr.city.id,
      district: addr.district.id,
      village: addr.subDistrict.id,
      postalCode: addr.postalCode,
      identityCardUrl: help.randomUrl(),
      identityCardNumber: help.randomInteger('KTP'),
      identityExpiryDate: help.futureDate(),
      isDelete: false
    };

    let emergencyContactUrl = '/validate/customer/emergency-contact/borrower';
    await chai
      .request(getSvcUrl())
      .post(emergencyContactUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(body);
  }

  if (isInstitutional && !exclude.includes('shareholders-information')) {
    let body = {
      customerId: customerId,
      position: 5,
      fullName: help.randomFullName(),
      mobilePrefix: 1,
      mobileNumber: help.randomPhoneNumber(12),
      emailAddress: help.randomEmail(),
      stockOwnership: help.randomDecimal(),
      dob: help.randomDate(2000),
      identificationCardUrl: help.randomUrl(),
      identificationCardNumber: help.randomInteger('KTP'),
      identificationCardExpiryDate: help.futureDate(),
      selfieUrl: help.randomUrl(),
      taxCardUrl: help.randomUrl(),
      taxCardNumber: help.randomInteger('NPWP'),
      isLss: true,
      isPgs: true,
      isTss: true
    };

    let shareholderInfoUrl = '/validate/customer/shareholders-information?userRoleType=1';
    await chai
      .request(getSvcUrl())
      .post(shareholderInfoUrl)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': accessToken
        })
      )
      .send(body);
  }

  if (!exclude.includes('verify-email')) {
    const loginRes = await backofficeLogin(boUser.admin.username, help.getDefaultPassword());
    let boAccessToken = loginRes.data.accessToken;

    let bypassVerifyEmailUrl = '/validate/users/qa/verify-email';
    await chai
      .request(getSvcUrl())
      .put(`${bypassVerifyEmailUrl}/${customBody.email}`)
      .set(
        createNewCoreHeaders({
          'X-Investree-Token': boAccessToken
        })
      );
  }

  let result = {
    customerId: customerId,
    accessToken: accessToken,
    userName: userName,
    emailAddress: customBody.email
  };

  return result;
}

async function downloadFile(url) {
  url = url.split('/');
  let domain = `${url[0]}//${url[2]}`;
  let path = url.slice(3, url.length);
  path = `/${path.join('/')}`;

  const binaryParser = function (res, cb) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
      res.data += chunk;
    });
    res.on('end', function () {
      cb(null, new Buffer.from(res.data, 'binary'));
    });
  };

  return chai.request(domain).get(path).buffer().parse(binaryParser);
}

function getEnv() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  return env.includes('tribe') ? 'dev' : 'stg';
}

function getBackendUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_be;
  } else {
    baseUrl = config.url.dev_be.replace('{}', env);
  }

  return baseUrl;
}

function getSvcUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_svc;
  } else {
    baseUrl = config.url.dev_svc.replace('{}', env);
  }

  return baseUrl;
}

function getApiSyncUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stgapi_sync;
  } else {
    baseUrl = config.url.devapi_sync;
  }

  return baseUrl;
}

function getFrontendUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_fe;
  } else {
    baseUrl = config.url.dev_fe.replace('{}', env);
  }

  return baseUrl;
}

function getLegacyUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_api;
  } else {
    let cleanEnv = env.split('-').slice(-1)[0];
    baseUrl = config.url.dev_api.replace('{}', cleanEnv);
  }

  return baseUrl;
}

function getMobileApiUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_mobile;
  } else {
    baseUrl = config.url.dev_mobile.replace('{}', env);
  }

  return baseUrl;
}

function getBOLegacyUrl() {
  const env = process.env.ENV;

  if (!env) {
    throw new Error('[ERROR] no ENV environment variable.');
  }

  let baseUrl;
  if (env === 'stg') {
    baseUrl = config.url.stg_bo_legacy;
  } else {
    baseUrl = config.url.dev_bo_legacy.replace('{}', env);
  }

  return baseUrl;
}

function createNewCoreHeaders(headers) {
  return {
    'X-Investree-Key': vars.header_key,
    'X-Investree-Signature': vars.header_signature,
    'X-Investree-TimeStamp': help.timestamp(),
    'X-Investree-Token': 'ignored',
    'Content-Type': 'application/json',
    ...headers
  };
}

function createApiSyncHeaders(headers) {
  return {
    Authorization: `Basic ${vars.devapi_sync_auth}`,
    'X-Investree': `Basic ${vars.devapi_sync_key_investree}`,
    ...headers
  };
}

function createLegacyHeaders(headers) {
  return {
    'X-Investree-Key': '',
    'X-Investree-Signature': vars.header_signature,
    'X-Investree-TimeStamp': help.timestamp(),
    'Content-Type': 'application/json',
    'X-Investree-dev': 1,
    ...headers
  };
}

async function backofficeLogin(
  username = boUser.admin.username,
  password = help.getDefaultPassword()
) {
  const loginRes = await chai
    .request(getBackendUrl())
    .post('/auth/login/backoffice')
    .set(createNewCoreHeaders())
    .send({
      username: username,
      password: password
    });
  const loginToken = loginRes.body.data.loginToken;

  const verifyOtpRes = await chai
    .request(getBackendUrl())
    .post('/auth/login/backoffice/verify')
    .set(createNewCoreHeaders())
    .send({
      loginToken: loginToken,
      otp: '123456'
    });

  return verifyOtpRes.body;
}

module.exports = {
  frontofficeRegister,
  borrowerRegister,
  downloadFile,
  getEnv,
  getBackendUrl,
  getSvcUrl,
  getApiSyncUrl,
  getFrontendUrl,
  getLegacyUrl,
  getMobileApiUrl,
  getBOLegacyUrl,
  createNewCoreHeaders,
  createApiSyncHeaders,
  createLegacyHeaders,
  backofficeLogin
};
