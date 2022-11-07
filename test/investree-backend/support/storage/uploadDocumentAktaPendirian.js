const boUser = require('@fixtures/backoffice_user');
const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const newcoreDbConfig = require('@root/knexfile.js')[req.getEnv()];
const doc = require('@lib/documentGen');
const fs = require('fs');
const crypto = require('crypto');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Storage Document Upload Akta Pendirian', () => {
  const beBaseUrl = req.getBackendUrl();
  const url = '/support/storage';
  const DOCUMENT_TYPE = 7;
  const DOCUMENT_TYPE_TEXT = 'Akta Pendirian';

  let customerIdInstitutional;
  let accessTokenInstitutional;
  let accessTokenBoAdmin;

  before(async function () {
    const registerResInstitutional = await req.borrowerRegister(true);
    report.setPayload(this, registerResInstitutional);

    customerIdInstitutional = registerResInstitutional.customerId;
    accessTokenInstitutional = registerResInstitutional.accessToken;

    const loginResBoAdmin = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    report.setPayload(this, loginResBoAdmin);

    expect(loginResBoAdmin.data).to.have.property('accessToken');
    accessTokenBoAdmin = loginResBoAdmin.data.accessToken;
  });

  describe('#smoke', () => {
    it('Storage upload document Akta Pendirian should contain OSS URI #TC-1031', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(
        help.isUrl(res.body.data.ossUri),
        `Found ${res.body.data.ossUri}. ossUri does not contain valid URI`
      ).to.be.true;
    });

    it('Storage upload document Akta Pendirian should not save file if same existing file exists #TC-1032', async function () {
      const knex = require('knex')(newcoreDbConfig);

      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);

      startTime = help.startTime();
      res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res.body.data).to.have.property('fileExists', true);

      let fileUuid = res.body.data.fileUuid;
      let rows = await knex('document_storage_library').select('dsl_file_uuid').where({
        dsl_file_uuid: fileUuid
      });

      expect(fileUuid).to.eql(rows[0].dsl_file_uuid, `dsl_file_uuid ${fileUuid} not found`);
      expect(rows.length).to.not.greaterThan(
        1,
        `Found ${rows.length} file(s) with same UUID of ${fileUuid}`
      );
    });

    it('Storage upload document Akta Pendirian should be saved as dsl_document_type 7 #TC-1033', async function () {
      const knex = require('knex')(newcoreDbConfig);

      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      let fileUuid = res.body.data.fileUuid;
      let row = await knex('document_storage_library')
        .select('dsl_document_type')
        .where({
          dsl_file_uuid: fileUuid
        })
        .first();
      expect(row.dsl_document_type).to.eql(
        DOCUMENT_TYPE,
        `Expected dsl_document_type of 7, but got ${row.dsl_document_type}`
      );
    });

    it('Storage upload document Akta Pendirian using backoffice user should succeed #TC-1034', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenBoAdmin
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(200);
    });

    it('Storage upload document Akta Pendirian JPG should have valid checksum #TC-1035', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('jpg', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      let ossUri = res.body.data.ossUri;
      let dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Akta Pendirian JPEG should have valid checksum #TC-1036', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('jpeg', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      let ossUri = res.body.data.ossUri;
      let dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Akta Pendirian PNG should have valid checksum #TC-1037', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      let ossUri = res.body.data.ossUri;
      let dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Akta Pendirian PDF should have valid checksum #TC-1038', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generatePdf(DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      let ossUri = res.body.data.ossUri;
      let dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });
  });

  describe('#negative', () => {
    it('Should fail when storage upload document Akta Pendirian using BMP format #TC-1039', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = await doc.generateImage('bmp', DOCUMENT_TYPE_TEXT);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(400);
    });

    it('Should fail when storage upload document Akta Pendirian using sh file #TC-1040', async function () {
      let body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      let filePath = help.getFullPath(`fixtures/scripts/hello_world.sh`);
      let splitPath = filePath.split('/');
      let fileName = splitPath[splitPath.length - 1];

      let startTime = help.startTime();
      let res = await chai
        .request(beBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-Token': accessTokenInstitutional
          })
        )
        .field({
          data: JSON.stringify(body)
        })
        .attach('file', fs.createReadStream(filePath), fileName);
      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(400);
    });
  });
});

async function assertFileChecksum(res, filePath) {
  let localChecksum = await sha256Checksum(filePath);
  let uploadedChecksum = sha256Hash(res.body);

  expect(uploadedChecksum).to.equal(
    localChecksum,
    `Uploaded file checksum does not match local file checksum`
  );
}

function sha256Hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

function sha256Checksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(filePath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}
