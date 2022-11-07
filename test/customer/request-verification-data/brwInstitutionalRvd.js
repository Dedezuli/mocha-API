const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const db = require('@lib/dbFunction');
const newcoreDbConfig = require('@root/knexfile.js')[req.getEnv()];
const knex = require('knex')(newcoreDbConfig);
const boUser = require('@fixtures/backoffice_user');
const moment = require('moment');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Institutional Borrower Request Verification Data', function () {
  const rvdUrl = '/validate/customer/request-verification-data';
  const brwDataUrl = '/validate/customer/completing-data/frontoffice/borrower';
  const loginUrl = '/validate/users/auth/login';
  let boAccessToken;

  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Institutional borrower request data verification should succeed #TC-778', async function () {
      const registerRes = await req.borrowerRegister(true);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(200);
    });

    it('Institutional borrower request data verification should fail without e-statement #TC-779', async function () {
      const registerRes = await req.borrowerRegister(true, ['e-statement']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql(
        'Please provide the last 6 months of your E-statements'
      );
    });

    it('Institutional borrower request data verification should fail without financial statement #TC-780', async function () {
      const registerRes = await req.borrowerRegister(true, ['financial-statement']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql(
        'Please provide the last 2 years of your Financial Statements'
      );
    });

    it('Institutional borrower request data verification without SKDU should succeed #TC-781', async function () {
      const registerRes = await req.borrowerRegister(true, ['skdu']);
      const accessToken = registerRes.accessToken;

      const startTime = help.startTime();
      const res = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res).to.have.status(200);
    });

    it('Institutional borrower request data verification status should sync between new core and legacy #TC-783', async function () {
      const registerRes = await req.borrowerRegister(true);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const brwDataRes = await chai
        .request(req.getSvcUrl())
        .get(brwDataUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      report.setPayload(this, brwDataRes);

      const regStatus = brwDataRes.body.data.basicInfo.registrationStatus.name;
      expect(regStatus).to.eql('Pending Verification');

      const bpdRes = await chai
        .request(req.getApiSyncUrl())
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });

      const bpdData = JSON.parse(bpdRes.text);
      expect(bpdData[0].bpd_right_data, "bpd_right_data does not equal to 'D'").to.eql('D');
      expect(bpdData[0].bpd_fill_finish_date, 'bpd_fill_finish_date is null').to.be.not.null;
    });

    it('Institutional borrower request data verification should fill cr_fill_finish_at #TC-784', async function () {
      const registerRes = await req.borrowerRegister(true);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const acceptedTime = moment().local().add(1, 'm').format('YYYY-MM-DD hh:mm:ss');
      const startTime = help.startTime();
      const res = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const row = await knex
        .select('cr_fill_finish_at')
        .from('customer_role')
        .where('cr_ci_id', customerId)
        .first();

      const fillFinishAt = moment(row.cr_fill_finish_at).local().format('YYYY-MM-DD hh:mm:ss');
      const isInTimeRange = moment(fillFinishAt).isBefore(acceptedTime);
      expect(
        isInTimeRange,
        `Expected cr_fill_finish_at around ${acceptedTime}. But got ${fillFinishAt}.`
      ).to.be.true;
    });
  });

  describe('#negative', function () {
    it('Institutional borrower request data verification should fail when email is not verified #TC-785', async function () {
      const registerRes = await req.borrowerRegister(true, ['verify-email']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Email is not verified');
    });

    it('Institutional borrower request data verification should fail when data completion personal profile is empty #TC-786', async function () {
      const registerRes = await req.borrowerRegister(true, ['personal-profile-identification']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Personal Profile is not completed');
    });

    it('Institutional borrower request data verification should fail when data completion personal profile is not completed #TC-787', async function () {
      const registerRes = await req.borrowerRegister(true, [
        'personal-profile-identification',
        'personal-profile-personal-data'
      ]);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomAddress = help.randomAddress();
      const randomInteger = help.randomInteger(3);
      const body = {
        selfiePicture: `selfie_${customerId}_${randomInteger}.jpg`,
        idCardPicture: `id_card_${customerId}_${randomInteger}.jpg`,
        idCardNumber: help.randomInteger('KTP'),
        idCardExpiredDate: '3000-01-01',
        sameAsDomicileAddress: true,
        address: randomAddress.address,
        province: randomAddress.province.id,
        city: randomAddress.city.id,
        district: randomAddress.district.id,
        subDistrict: randomAddress.subDistrict.id,
        postalCode: randomAddress.postalCode,
        placeOfBirth: 514,
        dateOfBirth: help.randomDate(2000),
        religion: 1,
        education: 3,
        occupation: 4
      };

      const psnProfileUrl = '/validate/customer/personal-profile';
      await chai
        .request(req.getSvcUrl())
        .put(`${psnProfileUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Personal Profile is not completed');
    });

    it('Institutional borrower request data verification should fail when data completion business profile is empty #TC-788', async function () {
      const registerRes = await req.borrowerRegister(true, ['business-profile']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('BusinessProfile is Empty');
    });

    it('Institutional borrower request data verification should fail when data completion business profile is not completed #TC-789', async function () {
      const registerRes = await req.borrowerRegister(true, ['business-profile']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomAddress = help.randomAddress();
      const body = {
        customerId: customerId,
        companyName: 'Quality Assurance Company',
        legalEntity: 1,
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

      const businessProfileUrl = '/validate/customer/business-profile';
      await chai
        .request(req.getSvcUrl())
        .post(businessProfileUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Business Profile is not completed');
    });

    it('Institutional borrower request data verification should fail when data completion filled with 6 legal info including SKDU #TC-790', async function () {
      const registerRes = await req.borrowerRegister(true, ['legal-information']);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const randomInteger = help.randomInteger(3);
      const legalInfoBody = {
        customerId: customerId,
        data: [
          {
            documentType: {
              id: 5,
              name: 'siup'
            },
            documentFile: `siup_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpireDate: help.futureDate()
          },
          {
            documentType: {
              id: 7,
              name: 'aktaPendirian'
            },
            documentFile: `akta_pendirian_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpireDate: help.futureDate()
          },
          {
            documentType: {
              id: 9,
              name: 'aktaTerbaru'
            },
            documentFile: `akta_terbaru_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpireDate: help.futureDate()
          },
          {
            documentType: {
              id: 8,
              name: 'skMenkumham'
            },
            documentFile: `sk_menkumham_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpireDate: help.futureDate()
          },
          {
            documentType: {
              id: 6,
              name: 'tdp'
            },
            documentFile: `tdp_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase(),
            documentExpireDate: help.futureDate()
          },
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: `skdu_${customerId}_${randomInteger}.jpeg`,
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

      const legalInfoUrl = '/validate/customer/legal-information';
      await chai
        .request(req.getSvcUrl())
        .post(legalInfoUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(legalInfoBody);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('Legal Information is not completed');
    });

    it('Institutional borrower request data verification should fail when data completion bank information is empty #TC-791', async function () {
      const registerRes = await req.borrowerRegister(true, ['bank-information']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('BankInformation is Empty');
    });

    it('Institutional borrower request data verification should fail when data completion filled with 1 financial statement #TC-792', async function () {
      const registerRes = await req.borrowerRegister(true, ['financial-statement']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const finStatementBody = {
        customerId: customerId,
        statementFileType: 10,
        statementUrl: `financial_statement_${customerId}_${help.randomInteger(3)}`,
        statementFileDate: help.backDateByYear(5)
      };

      const finInfoUrl = '/validate/customer/financial-information';
      await chai
        .request(req.getSvcUrl())
        .post(finInfoUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(finStatementBody);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql(
        'Please provide the last 2 years of your Financial Statements'
      );
    });

    it('Institutional borrower request data verification should fail when data completion filled with 5 e-statement #TC-793', async function () {
      const registerRes = await req.borrowerRegister(true, ['e-statement']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      for (let i = 0; i < 4; i++) {
        const eStatementBody = {
          customerId: customerId,
          statementFileType: 30,
          statementUrl: `e-statement_${customerId}_${help.randomInteger(3)}`,
          statementFileDate: help.backDateByYear(5)
        };

        const finInfoUrl = '/validate/customer/financial-information';
        await chai
          .request(req.getSvcUrl())
          .post(finInfoUrl)
          .set(
            req.createNewCoreHeaders({
              'X-Investree-Token': accessToken
            })
          )
          .send(eStatementBody);
      }

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql(
        'Please provide the last 6 months of your E-statements'
      );
    });

    it('Institutional borrower request data verification should fail when data completion shareholders information is empty #TC-794', async function () {
      const registerRes = await req.borrowerRegister(true, ['shareholders-information']);
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
      expect(rvdRes.body.meta.message).to.eql('ShareholdersInformation is Empty');
    });

    it('Institutional borrower request data verification should fail when user is already active #TC-795', async function () {
      const registerRes = await req.borrowerRegister(true);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Active',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(req.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Institutional borrower request data verification should fail when user is inactive #TC-796', async function () {
      const registerRes = await req.borrowerRegister(true);
      const accessToken = registerRes.accessToken;
      const customerId = registerRes.customerId;

      const changeStatusBody = {
        status: 'Inactive',
        userType: 'Borrower'
      };

      const changeStatusUrl = '/validate/customer/customer-information/change-status';
      const changeStatusRes = await chai
        .request(req.getSvcUrl())
        .put(`${changeStatusUrl}/${customerId}`)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(changeStatusBody);

      report.setPayload(this, changeStatusRes);

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Institutional borrower request data verification should fail when user is already Pending Verification #TC-797', async function () {
      const registerRes = await req.borrowerRegister(true);
      const accessToken = registerRes.accessToken;

      let rvdStartTime = help.startTime();
      let rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      let rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      rvdStartTime = help.startTime();
      rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Institutional borrower request data verification should fail when OTP is not verified #TC-798', async function () {
      const registerRes = await req.borrowerRegister(true, ['verify-otp']);
      const accessToken = registerRes.accessToken;

      let rvdStartTime = help.startTime();
      let rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      let rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      rvdStartTime = help.startTime();
      rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      expect(rvdRes).to.have.status(400);
    });

    it('Institutional borrower request data verification should not update status if failed to sync with legacy #TC-799', async function () {
      const registerRes = await req.borrowerRegister(true);
      const customerId = registerRes.customerId;
      const userName = registerRes.userName;

      await db.changeEmailByUsername(userName);
      const loginRes = await chai
        .request(req.getSvcUrl())
        .post(loginUrl)
        .set(req.createNewCoreHeaders())
        .send({
          username: userName,
          password: help.getDefaultPassword(),
          flag: 1
        });
      const accessToken = loginRes.body.data.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const brwDataRes = await chai
        .request(req.getSvcUrl())
        .get(brwDataUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      report.setPayload(this, brwDataRes);

      const regStatus = brwDataRes.body.data.basicInfo.registrationStatus.name;
      expect(regStatus).to.not.eql('Pending Verification');

      const bpdRes = await chai
        .request(req.getApiSyncUrl())
        .get('/bpd')
        .set(req.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });

      const bpdData = JSON.parse(bpdRes.text);
      expect(bpdData[0].bpd_right_data, "bpd_right_data does not equal to 'D'").to.eql('D');
      expect(bpdData[0].bpd_fill_finish_date, 'bpd_fill_finish_date is not null').to.be.null;
    });

    it('Institutional borrower request data verification should not fill cr_fill_finish_at if failed #TC-800', async function () {
      const registerRes = await req.borrowerRegister(true, ['verify-email']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const rvdStartTime = help.startTime();
      const rvdRes = await chai
        .request(req.getSvcUrl())
        .put(rvdUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send({});
      const rvdResponseTime = help.responseTime(rvdStartTime);

      report.setPayload(this, rvdRes, rvdResponseTime);

      const brwDataRes = await chai
        .request(req.getSvcUrl())
        .get(brwDataUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      report.setPayload(this, brwDataRes);

      const row = await knex
        .select('cr_fill_finish_at')
        .from('customer_role')
        .where('cr_ci_id', customerId)
        .first();

      expect(
        row.cr_fill_finish_at,
        `Expected cr_fill_finish_at to be null. But got value ${row.cr_fill_finish_at}`
      ).to.be.null;
    });
  });
});
