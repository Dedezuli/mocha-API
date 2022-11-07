const boUser = require('@fixtures/backoffice_user');
const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const newcoreDbConfig = require('@root/knexfile.js')[req.getEnv()];
const svcBaseUrl = req.getSvcUrl();
const doc = require('@lib/documentGen');
const fs = require('fs');
const crypto = require('crypto');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Storage Document Upload Tanda Daftar Perusahaan', function () {
  const url = '/validate/storage/documentstorage/uploaddocument';
  const DOCUMENT_TYPE = 6;
  const DOCUMENT_TYPE_TEXT = 'Tanda Daftar Perusahaan';

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

  describe('#smoke', function () {
    it('Storage upload document Tanda Daftar Perusahaan should contain OSS URI #TC-984', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(
        help.isUrl(res.body.data.ossUri),
        `Found ${res.body.data.ossUri}. ossUri does not contain valid URI`
      ).to.be.true;
    });

    it('Storage upload document Tanda Daftar Perusahaan should not save file if same existing file exists #TC-985', async function () {
      const knex = require('knex')(newcoreDbConfig);

      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      report.setInfo(this, 'Upload first file');
      let startTime = help.startTime();
      let res = await chai
        .request(svcBaseUrl)
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

      report.setInfo(this, 'Upload second file');
      startTime = help.startTime();
      res = await chai
        .request(svcBaseUrl)
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

      const fileUuid = res.body.data.fileUuid;
      const rows = await knex('document_storage_library').select('dsl_file_uuid').where({
        dsl_file_uuid: fileUuid
      });

      expect(fileUuid).to.eql(rows[0].dsl_file_uuid, `dsl_file_uuid ${fileUuid} not found`);
      expect(rows.length).to.not.greaterThan(
        1,
        `Found ${rows.length} file(s) with same UUID of ${fileUuid}`
      );
    });

    it('Storage upload document Tanda Daftar Perusahaan should be saved as dsl_document_type 6 #TC-986', async function () {
      const knex = require('knex')(newcoreDbConfig);

      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      const fileUuid = res.body.data.fileUuid;
      const row = await knex('document_storage_library')
        .select('dsl_document_type')
        .where({
          dsl_file_uuid: fileUuid
        })
        .first();

      expect(row.dsl_document_type).to.eql(
        DOCUMENT_TYPE,
        `Expected dsl_document_type of 6, but got ${row.dsl_document_type}`
      );
    });

    it('Storage upload document Tanda Daftar Perusahaan using backoffice user should succeed #TC-987', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(200);
    });

    it('Storage upload document Tanda Daftar Perusahaan JPG should have valid checksum #TC-988', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('jpg', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      const ossUri = res.body.data.ossUri;
      const dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Tanda Daftar Perusahaan JPEG should have valid checksum #TC-989', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('jpeg', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      const ossUri = res.body.data.ossUri;
      const dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Tanda Daftar Perusahaan PNG should have valid checksum #TC-990', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('png', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      const ossUri = res.body.data.ossUri;
      const dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });

    it('Storage upload document Tanda Daftar Perusahaan PDF should have valid checksum #TC-991', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generatePdf(DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      const ossUri = res.body.data.ossUri;
      const dlRes = await req.downloadFile(ossUri);

      await assertFileChecksum(dlRes, filePath);
    });
  });

  describe('#negative', function () {
    it('Should fail when storage upload document Tanda Daftar Perusahaan using BMP format #TC-992', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = await doc.generateImage('bmp', DOCUMENT_TYPE_TEXT);
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(400);
    });

    it('Should fail when storage upload document Tanda Daftar Perusahaan using sh file #TC-993', async function () {
      const body = {
        documentType: DOCUMENT_TYPE,
        userId: customerIdInstitutional,
        createdBy: customerIdInstitutional
      };

      const filePath = help.getFullPath('fixtures/scripts/hello_world.sh');
      const splitPath = filePath.split('/');
      const fileName = splitPath[splitPath.length - 1];

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
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
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.attachFile(this, filePath);

      expect(res).to.have.status(400);
    });
  });
});

async function assertFileChecksum (res, filePath) {
  const localChecksum = await sha256Checksum(filePath);
  const uploadedChecksum = sha256Hash(res.body);

  expect(uploadedChecksum).to.equal(
    localChecksum,
    'Uploaded file checksum does not match local file checksum'
  );
}

function sha256Hash (string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

function sha256Checksum (filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(filePath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}
