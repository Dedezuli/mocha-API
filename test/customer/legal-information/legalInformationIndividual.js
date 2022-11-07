/*
 *  Table involved
 *  Parameter:
 *  - customer_information (ci_id)
 *
 *  Result:
 *  - legal_information
 *    documentType refers to mr_document_type
 *    npwp = 4 skdu = 28
 */

const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const db = require('@lib/dbFunction');
const boUser = require('@fixtures/backoffice_user');
const request = require('@lib/request');
const expect = require('chai').expect;
const chai = require('chai');

describe('Legal Information Individual', function () {
  const loginUrl = '/validate/users/auth/login';
  const url = '/validate/customer/legal-information/borrower';
  const completingDataUrl = '/validate/customer/completing-data/borrower';

  let accessTokenIndividual;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;
  let customerIdIndividual;
  let customerIdInstitutional;

  before(async function () {
    report.setInfo(this, 'Attempting to register individual borrower');
    const registerResIndividual = await req.borrowerRegister(false, ['legal-information']);
    report.setInfo(this, registerResIndividual);

    customerIdIndividual = registerResIndividual.customerId;
    accessTokenIndividual = registerResIndividual.accessToken;
    report.setInfo(this, `Individual borrower registered with customerId ${customerIdIndividual}`);

    report.setInfo(this, 'Attempting to register institutional borrower');
    const registerResInstitutional = await req.borrowerRegister(true, ['legal-information']);
    report.setInfo(this, registerResInstitutional);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;
    report.setInfo(
      this,
      `Institutional borrower registered with customerId ${customerIdInstitutional}`
    );

    report.setInfo(this, 'Attempting to login as backoffice admin');
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    report.setInfo(this, loginBoAdminRes);

    accessTokenBoAdmin = loginBoAdminRes.data.accessToken;
    report.setInfo(this, 'Login as backoffice admin successful');
  });

  describe('#smoke', function () {
    it('Add individual legal information should succeed #TC-282', async function () {
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

    it('Add individual legal information should save the data successfully #TC-283', async function () {
      const body = generateBody(customerIdIndividual);

      const addStartTime = await help.startTime();

      const addRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        )
        .send(body);

      const addResponseTime = await help.responseTime(addStartTime);
      report.setPayload(this, addRes, addResponseTime);
      const cdStartTime = await help.startTime();
      const completingDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenIndividual
          })
        );

      const cdResponseTime = await help.responseTime(cdStartTime);
      report.setPayload(this, completingDataRes, cdResponseTime);
      expect(addRes.body.meta).to.have.property('code', 200);
    });

    it('Add individual legal information with unique NPWP number should succeed #TC-284', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: '000000000000000'
          }
        ]
      };

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

    it('Add individual legal information with SKDU alphanumeric should succeed #TC-285', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

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

    it('Add individual legal information with SKDU special characters should succeed #TC-286', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase() + '-/'
          }
        ]
      };

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

    it('Add individual legal information should sync data between new core and legacy #TC-287', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const body = generateBody(customerId);
      const startTime = await help.startTime();
      const addLegalInformationRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, addLegalInformationRes, responseTime);

      const getDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );

      const legalInfoData = getDataRes.body.data.advancedInfo.legalInformation.field;
      expect(
        legalInfoData.npwp.documentFile,
        'New Core: Legal information NPWP document file is null'
      ).to.be.not.null;
      expect(
        legalInfoData.npwp.documentNumber,
        'New Core: Legal information NPWP document number is null'
      ).to.be.not.null;
      expect(
        legalInfoData.skdu.documentFile,
        'New Core: Legal information SKDU document file is null'
      ).to.be.not.null;
      expect(
        legalInfoData.skdu.documentNumber,
        'New Core: Legal information SKDU document number is null'
      ).to.be.not.null;

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const bpdDataRes = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerId
        });
      const bpdData = JSON.parse(bpdDataRes.text);
      expect(bpdData[0].bpd_cdoc_npwp_file, 'Legacy: Legal information NPWP document file is null')
        .to.be.not.null;
      expect(bpdData[0].bpd_cdoc_npwp, 'Legacy: Legal information NPWP document number is null').to
        .be.not.null;
      expect(bpdData[0].bpd_npwp_no, 'Legacy: Legal information NPWP document number is null').to.be
        .not.null;
      expect(bpdData[0].bpd_cdoc_skdp_file, 'Legacy: Legal information SKDU file is null').to.be.not
        .null;
      expect(bpdData[0].bpd_cdoc_skdp, 'Legacy: Legal information SKDU number is null').to.be.not
        .null;
    });
  });

  describe('#negative', function () {
    it('Should succeed by replacing customerId of its true user when add individual legal information using customerId of different user #TC-288', async function () {
      const body = {
        customerId: customerIdInstitutional,
        data: [
          {
            documentType: {
              id: 28,
              name: 'skdu'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric().toUpperCase()
          }
        ]
      };

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

    it('Add individual legal information NPWP should be numeric only #TC-289', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomAlphaNumeric(15).toUpperCase()
          }
        ]
      };

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

    it('Add individual legal information NPWP below 15 digits should fail #TC-290', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomInteger(10)
          }
        ]
      };

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

    it('Add individual legal information NPWP above 15 digits should fail #TC-291', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 4,
              name: 'npwp'
            },
            documentFile: help.randomUrl(),
            documentNumber: help.randomInteger(20)
          }
        ]
      };

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
      expect(res.body.meta.message).to.eql('NPWP must be 15 digits');
    });

    it('Add individual legal information input document type other than requirement should fail #TC-292', async function () {
      const body = {
        customerId: customerIdIndividual,
        data: [
          {
            documentType: {
              id: 1,
              name: 'ktp'
            },
            documentFile: `ktp_${customerIdIndividual}_${help.randomInteger}.jpeg`,
            documentNumber: help.randomInteger(20),
            documentExpireDate: help.futureDate()
          }
        ]
      };

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
      expect(res.body.meta.message).to.eql(
        'Data not valid. Please check following field: document type'
      );
    });

    it('Should fail when add legal information if individual borrower status is active #TC-293', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
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
        .send(changeStatusBody);

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

    it('Should fail when add legal information if individual borrower status is pending verification #TC-294', async function () {
      const registerRes = await req.borrowerRegister();
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

    it('Should fail when add legal information if individual borrower status is inactive #TC-295', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const customerId = registerRes.customerId;
      const accessToken = registerRes.accessToken;

      const changeStatusBody = {
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
        .send(changeStatusBody);

      const body = generateBody(customerId);
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'x-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Add individual legal information should not save data if failed to sync with legacy #TC-296', async function () {
      const registerRes = await req.borrowerRegister(false, ['legal-information']);
      const customerId = registerRes.customerId;
      const userName = registerRes.userName;

      await db.changeEmailByUsername(userName);
      const loginBody = {
        username: userName,
        password: help.getDefaultPassword(),
        flag: 1
      };
      const loginRes = await chai
        .request(request.getSvcUrl())
        .post(loginUrl)
        .set(request.createNewCoreHeaders())
        .send(loginBody);

      const accessToken = loginRes.body.data.accessToken;
      const body = generateBody(customerId);
      const addStartTime = await help.startTime();
      const addRes = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const addResponseTime = await help.responseTime(addStartTime);
      report.setPayload(this, addRes, addResponseTime);
      const cdStartTime = await help.startTime();
      const completingDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        );
      const cdResponseTime = await help.responseTime(cdStartTime);
      report.setPayload(this, completingDataRes, cdResponseTime);

      const legalInformationData = completingDataRes.body.data.advancedInfo.legalInformation.field;
      expect(
        legalInformationData.npwp.documentFile,
        'Legal information NPWP document file is not null'
      ).to.be.null;
      expect(
        legalInformationData.npwp.documentNumber,
        'Legal information NPWP document number is not null'
      ).to.be.null;
      expect(
        legalInformationData.skdu.documentFile,
        'Legal information SKDU document file is not null'
      ).to.be.null;
      expect(
        legalInformationData.skdu.documentNumber,
        'Legal information SKDU document file is not null'
      ).to.be.null;

      const filterBpd = 'filter[where][{}]'.replace('{}', 'bpd_migration_id');
      const bpdData = await chai
        .request(request.getApiSyncUrl())
        .get('/bpd')
        .set(request.createApiSyncHeaders())
        .query({
          [filterBpd]: customerId
        })
        .then((res) => {
          return JSON.parse(res.text);
        });

      expect(
        bpdData[0].bpd_cdoc_npwp_file,
        'Legacy: Legal information NPWP document file is not null'
      ).to.be.null;
      expect(bpdData[0].bpd_cdoc_npwp, 'Legacy: Legal information NPWP document number is not null')
        .to.be.null;
      expect(bpdData[0].bpd_npwp_no, 'Legacy: Legal information NPWP document number is not null')
        .to.be.null;
      expect(bpdData[0].bpd_cdoc_siup_file, 'Legacy: Legal information SKDU file is not null').to.be
        .null;
      expect(bpdData[0].bpd_cdoc_skdp, 'Legacy: Legal information SKDU number is not null').to.be
        .null;
    });
  });
});

function generateBody (customerId) {
  const body = {
    customerId: customerId,
    data: [
      {
        documentType: {
          id: 4,
          name: 'npwp'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomInteger('NPWP')
      },
      {
        documentType: {
          id: 28,
          name: 'skdu'
        },
        documentFile: help.randomUrl(),
        documentNumber: help.randomAlphaNumeric().toUpperCase()
      }
    ]
  };

  return body;
}
