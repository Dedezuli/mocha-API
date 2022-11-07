const help = require('@lib/helper');
const report = require('@lib/report');
const moment = require('moment');
const faker = require('faker');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const request = require('@lib/request');
const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];

describe('Integration MBIZ Basic Registration', () => {
  const url = '/validate/integration/mbiz/basic-registration';

  let boAccessToken;
  before(async function () {
    const boLoginRes = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', () => {
    it('MBIZ basic registration should succeed #TC-555', async function () {
      let body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);

      let customerId = res.body.data.customer_id;
      let loginDataId;

      const newcoreDb = require('knex')(newcoreDbConfig);
      let rowLd = await newcoreDb('login_data')
        .select()
        .where({
          ld_email_address: body.bpd_email_address
        })
        .first();
      expect(rowLd.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(rowLd.ld_gender).to.eql(body.rd_gender, 'ld_gender');
      expect(rowLd.ld_salutation).to.eql(
        body.rd_salutation,
        'newcore.ld_salutation legacy.rd_salutation'
      );
      expect(rowLd.ld_fullname).to.eql(body.rd_full_name, 'ld_fullname');
      expect(rowLd.ld_email_address).to.eql(
        body.rd_email_address,
        'newcore.ld_email_address legacy.rd_email_address'
      );
      expect(rowLd.ld_no_hp).to.eql(
        body.rd_mobile_number,
        'newcore.ld_no_hp legacy.rd_mobile_number'
      );
      expect(rowLd.ld_gender).to.eql(body.bpd_gender, 'ld_gender');
      expect(rowLd.ld_password).to.eql(body.rd_upasswd, 'newcore.ld_password legacy.rd_upasswd');
      expect(rowLd.ld_agree_subscribe).to.eql(body.rd_agree_subscribe, 'ld_agree_subscribe');
      expect(rowLd.ld_agree_privacy).to.eql(body.rd_agree_privacy, 'ld_agree_privacy');
      expect(rowLd.ld_is_reset_password).to.eql(body.rd_is_reset_password, 'ld_is_reset_password');
      expect(rowLd.ld_email_address).to.eql(
        body.bpd_email_address,
        'newcore.ld_email_address legacy.bpd_email_address'
      );
      expect(rowLd.ld_no_hp).to.eql(
        body.bpd_mobile_number,
        'newcore.ld_no_hp legacy.bpd_mobile_number'
      );
      expect(rowLd.ld_agree_subscribe).to.eql(body.rd_agree_subscribe, 'ld_agree_subscribe');
      expect(rowLd.ld_fullname).to.eql(
        body.bpd_full_name,
        'newcore.ld_fullname legacy.bpd_full_name'
      );
      expect(rowLd.ld_password).to.eql(body.bpd_upasswd, 'newcore.ld_password legacy.bpd_upasswd');
      expect(rowLd.ld_salutation).to.eql(
        body.bpd_salutation,
        'newcore.ld_salutation legacy.bpd_salutation'
      );
      expect(rowLd.ld_gender).to.eql(body.bpd_gender, 'newcore.ld_gender legacy.bpd_gender');

      let rowCi = await newcoreDb('customer_information')
        .select()
        .where({ ci_id: customerId })
        .first();
      expect(rowCi.ci_name).to.eql(body.rd_company_name, 'newcore.ci_name legacy.rd_company_name');
      expect(rowCi.ci_name).to.eql(
        body.bpd_company_name,
        'newcore.ci_name legacy.bpd_company_name'
      );
      expect(moment(rowCi.ci_created_at).format('YYYY-MM-DD')).to.eql(
        moment(body.rd_reg_start_date).format('YYYY-MM-DD'),
        'ci_created_at'
      );
      loginDataId = rowCi.ci_created_by;

      let rowCrs = await newcoreDb('customer_role').select().where({ cr_ci_id: customerId });
      let borrowerRoleFound = false;
      for (let rowCr of rowCrs) {
        if (rowCr.cr_type === 1) {
          borrowerRoleFound = true;
        }
      }
      expect(borrowerRoleFound, `customerId ${customerId} has no cr_type 1`).to.be.true;

      let rowOtpData = await newcoreDb('otp_data')
        .select()
        .where({ od_mobile_number: '+62' + body.bpd_mobile_number })
        .first();
      expect(moment(rowOtpData.od_created_at).format('YYYY-MM-DD')).to.eql(
        moment(body.rd_activation_date).format('YYYY-MM-DD'),
        'od_created_at'
      );

      let rowCif = await newcoreDb('cif_list').select().where({ cl_ci_id: customerId }).first();
      expect(rowCif.cl_id).to.eql(parseInt(body.bpd_number), 'cl_id');

      let rowUd = await newcoreDb('user_data')
        .select()
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(moment(rowUd.ud_dob).format('YYYY-MM-DD')).to.eql(body.bpd_dob, 'ud_dob');
      expect(rowUd.ud_ext_pob).to.eql(body.bpd_pob, 'ud_pob');

      let rowRd = await newcoreDb('referral_data')
        .select()
        .where({
          rfd_referral_user_id: loginDataId
        })
        .first();
      expect(rowRd.rfd_referrer_code).to.eql(body.rd_referral_id, 'rfd_referrer_code');
    });
  });
});

function generateBody() {
  let gender = help.randomGender();
  let addr = help.randomAddress();
  let currentDate = new Date();
  let password = help.getDefaultPassword({ hash: 'hmac' });
  let companyName = `PT ${help.randomCompanyName()} ${help.randomInteger(5)}`;
  let fullName = help.randomFullName(gender);
  let emailAddress = help.randomEmail();
  let mobileNumber = help.randomPhoneNumber(10);

  let body = {
    rd_referral_id: help.randomAlphaNumeric(7).toUpperCase(),
    rd_mobile_prefix_id: 1,
    rd_reg_start_date: moment(currentDate).format('YYYY-MM-DD HH:mm'),
    rd_activation_code: help.randomAlphaNumeric(10).toUpperCase(),
    rd_reg_ip_address: faker.internet.ip(),
    rd_gender: gender ? 'F' : 'M',
    rd_salutation: gender ? 'Mrs.' : 'Mr.',
    rd_full_name: fullName,
    rd_email_address: emailAddress,
    rd_mobile_number: mobileNumber,
    rd_company_name: companyName,
    rd_upasswd: password,
    rd_agree_subscribe: 'Y',
    rd_agree_privacy: 'Y',
    rd_customer_type: 1,
    rd_is_reset_password: 'Y',
    rd_activation_date: moment(currentDate).format('YYYY-MM-DD HH:mm'),
    rd_activation_status: 'Y',
    bpd_rd_id: help.randomInteger(8),
    bpd_number: help.randomInteger(8),
    bpd_email_address: emailAddress,
    bpd_mobile_number: mobileNumber,
    bpd_full_name: fullName,
    bpd_upasswd: password,
    bpd_dob: help.randomDate(1990),
    bpd_pob: addr.city.name,
    bpd_company_position: gender ? 1 : 3,
    bpd_company_name: companyName,
    bpd_salutation: gender ? 'Mrs.' : 'Mr.',
    bpd_gender: gender ? 'F' : 'M',
    bpd_created_date: moment(currentDate).format('YYYY-MM-DD HH:mm'),
    bpd_latest_updated: moment(currentDate).format('YYYY-MM-DD HH:mm')
  };
  return body;
}
