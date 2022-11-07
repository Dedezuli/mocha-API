const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

describe('Master Data Global Param', function() {
  const url = '/validate/master-data/global-param';
  describe('#smoke', function() {
    it('Fetch global param existing slug and existing language should succeed #TC-3', async function() {
      let body = [{
        "slug": "mr_religion",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Fetch global param slug fill with upper case should succeed #TC-4', async function() {
      let body = [{
        "slug": "MR_OCCUPATION",
        "language": "ID"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Fetch global param slug fill with mixed upper case and lower case should succeed #TC-5', async function() {
      let body = [{
        "slug": "MR_countRY",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Fetch global param language fill with lower case should succeed #TC-6', async function() {
      let body = [{
        "slug": "mr_mobile_prefix",
        "language": "id"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });

    it('Fetch global param language fill with mixed upper case and lower case should succeed #TC-7', async function() {
      let body = [{
        "slug": "mr_legal_entity",
        "language": "Id"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
      .post(url)
      .set(request.createNewCoreHeaders())
      .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
    });
  });

  describe('#negative', function() {
    it('Should fail global param nonexistent slug #TC-8', async function() {
      let body = [{
        "slug": "mr_well",
        "language": "ID"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param slug fill with empty string #TC-9', async function() {
      let body = [{
        "slug": "",
        "language": "ID"
      }];
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail global param slug fill with null #TC-10', async function() {
      let body = [{
        "slug": null,
        "language": "ID"
      }];
     
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail global param slug fill with boolean #TC-11', async function() {
      let body = [{
        "slug": true,
        "language": "ID"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param slug fill with integer #TC-12', async function() {
      let body = [{
        "slug": 10,
        "language": "ID"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param slug fill with trailing whitespace #TC-13', async function() {
      let body = [{
        "slug": "        mr_occupation      ",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param slug fill with zero-width whitespace #TC-14', async function() {
      let body = [{
        "slug": "​​​​​​​​​​​​​",
        "language": "ID"
      }];
     
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param slug fill with unicode #TC-15', async function() {
      let body = [{
        "slug": "本語",
        "language": "ID"
      }];
      
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param nonexistent language #TC-16', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "HH"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param language fill with empty string #TC-17', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": ""
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail global param language fill whitespace only #TC-18', async function() {
      let body = [{
        "slug": "mr_religion",
        "language": "      "
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail global param language fill with null #TC-19', async function() {
      let body = [{
        "slug": "mr_religion",
        "language": null
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 400);
    });

    it('Should fail global param language fill with boolean #TC-20', async function() {
      let body = [{
        "slug": "mr_religion",
        "language": false
      }];
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param language fill with integer #TC-21', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": 1000
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param language fill with trailing whitespace #TC-22', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "     ID     "
      }];
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param language fill with zero-width whitespace #TC-23', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "​​​​​​​​​​​​​"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param language fill with unicode #TC-24', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "本語"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .set(request.createNewCoreHeaders())
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 404);
    });

    it('Should fail global param using get method #TC-25', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .get(url)
        .set(request.createNewCoreHeaders())
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 405);
    });

    it('Should fail global param using put method #TC-26', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .put(url)
        .set(request.createNewCoreHeaders())
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 405);
    });

    it('Should fail global param send request without header #TC-27', async function() {
      let body = [{
        "slug": "mr_occupation",
        "language": "ID"
      }];

      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .post(url)
        .send(body);
      const responseTime = await help.responseTime(startTime);
      
      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('statusCode', 400);
    });
  });
});