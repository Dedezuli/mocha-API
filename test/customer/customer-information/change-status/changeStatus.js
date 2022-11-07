/*
 *  Table involved
 *
 *  Result:
 *  - customer_role
 *    cr_status based on mgp_slug = 'mr_reg_status'
 *    1 Registered 2 Completing Data 3 Pending Verification
 *    4 Active 5 Rejected 6 Inactive
 */

require('module-alias/register');
const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');

const Promise = require('bluebird');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = require('chai').expect;

const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];
const knex = require('knex')(newcoreDbConfig);
const svcBaseUrl = request.getSvcUrl();
const apiSyncBaseUrl = request.getApiSyncUrl();

describe('Backoffice Borrower Change Status', function () {
  const url = '/validate/customer/customer-information/change-status';
  const completingDataUrl = '/validate/customer/completing-data/backoffice/borrower';
  let accessTokenBoRm;

  before(async function () {
    report.setInfo(this, `Attempting to login as ${boUser.rm.username}`);
    const loginBoRm = await request.backofficeLogin(boUser.rm.username, boUser.rm.password);
    report.setPayload(this, loginBoRm);

    report.setInfo(this, `Login as ${boUser.rm.username} succeeded`);
    accessTokenBoRm = loginBoRm.data.accessToken;
  });

  describe('#smoke', function () {
    it('Update individual borrower status to active should succeed #TC-182', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.eql('Active');
    });

    it('Update institutional borrower status to active should succeed #TC-183', async function () {
      const regRes = await request.borrowerRegister(true);
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.eql('Active');
    });

    it('Update borrower status to Rejected should succeed #TC-184', async function () {
      const regRes = await request.borrowerRegister(true);
      const customerId = regRes.customerId;

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.eql('Rejected');
    });

    it('Update individual borrower status to active should generate CIF #TC-185', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const completingDataResponse = {
        cif: getData.body.data.basicInfo.customerIdentificationNumber,
        userCategory: getData.body.data.basicInfo.userCategory.id,
        domicileCity: getData.body.data.advancedInfo.personalProfile.field.domicileCity.id
      };
      await assertCustomerIdentificationNumber(completingDataResponse, customerId);
    });

    it('Update institutional borrower status to active should generate CIF #TC-186', async function () {
      const regRes = await request.borrowerRegister(true);
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const completingDataResponse = {
        cif: getData.body.data.basicInfo.customerIdentificationNumber,
        userCategory: getData.body.data.basicInfo.userCategory.id,
        domicileCity: getData.body.data.advancedInfo.personalProfile.field.domicileCity.id
      };
      await assertCustomerIdentificationNumber(completingDataResponse, customerId);
    });

    it('Update individual borrower status to active should generate unique 4 characters borrower initial #TC-189', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const borrowerInitial = getData.body.data.basicInfo.borrowerInitial;
      expect(borrowerInitial).to.be.not.null;
      expect(borrowerInitial.length).to.eql(
        4,
        `Found initial ${borrowerInitial} (length ${borrowerInitial.length}). It should be 4`
      );
    });

    it('Update individual borrower status to active should generate borrower initial with uppercase characters #TC-190', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const borrowerInitial = getData.body.data.basicInfo.borrowerInitial;
      expect(borrowerInitial).to.be.not.null;
      expect(borrowerInitial).to.eql(
        borrowerInitial.toUpperCase(),
        `Found initial ${borrowerInitial}. It should be ${borrowerInitial.toUpperCase()}`
      );
    });

    it('Update individual borrower status to active should generate Danamon Syariah VA number #TC-191', async function () {
      const regRes = await request.borrowerRegister();
      const accessToken = regRes.accessToken;
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const va = getData.body.data.advancedInfo.bankInformation.field.va;
      let found = false;
      va.forEach((item) => {
        if (item.masterBank.name.trim() === 'BANK DANAMON SYARIAH') {
          found = true;
          expect(item.bankAccountNumber).to.be.not.null;
          expect(item.bankAccountHolder).to.be.not.null;
        }
      });

      expect(found, `No BANK DANAMON SYARIAH VA account for customerId ${customerId}`).to.be.true;
    });

    it('Update individual borrower status to active should generate Danamon Konvensional VA number #TC-192', async function () {
      const regRes = await request.borrowerRegister();
      const accessToken = regRes.accessToken;
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const va = getData.body.data.advancedInfo.bankInformation.field.va;
      va.forEach((item) => {
        if (item.masterBank.name.trim() === 'BANK DANAMON INDONESIA') {
          expect(item.bankAccountNumber).to.be.not.null;
          expect(item.bankAccountHolder).to.be.not.null;
        }
      });
    });

    it('Update individual borrower status to Rejected should not generate VA #TC-193', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const va = getData.body.data.advancedInfo.bankInformation.field.va;
      expect(va).to.be.an('array').that.is.empty;
    });

    it('Update individual borrower status to Rejected should not generate borrower initial #TC-194', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const borrowerInitial = getData.body.data.basicInfo.borrowerInitial;
      expect(borrowerInitial, 'borrowerInitial is not null').to.be.null;
    });

    it('Update individual borrower status to active should sync between new core and legacy #TC-195', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.eql('Active');

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_right_data, 'bpd_right_data should be \'Y\'').to.eql('Y');
    });

    it('Update individual borrower status to Rejected should sync between new core and legacy #TC-196', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.eql('Rejected');

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_right_data, 'bpd_right_data should be \'R\'').to.eql('R');
    });

    it('Update individual borrower status to active should sync borrower initial to legacy #TC-197', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      let borrowerInitial;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      // eslint-disable-next-line prefer-const
      borrowerInitial = getData.body.data.basicInfo.borrowerInitial;

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_company_initial, 'bpd_company_initial is null').to.eql(
        borrowerInitial
      );
    });

    it('Update individual borrower status to active should sync generated Danamon VA number to legacy #TC-198', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };
      let vaNumber;
      let vaName;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      // eslint-disable-next-line prefer-const
      vaName = getData.body.data.advancedInfo.bankInformation.field.va[0].bankAccountHolderName;
      vaNumber = getData.body.data.advancedInfo.bankInformation.field.va[0].bankAccountNumber;
      vaNumber = vaNumber.slice(4, vaNumber.length);

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(
        bpdRes.body[0].bpd_va_number,
        'bpd_va_number does not equal to VA bi_bank_account_number'
      ).to.eql(vaNumber);
      expect(
        bpdRes.body[0].bpd_va_name,
        'bpd_va_name does not equal to VA bi_bank_account_holder'
      ).to.eql(vaName);
    });

    it('Update individual borrower status to active should sync cl_id to bpd_number #TC-199', async function () {
      const regRes = await request.borrowerRegister();
      const customerId = regRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      let cifSequence;

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      // eslint-disable-next-line prefer-const
      cifSequence = getData.body.data.basicInfo.customerIdentificationNumber
        .split('.')
        .slice(-1)[0];

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_number, 'bpd_number does not equal to cl_id').to.eql(
        parseInt(cifSequence)
      );
    });
  });

  describe('#negative', function () {
    it('Should fail when update borrower status to Active using frontoffice user access token #TC-200', async function () {
      const regRes = await request.borrowerRegister(true);
      const customerId = regRes.customerId;

      const otherRegRes = await request.borrowerRegister(true);
      const otherAccessToken = otherRegRes.accessToken;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': otherAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Sequence number should not be the same for every activated user when update borrower status endpoint hit concurrently #TC-201', async function () {
      this.timeout(30000);

      const regResponses = [];
      const customerIds = [];
      const nAccounts = 5;

      for (let i = 0; i < nAccounts; i++) {
        const response = await request.borrowerRegister(true);
        regResponses.push(response);
      }
      await Promise.map(regResponses, (item) => {
        customerIds.push(item.customerId);
        const body = {
          status: 'Active',
          userType: 'Borrower'
        };
        return chai
          .request(svcBaseUrl)
          .put(`${url}/${item.customerId}`)
          .set(
            request.createNewCoreHeaders({
              'X-Investree-token': accessTokenBoRm
            })
          )
          .send(body);
      });
      const completingDataResponses = await Promise.map(customerIds, (customerId) => {
        return chai
          .request(svcBaseUrl)
          .get(`${completingDataUrl}/${customerId}`)
          .set(
            request.createNewCoreHeaders({
              'X-Investree-token': accessTokenBoRm
            })
          );
      });

      const cifs = completingDataResponses.map((res) => {
        return res.body.data.basicInfo.customerIdentificationNumber;
      });

      report.setInfo(this, cifs, 'List of Customer Identification Number created');

      const seqCounter = {};
      let sameSeqFound = false;

      cifs.forEach((cif) => {
        const seq = cif.split('.').slice(-1)[0];

        if (seq in seqCounter) {
          seqCounter[seq] += 1;
          sameSeqFound = true;
        } else {
          seqCounter[seq] = 1;
        }
      });

      expect(
        sameSeqFound,
        `Found same sequence among ${nAccounts} users. Check test case report for CIF list`
      ).to.be.false;
    });

    it('Update individual borrower status to active should not save data if failed to sync with legacy #TC-202', async function () {
      const registerRes = await request.borrowerRegister();
      const customerId = registerRes.customerId;

      await modifyEmail(
        {
          oldEmailAddress: registerRes.emailAddress,
          newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
        },
        accessTokenBoRm
      );

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.not.eql('Active');

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_right_data, 'bpd_right_data should not be \'Y\'').to.not.eql('Y');
    });

    it('Update individual borrower status to Rejected should not save data if failed to sync with legacy #TC-203', async function () {
      const registerRes = await request.borrowerRegister();
      const customerId = registerRes.customerId;

      await modifyEmail(
        {
          oldEmailAddress: registerRes.emailAddress,
          newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
        },
        accessTokenBoRm
      );

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const registrationStatus = getData.body.data.basicInfo.status;
      expect(registrationStatus.name).to.not.eql('Rejected');
      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_right_data, 'bpd_right_data should not be \'R\'').to.not.eql('R');
    });

    it('Update individual borrower status to active should not save borrower initial if failed to sync with legacy #TC-204', async function () {
      const registerRes = await request.borrowerRegister();
      const customerId = registerRes.customerId;
      let borrowerInitial;

      await modifyEmail(
        {
          oldEmailAddress: registerRes.emailAddress,
          newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
        },
        accessTokenBoRm
      );

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );

      // eslint-disable-next-line prefer-const
      borrowerInitial = getData.body.data.basicInfo.borrowerInitial;
      expect(borrowerInitial, 'ci_initial should be null').to.be.null;

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdRes.body[0].bpd_company_initial, 'bpd_company_initial should be null').to.be.null;
    });

    it('Update individual borrower status to active should not save generated Danamon VA number to legacy if failed to sync #TC-205', async function () {
      const registerRes = await request.borrowerRegister();
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      await modifyEmail(
        {
          oldEmailAddress: registerRes.emailAddress,
          newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
        },
        accessTokenBoRm
      );

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };
      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const va = getData.body.data.advancedInfo.bankInformation.field.va;
      expect(va).to.be.an('array').that.is.empty;

      const bpdData = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });
      expect(bpdData.body[0].bpd_va_number, 'bpd_va_number is not null').to.be.null;
      expect(bpdData.body[0].bpd_va_name, 'bpd_va_name is not null').to.be.null;
    });

    it('Update individual borrower status to active should not sync cl_id to bpd_number if failed to sync #TC-206', async function () {
      const registerRes = await request.borrowerRegister();
      const customerId = registerRes.customerId;

      const body = {
        status: 'Active',
        userType: 'Borrower'
      };

      await modifyEmail(
        {
          oldEmailAddress: registerRes.emailAddress,
          newEmailAddress: `test.${help.randomAlphaNumeric(12)}@investree.investree`
        },
        accessTokenBoRm
      );

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);

      const getData = await chai
        .request(svcBaseUrl)
        .get(`${completingDataUrl}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        );
      const cifSequence = getData.body.data.basicInfo.customerIdentificationNumber;
      expect(cifSequence, 'customerIdentificationNumber should be null').to.be.null;

      const bpdRes = await chai
        .request(apiSyncBaseUrl)
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          'filter[where][bpd_migration_id]': customerId
        });

      expect(bpdRes.body[0].bpd_number, 'bpd_number should be null').to.be.null;
    });

    it('Update borrower status to Rejected should not fill cr_fill_finish_at #TC-207', async function () {
      const regRes = await request.borrowerRegister(true);
      const customerId = regRes.customerId;

      const body = {
        status: 'Rejected',
        userType: 'Borrower'
      };

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .put(`${url}/${customerId}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-token': accessTokenBoRm
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

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

async function assertCustomerIdentificationNumber (completingDataResponse, customerId) {
  // CIF format:   A.B.C.MMYY.SEQ Consist of numbers containing these information:
  // A User type: 1 for borrower, 2 for lender
  // B Individual (1) or Institutional (2)
  // C Code of Domicile City
  // MMYY Registration date cr_registered_at 2019-11-04 14:03:06
  // SEQ Sequential number (based on verified date)

  const { cif, userCategory, domicileCity } = completingDataResponse;
  const [cifUserType, cifUserCategory, cifDomicileCity, cifRegisterDate] = cif.split(
    '.'
  );

  expect(cifUserCategory).to.eql(
    userCategory.toString(),
    `Found user category ${cifUserCategory}. It should be ${userCategory}`
  );
  expect(cifDomicileCity).to.eql(
    domicileCity.toString(),
    `Found domicile city ${cifDomicileCity}. It should be ${domicileCity}`
  );

  const row = await knex('customer_role')
    .select('cr_registered_at')
    .where({
      cr_ci_id: customerId,
      cr_type: parseInt(cifUserType)
    })
    .first();
  const registeredAt = new Date(Date.parse(row.cr_registered_at));
  let month = registeredAt.getMonth() + 1;
  month = month.toString();
  if (month.length < 2) {
    month = '0' + month;
  }
  const year = registeredAt.getFullYear().toString();
  const registeredDate = month + year.slice(-2);

  expect(cifRegisterDate).to.eql(
    registeredDate,
    `cr_registered_at ${row.cr_registered_at}. It should be transformed to ${registeredDate}, but got ${cifRegisterDate} instead`
  );
}

async function modifyEmail (body, accessToken) {
  const url = '/validate/users/qa/change-email';

  const res = await chai
    .request(svcBaseUrl)
    .put(url)
    .set(
      request.createNewCoreHeaders({
        'X-Investree-token': accessToken
      })
    )
    .send(body);

  return res.body;
}
