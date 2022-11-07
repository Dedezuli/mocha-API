const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const expect = chai.expect;

describe('Master Data Bank', () => {
  const url = '/validate/master-data/banks'; 
  describe('#smoke', () => {
    it('Fetch all banks should succeed #TC-1', async function() {
      const startTime = help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .get(url)
        .set(request.createNewCoreHeaders());
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);

    });

    it('Fetch bank by id should succeed #TC-2', async function() {
      const id = 2;
      const startTime = await help.startTime();
      let res = await chai.request(request.getSvcUrl())
        .get(`${url}/${id}`)
        .set(request.createNewCoreHeaders());
      const responseTime = await help.responseTime(startTime);
      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);
    });
  });
});