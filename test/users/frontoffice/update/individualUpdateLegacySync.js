const help = require('@lib/helper');
const request = require('@lib/request');
const db = require('@lib/dbFunction');
const report = require('@lib/report');
const expect = require('chai').expect;
const chai = require('chai');

describe('Frontoffice User Update', function () {
  const url = '/validate/users/frontoffice/update';
  const completingDataUrl = '/validate/customer/completing-data/borrower';
  const urlLogin = '/validate/users/auth/login';

  describe('#smoke', function () {
    it('Frontoffice user update should sync between new core and legacy #TC-403', async function () {
      const indRegisterRes = await request.borrowerRegister(false, ['all']);
      const indAccessToken = indRegisterRes.accessToken;

      const body = {
        divisionWithInstitution: '',
        positionWithInstitution: '',
        emailAddress: help.randomEmail(),
        salutation: help.setSalutation(),
        userCategory: '1',
        username: 'testfo' + help.randomAlphaNumeric(14)
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': indAccessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': indAccessToken
          })
        );
      const basicInfo = getDataRes.body.data.basicInfo;

      expect(res.body.meta).to.have.property('code', 200);
      expect(basicInfo.emailAddress).to.eql(body.emailAddress);
      expect(basicInfo.salutation).to.eql(body.salutation);
    });
  });

  describe('#negative', function () {
    it('Frontoffice user update should not save data if failed to sync with legacy #TC-404', async function () {
      const indRegisterRes = await request.borrowerRegister(false, ['all'], {
        salutation: 'Mr.'
      });
      const indUserName = indRegisterRes.userName;

      await db.changeEmailByUsername(indUserName);
      const loginRes = await chai
        .request(request.getSvcUrl())
        .post(urlLogin)
        .set(request.createNewCoreHeaders())
        .send({
          username: indUserName,
          password: help.getDefaultPassword(),
          flag: 1
        });
      const accessToken = loginRes.body.data.accessToken;

      const body = {
        divisionWithInstitution: '',
        positionWithInstitution: '',
        emailAddress: help.randomEmail(),
        salutation: 'Mrs.',
        userCategory: '1',
        username: 'testfo' + help.randomAlphaNumeric(14)
      };

      const startTime = await help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .put(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        )
        .send(body);
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      const getDataRes = await chai
        .request(request.getSvcUrl())
        .get(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': accessToken
          })
        );
      const basicInfo = getDataRes.body.data.basicInfo;

      expect(res.body.meta).to.have.property('code', 400);
      expect(basicInfo.emailAddress).to.not.eql(body.emailAddress);
      expect(basicInfo.salutation).to.not.eql(body.salutation);
    });
  });
});
