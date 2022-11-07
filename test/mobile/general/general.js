const chai = require('chai');
const expect = require('chai').expect;
const help = require('@lib/helper');
const report = require('@lib/report');
const request = require('@lib/request');

describe('General Information on Mobile App', function () {
  describe('#smoke', function () {
    it('Get TKB90 on mobile app should succeed #TC-1410', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/tkb');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get App state on mobile app should succeed #TC-1411', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/app-state');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get FAQ on mobile app should succeed #TC-1412', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/faq/id');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Cities list on mobile app should succeed #TC-1413', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/cities');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Country List on mobile app should succeed #TC-1414', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/country');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get News on mobile app should succeed #TC-1415', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/news');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Occupation List on mobile app should succeed #TC-1416', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/sbn/pekerjaan');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Provinces on mobile app should succeed #TC-1417', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/provinces');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Bank List on mobile app should succeed #TC-1418', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/bank');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Districts on mobile app should succeed #TC-1419', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/districts');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Sub-Districts on mobile app should succeed #TC-1420', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/sub-districts');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get Postal code on mobile app should succeed #TC-1421', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/postal-codes');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Religion on mobile app should succeed #TC-1422', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/sbn/agama');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Education on mobile app should succeed #TC-1423', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/sbn/pendidikan');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Marital on mobile app should succeed #TC-1424', async function () {
      const startTime = help.startTime();
      const res = await chai.request(request.getMobileApiUrl()).get('/v2/general/sbn/pernikahan');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Source of income list on mobile app should succeed #TC-1425', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(request.getMobileApiUrl())
        .get('/v2/general/sbn/sumber-penghasilan');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Income level list on mobile app should succeed #TC-1426', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(request.getMobileApiUrl())
        .get('/v2/general/sbn/penghasilan-pertahun');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Get SBN Investment Objective list on mobile app should succeed #TC-1427', async function () {
      const startTime = help.startTime();
      const res = await chai
        .request(request.getMobileApiUrl())
        .get('/v2/general/sbn/tujuan-investasi');
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
  });
});
