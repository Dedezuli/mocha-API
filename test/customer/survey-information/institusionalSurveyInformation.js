const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const db = require('@lib/dbFunction');

const svcBaseUrl = req.getSvcUrl();
const apiSyncBaseUrl = req.getApiSyncUrl();

const boUserId = parseInt(boUser.admin.id, 10);

describe('survey information for institusional borrower', function () {
  const surveyUrl = '/validate/customer/survey-information';
  let customerId;
  let negCaseSurveyId;
  let negCaseBody;
  let getNewcoreUrl;
  let accessToken;

  before(async function () {
    report.setInfo(this, 'Attempting to login as backoffice admin');
    const loginBoAdminRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);

    expect(loginBoAdminRes.status).to.eql('OK', 'failed to login backoffice');
    accessToken = loginBoAdminRes.data.accessToken;
    report.setInfo(this, 'Login as backoffice admin successful');
  });

  describe('#smoke', function () {
    beforeEach(async function () {
      report.setInfo(this, 'Attempting to register individual borrower');
      const registerResIndividual = await req.borrowerRegister(true);
      report.setInfo(this, registerResIndividual);

      expect(registerResIndividual.accessToken).to.not.eql(
        null,
        'failed to regist new individual borrower'
      );

      customerId = registerResIndividual.customerId;
      getNewcoreUrl = `/validate/customer/completing-data/backoffice/borrower/${customerId}`;
      report.setInfo(this, `succsessfully register new borrower with customer id ${customerId}`);
    });

    it('when adding new survey information, the data should be syncronize between legacy and newcore #TC-451', async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId);
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      report.setPayload(this, res);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId = JSON.parse(res.text).data[0].surveyInformationId;
      report.setInfo(this, `successfully add new survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );

      await assertDataInNewCore(body, getNewcoreData);
      report.setInfo(this, 'newcore survey data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(body, getNewcoreData);
      report.setInfo(this, 'legacy survey data sync successfully');
    });

    it('when editing survey information, the data should be syncronize between legacy and newcore #TC-452', async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId);
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId = res.body.data[0].surveyInformationId;
      report.setInfo(this, `successfully add survey with id ${surveyId}`);

      report.setInfo(this, `edit survey with id ${surveyId}`);
      const editBody = generateBody(
        customerId,
        true,
        generateSurveyData(help.backDateByDays(1), surveyId)
      );
      const editRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(editBody);
      report.setPayload(this, editRes);

      expect(editRes.body.status).to.eql('OK', `failed edit survey with survey id ${surveyId}`);
      report.setInfo(this, `successfully edit survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(editBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(editBody, getNewcoreData);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it('legacy data should be update with the new survey, when new survey has latest survey date than current survey #TC-453', async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId);
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      report.setInfo(
        this,
        `successfully add survey with id ${res.body.data[0].surveyInformationId}`
      );

      report.setInfo(this, 'add another survey');
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const newBody = generateBodyUpdate(dataNC, generateSurveyData(help.backDateByDays(1)));
      const addNewRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(newBody);
      report.setPayload(this, addNewRes);

      expect(addNewRes.body.status).to.eql('OK', 'failed add another survey with survey id');
      const surveyId = addNewRes.body.data[addNewRes.body.data.length - 1].surveyInformationId;
      report.setInfo(this, `successfully add another survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(newBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(newBody, getNewcoreData, surveyId);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it("legacy data shouldn't be update with the new survey, when new survey has older survey date than current survey #TC-454", async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId);
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      report.setInfo(
        this,
        `successfully add survey with id ${res.body.data[0].surveyInformationId}`
      );

      report.setInfo(this, 'add another survey');
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const newBody = generateBodyUpdate(dataNC, generateSurveyData(help.backDateByDays(10)));
      const addNewRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(newBody);
      report.setPayload(this, addNewRes);

      expect(addNewRes.body.status).to.eql('OK', 'failed add another survey with survey id');
      const surveyId = addNewRes.body.data[addNewRes.body.data.length - 2].surveyInformationId;
      report.setInfo(this, `successfully add another survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(newBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(newBody, getNewcoreData, surveyId);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it('legacy data should update survey with the latest updated, if two survey has same survey date #TC-455', async function () {
      report.setInfo(this, 'add 2 new survey with same surveyAt');
      const body = generateBody(customerId, false, generateSurveyData(help.backDateByDays(2)));
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId = res.body.data[0].surveyInformationId;
      report.setInfo(
        this,
        `successfully add survey with id ${surveyId} and ${res.body.data[1].surveyInformationId}`
      );

      report.setInfo(this, `edit survey with id ${customerId}`);
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const updateBody = generateBodyUpdate(dataNC);
      updateBody.data[0].resultDescription = 'edited';
      const editBody = generateBody(customerId, true, updateBody.data[0]);

      await help.sleep(1000);
      const addNewRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(editBody);
      report.setPayload(this, addNewRes);

      expect(addNewRes.body.status).to.eql('OK', `failed edit survey with id ${customerId}`);
      report.setInfo(this, `successfully edit survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(updateBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(updateBody, getNewcoreData, surveyId);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it('legacy data should update survey with the newer survey id, if two survey has same survey date, and same update at #TC-456', async function () {
      report.setInfo(this, 'add 2 new survey with same survey date');
      const body = generateBody(customerId, false, generateSurveyData(help.backDateByDays(2)));
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId1 = res.body.data[0].surveyInformationId;
      const surveyId2 = res.body.data[1].surveyInformationId;
      report.setInfo(this, `successfully add survey with id ${surveyId1} and ${surveyId2}`);

      report.setInfo(this, 'edit both survey');
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const editBody = generateBodyUpdate(dataNC);
      editBody.data[0].resultDescription = 'edited';
      editBody.data[1].resultDescription = 'edited';
      const addNewRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(editBody);
      report.setPayload(this, addNewRes);

      expect(addNewRes.body.status).to.eql('OK', 'failed add another survey with survey id');
      report.setInfo(this, 'successfully edit both survey');

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(editBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(editBody, getNewcoreData, surveyId2);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it('when deleting a survey the second lateast survey should be updated to legacy survey data #TC-457', async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId, false, generateSurveyData());
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId1 = res.body.data[0].surveyInformationId;
      const surveyId2 = res.body.data[1].surveyInformationId;
      report.setInfo(this, `successfully add survey with id ${surveyId1} and ${surveyId2}`);

      report.setInfo(this, `delete survey id ${surveyId2}`);
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const deleteBody = generateBodyUpdate(dataNC, null, surveyId2);
      const deleteRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(deleteBody);
      report.setPayload(this, deleteRes);

      expect(deleteRes.body.status).to.eql('OK', 'failed add another survey with survey id');
      deleteBody.data.pop();
      report.setInfo(this, `successfully delete survey with id ${surveyId2}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(deleteBody, getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(deleteBody, getNewcoreData);
      report.setInfo(this, 'legacy data sync successfully');
    });

    it('when deleting all of the survey, the survey data in both of legacy and newcore survey data should be replace with empty string #TC-458', async function () {
      report.setInfo(this, 'add new survey');
      const body = generateBody(customerId);
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);

      expect(res.body.status).to.eql('OK', `failed to add survey to borrower id ${customerId}`);
      const surveyId = res.body.data[0].surveyInformationId;
      report.setInfo(this, `successfully add survey with id ${surveyId}`);

      report.setInfo(this, `delete survey id ${surveyId}`);
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const deleteBody = generateBodyUpdate(dataNC, null, surveyId, true);
      const deleteRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(deleteBody);
      report.setPayload(this, deleteRes);

      expect(deleteRes.body.status).to.eql('OK', 'failed add another survey with survey id');
      report.setInfo(this, `successfully delete survey with id ${surveyId}`);

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDelateAllDataInNewCore(getNewcoreData);
      report.setInfo(this, 'newcore data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDelateAllDataInLegacy(customerId, surveyId);
      report.setInfo(this, 'legacy data sync successfully');
    });
  });

  describe('#negative', function () {
    before(async function () {
      report.setInfo(this, 'Attempting to register individual borrower');
      const registerResIndividual = await req.borrowerRegister(false);
      report.setInfo(this, registerResIndividual);

      expect(registerResIndividual.accessToken).to.not.eql(
        null,
        'failed to regist new individual borrower'
      );

      const username = registerResIndividual.userName;
      customerId = registerResIndividual.customerId;
      getNewcoreUrl = `/validate/customer/completing-data/backoffice/borrower/${customerId}`;
      report.setInfo(this, `succsessfully register new borrower with customer id ${customerId}`);

      report.setInfo(this, `atempting to prefill survey for borrower id ${customerId}`);
      negCaseBody = generateBody(customerId);
      const preFillSurveyRes = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(negCaseBody);

      expect(preFillSurveyRes.body.status).to.eql(
        'OK',
        `failed to add survey for borrower id ${customerId}`
      );
      negCaseSurveyId = preFillSurveyRes.body.data[0].surveyInformationId;
      report.setInfo(this, 'successfully prefill borrower survey');

      report.setInfo(
        this,
        `atempting to change borrower email to be @invetree.investree for borrower customer id ${customerId}`
      );
      await db.changeEmailByUsername(username);
      report.setInfo(this, 'successfully change borrower email');
    });

    it('adding survey information should fail when the data failed to sync withlegacy #TC-459', async function () {
      const dataNC = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      const body = generateBodyUpdate(dataNC, generateSurveyData());
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      report.setPayload(this, res);

      expect(res.body.status).to.eql(
        'ERROR',
        `add survey should fail for borrower id ${customerId}`
      );
      body.data.pop();

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(body, getNewcoreData);
      report.setInfo(this, 'newcore survey data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(body, getNewcoreData);
      report.setInfo(this, 'legacy survey data sync successfully');
    });

    it('editing survey information should fail when the data failed to sync withlegacy #TC-460', async function () {
      const body = generateBody(
        customerId,
        true,
        generateSurveyData(help.backDateByDays(1), negCaseSurveyId)
      );
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      report.setPayload(this, res);

      expect(res.body.status).to.eql(
        'ERROR',
        `add survey should fail for borrower id ${customerId}`
      );

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(negCaseBody, getNewcoreData);
      report.setInfo(this, 'newcore survey data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(negCaseBody, getNewcoreData);
      report.setInfo(this, 'legacy survey data sync successfully');
    });

    it('delete survey information should fail when the data failed to sync withlegacy #TC-461', async function () {
      const body = generateBody(
        customerId,
        true,
        generateSurveyData(help.backDateByDays(1), negCaseSurveyId, true)
      );
      const res = await chai
        .request(svcBaseUrl)
        .post(surveyUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        )
        .send(body);
      report.setPayload(this, res);

      expect(res.body.status).to.eql(
        'ERROR',
        `add survey should fail for borrower id ${customerId}`
      );

      report.setInfo(this, 'get newcore data');
      const getNewcoreData = await chai
        .request(svcBaseUrl)
        .get(getNewcoreUrl)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': accessToken
          })
        );
      await assertDataInNewCore(negCaseBody, getNewcoreData);
      report.setInfo(this, 'newcore survey data sync successfully');

      report.setInfo(this, 'get legacy data');
      await assertDataInLegacy(negCaseBody, getNewcoreData);
      report.setInfo(this, 'legacy survey data sync successfully');
    });
  });
});

/**
 *  to produce surveys that are ready to be sent as request bodies
 * @param {number} customerId
 * @param {boolean} replace
 * @param {object} data
 */
function generateBody (customerId, replace = false, data = null) {
  const body = {
    customerId: customerId,
    data: [
      {
        surveyBy: boUserId,
        surveyAt: help.backDateByDays(2),
        borrowerPosition: 1,
        borrowerName: 'QA BORROWER',
        numberOfEmployee: 13,
        officeStatus: 2,
        lengthOfStay: '13',
        filename: [
          'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/survey_file/survey_file_MQ==_1_1579606371907.png'
        ],
        resultDescription: help.randomAlphaNumeric(15),
        address: `JL.${help.randomAlphaNumeric(5)}`,
        isDelete: false,
        surveyInformationId: null
      }
    ]
  };

  if (data == null && replace === false) {
    return body;
  } else if (data !== null && replace === true) {
    body.data[0] = data;
    return body;
  } else if (data !== null && replace === false) {
    body.data.push(data);
    return body;
  } else {
    body.data.push(generateSurveyData());
    return body;
  }
}

/**
 *  to generate survey data consumption generateBody () and generateBodyUpdate ()
 * @param {string} surveyAt
 * @param {number} surveyInformationId
 * @param {boolean} isDelete
 */
function generateSurveyData (
  surveyAt = help.backDateByDays(1),
  surveyInformationId = null,
  isDelete = false
) {
  const data = {
    surveyBy: boUserId,
    surveyAt: surveyAt,
    borrowerPosition: 2,
    borrowerName: 'BORROWER QA',
    numberOfEmployee: 15,
    officeStatus: 3,
    lengthOfStay: '15',
    filename: [
      'https://inv-dev-test.oss-ap-southeast-5.aliyuncs.com/survey_file/survey_file_MQ==_1_1579606371907.png'
    ],
    resultDescription: help.randomAlphaNumeric(15),
    address: `JL.${help.randomAlphaNumeric(5)}`,
    isDelete: isDelete,
    surveyInformationId: surveyInformationId
  };
  return data;
}

/**
 * to produce all survey for certain borrower that are ready to be sent as request bodies
 * @param {object} getData
 * @param {object} additionalData
 * @param {number} deleteId
 * @param {boolean} deleteAll
 */
function generateBodyUpdate (getData, additionalData = null, deleteId = null, deleteAll = false) {
  const dataSurvey = getData.body.data.advancedInfo.surveyInformation.field;
  const id = getData.body.data.basicInfo.customerId;
  const body = generateBody(id);
  body.data = [];

  for (let i = 0; i < dataSurvey.length; i++) {
    const data = {
      surveyBy: dataSurvey[i].surveyBy,
      surveyAt: dataSurvey[i].surveyAt,
      borrowerPosition: dataSurvey[i].borrowerPosition.id,
      borrowerName: dataSurvey[i].borrowerName,
      numberOfEmployee: dataSurvey[i].numberOfEmployee,
      officeStatus: dataSurvey[i].officeStatus.id,
      lengthOfStay: dataSurvey[i].lengthOfStay,
      filename: dataSurvey[i].filename,
      resultDescription: dataSurvey[i].resultDescription,
      address: dataSurvey[i].address,
      isDelete: false,
      surveyInformationId: dataSurvey[i].surveyInformationId
    };
    body.data.push(data);
  }

  if (deleteId !== null) {
    const index = getData.body.data.advancedInfo.surveyInformation.field
      .map(function (e) {
        return e.surveyInformationId;
      })
      .indexOf(deleteId);
    body.data[index].isDelete = true;
  }

  if (deleteAll === true) {
    const deleteData = {
      surveyBy: '',
      surveyAt: '',
      borrowerPosition: '',
      borrowerName: '',
      numberOfEmployee: '',
      officeStatus: '',
      lengthOfStay: null,
      filename: [],
      resultDescription: '',
      address: '',
      isDelete: false,
      surveyInformationId: null
    };
    body.data.push(deleteData);
  }

  if (additionalData == null) {
    return body;
  } else {
    body.data.push(additionalData);
    return body;
  }
}

function assertDataInNewCore (requestBody, newcoreData) {
  const newcoreSurvey = newcoreData.body.data.advancedInfo.surveyInformation.field;
  const requestData = requestBody.data;

  expect(newcoreSurvey.length).to.eql(requestData.length);

  for (let i = 0; i < newcoreSurvey.length; i++) {
    expect(newcoreSurvey[i].surveyBy).to.eql(
      boUserId,
      `surveyBy in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${boUserId}`
    );
    expect(newcoreSurvey[i].surveyAt).to.eql(
      requestData[i].surveyAt,
      `surveyAt in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].surveyAt}`
    );
    expect(newcoreSurvey[i].borrowerPosition.id).to.eql(
      requestData[i].borrowerPosition,
      `borrowerPosition.id in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].borrowerPosition}`
    );
    expect(newcoreSurvey[i].borrowerName).to.eql(
      requestData[i].borrowerName,
      `surveyBy in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].borrowerName}`
    );
    expect(newcoreSurvey[i].numberOfEmployee).to.eql(
      requestData[i].numberOfEmployee,
      `numberOfEmployee in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].numberOfEmployee}`
    );
    expect(newcoreSurvey[i].officeStatus.id).to.eql(
      requestData[i].officeStatus,
      `officeStatus in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].officeStatus}`
    );
    expect(newcoreSurvey[i].lengthOfStay).to.eql(
      requestData[i].lengthOfStay,
      `lengthOfStay in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].lengthOfStay}`
    );
    expect(newcoreSurvey[i].filename[0]).to.eql(
      requestData[i].filename[0],
      `filename in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].filename[0]}`
    );
    expect(newcoreSurvey[i].resultDescription).to.eql(
      requestData[i].resultDescription,
      `surveyBy in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].resultDescription}`
    );
    expect(newcoreSurvey[i].address).to.eql(
      requestData[i].address,
      `resultDescription in newcoreData.body.data.advancedInfo.surveyInformation.field[${i}] should equal to ${requestData[i].address}`
    );

    if (requestData[i].surveyInformationId == null) {
      expect(newcoreSurvey[i].surveyInformationId).to.not.eql(
        null,
        `resultDescription in ${newcoreSurvey[i].surveyInformationId} should not equal null`
      );
    } else {
      expect(newcoreSurvey[i].surveyInformationId).to.eql(
        requestData[i].surveyInformationId,
        `resultDescription in newcoreSurvey[${i}].surveyInformationId should equal tonull ${requestData[i].surveyInformationId}`
      );
    }
  }
}

function assertDelateAllDataInNewCore (newcoreData) {
  const newcoreSurvey = newcoreData.body.data.advancedInfo.surveyInformation.field[0];
  expect(newcoreData.body.data.advancedInfo.surveyInformation.field.length).to.eql(1);
  expect(newcoreSurvey.surveyBy).to.eql(
    null,
    'surveyBy in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.surveyAt).to.eql(
    null,
    'surveyAt in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.borrowerPosition).to.eql(
    null,
    'borrowerPosition in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.borrowerName).to.eql(
    null,
    'borrowerName in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.numberOfEmployee).to.eql(
    null,
    'numberOfEmployee in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.officeStatus).to.eql(
    null,
    'officeStatus in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.lengthOfStay).to.eql(
    null,
    'lengthOfStay in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.filename[0]).to.eql(
    '',
    'filename in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal empty string'
  );
  expect(newcoreSurvey.resultDescription).to.eql(
    null,
    'resultDescription in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.address).to.eql(
    null,
    'address in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
  expect(newcoreSurvey.surveyInformationId).to.not.eql(
    null,
    'surveyInformationId in newcoreData.body.data.advancedInfo.surveyInformation.field[0] should equal null'
  );
}

async function assertDataInLegacy (requestBody, newcoreData, surveyId = null) {
  let index;

  if (surveyId == null) {
    index = 0;
  } else {
    index = newcoreData.body.data.advancedInfo.surveyInformation.field
      .map(function (e) {
        return e.surveyInformationId;
      })
      .indexOf(surveyId);
  }

  const newcoreSurvey = newcoreData.body.data.advancedInfo.surveyInformation.field[index];
  const requestData = requestBody.data[index];
  const getDataLegacy = await chai
    .request(apiSyncBaseUrl)
    .get('/bcsd')
    .set(req.createApiSyncHeaders())
    .query({
      'filter[where][bcsd_migration_id]': requestBody.customerId
    });

  expect(getDataLegacy.body[0].bcsdId).to.not.eql(
    null,
    'bcsdId in getDataLegacy should not equal null'
  );
  expect(getDataLegacy.body[0].bcsd_bpd_id).to.not.eql(
    null,
    'bcsd_bpd_id in getDataLegacy should not equal null'
  );
  expect(getDataLegacy.body[0].bcsd_migration_lookup_id).to.eql(
    newcoreSurvey.surveyInformationId,
    `bcsd_migration_lookup_id in getDataLegacy should equal ${newcoreSurvey.surveyInformationId}`
  );
  expect(getDataLegacy.body[0].bcsd_migration_id).to.eql(
    requestBody.customerId,
    `bcsd_migration_id in getDataLegacy should equal ${requestBody.customerId}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_date).to.include(
    requestData.surveyAt,
    `bcsd_survey_date in getDataLegacy should equal ${requestData.surveyAt}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_note).to.eql(
    requestData.resultDescription,
    `bcsd_survey_note in getDataLegacy should equal ${requestData.resultDescription}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_location).to.eql(
    requestData.address,
    `bcsd_survey_location in getDataLegacy should equal ${requestData.address}`
  );
  expect(getDataLegacy.body[0].bcsd_borrower_pic_position).to.eql(
    newcoreSurvey.borrowerPosition.name,
    `bcsd_borrower_pic_position in getDataLegacy should equal ${newcoreSurvey.borrowerPosition.name}`
  );
  expect(getDataLegacy.body[0].bcsd_borrower_pic).to.eql(
    requestData.borrowerName,
    `bcsd_borrower_pic in getDataLegacy should equal ${requestData.borrowerName}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_status).to.eql(
    newcoreSurvey.officeStatus.name,
    `bcsd_survey_office_status in getDataLegacy should equal ${newcoreSurvey.officeStatus.name}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_status_id).to.eql(
    requestData.officeStatus,
    `bcsd_survey_office_status in getDataLegacy should equal ${requestData.officeStatus}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_stay_length).to.eql(
    requestData.lengthOfStay,
    `bcsd_survey_office_stay_length in getDataLegacy should equal ${requestData.lengthOfStay}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_file).to.eql(
    `${requestData.filename[0]}`,
    `bcsd_survey_file in getDataLegacy should equal ${requestData.filename[0]}`
  );
  expect(getDataLegacy.body[0].bcsd_created_date).to.contain(
    help.backDateByDays(0),
    `bcsd_created_date in getDataLegacy should contain ${help.backDateByDays(0)}`
  );
  if (getDataLegacy.body[0].bcsd_latest_updated !== null) {
    expect(getDataLegacy.body[0].bcsd_latest_updated).to.be.contain(
      help.backDateByDays(0),
      `bcsd_latest_updated in getDataLegacy should equal ${help.backDateByDays(0)}`
    );
  }
}

async function assertDelateAllDataInLegacy (customerId, deleteSurveyId) {
  const getDataLegacy = await chai
    .request(apiSyncBaseUrl)
    .get('/bcsd')
    .set(req.createApiSyncHeaders())
    .query({
      'filter[where][bcsd_migration_id]': customerId
    });
  expect(getDataLegacy.body[0].bcsdId).to.not.eql(
    null,
    'bcsdId in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_bpd_id).to.not.eql(
    null,
    'bcsd_bpd_id in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_migration_lookup_id).to.not.eql(
    deleteSurveyId,
    `bcsd_migration_lookup_id in getDataLegacy should not equal ${deleteSurveyId}`
  );
  expect(getDataLegacy.body[0].bcsd_migration_id).to.eql(
    customerId,
    `bcsd_migration_id in getDataLegacy should equal ${customerId}`
  );
  expect(getDataLegacy.body[0].bcsd_survey_date).to.eql(
    null,
    'bcsd_survey_date in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_staff).to.eql(
    null,
    'bcsd_survey_staff in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_note).to.eql(
    null,
    'bcsd_survey_note in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_location).to.eql(
    null,
    'bcsd_survey_location in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_borrower_pic_position).to.eql(
    null,
    'bcsd_borrower_pic_position in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_borrower_pic).to.eql(
    null,
    'bcsd_borrower_pic in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_status).to.eql(
    null,
    'bcsd_survey_office_status in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_status_id).to.eql(
    null,
    'bcsd_survey_office_status_id in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_office_stay_length).to.eql(
    null,
    'bcsd_survey_office_stay_length in getDataLegacy should equal null'
  );
  expect(getDataLegacy.body[0].bcsd_survey_file).to.eql(
    null,
    'bcsd_survey_file in getDataLegacy should equal empty string'
  );
  expect(getDataLegacy.body[0].bcsd_created_date).to.contain(
    help.backDateByDays(0),
    `bcsd_created_date in getDataLegacy should equal ${help.backDateByDays(0)}`
  );
  expect(getDataLegacy.body[0].bcsd_latest_updated).to.be.eql(
    null,
    'bcsd_latest_updated in getDataLegacy should equal null'
  );
}
