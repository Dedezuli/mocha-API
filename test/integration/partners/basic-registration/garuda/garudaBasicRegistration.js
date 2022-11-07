const help = require('@lib/helper');
const report = require('@lib/report');
const moment = require('moment');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const request = require('@lib/request');
const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];

describe('Integration Garuda Basic Registration', () => {
  const url = '/validate/integration/partners/basic-registration/garuda';

  let boAccessToken;
  before(async function () {
    const boLoginRes = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', () => {
    it('Garuda basic registration should succeed #TC-436', async function () {
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
      let currentDate = new Date();
      const responseTime = help.responseTime(startTime);
      report.setPayload(this, res, responseTime);
      expect(res.body.meta).to.have.property('code', 200);
      let customerId = res.body.data.customer_id;
      let salutation;
      if (body.personal_info.gender === 'f') salutation = 'Mrs.';
      else if (body.personal_info.gender === 'm') salutation = 'Mr.';

      const newcoreDb = require('knex')(newcoreDbConfig);

      let rowLd = await newcoreDb('login_data')
        .select()
        .where({
          ld_email_address: body.personal_info.email
        })
        .first();
      expect(rowLd.ld_fullname).to.eql(body.personal_info.full_name, 'ld_full_name');
      expect(rowLd.ld_gender).to.eql(body.personal_info.gender.toUpperCase(), 'ld_gender');
      expect(rowLd.ld_no_hp).to.eql(body.personal_info.phone_number, 'ld_no_hp');
      expect(rowLd.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(moment(rowLd.ld_created_at).local().format('YYYY-MM-DD')).to.eql(
        moment(currentDate).local().format('YYYY-MM-DD'),
        'ld_created_at'
      );
      expect(rowLd.ld_activation_code).to.eql(body.sync.activation_code, 'ld_activation_code');
      expect(rowLd.ld_salutation).to.eql(salutation, 'ld_salutation');
      expect(rowLd.ld_password).to.eql(body.sync.hash_password, 'ld_password');
      expect(rowLd.ld_agree_subscribe).to.eql('Y', 'ld_agree_subscribe');
      expect(rowLd.ld_agree_privacy).to.eql('Y', 'ld_agree_privacy');

      let rowUd = await newcoreDb('user_data')
        .select()
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(rowUd.ud_ext_pob).to.eql(body.personal_info.birth_place.toString(), 'ud_ext_pob');
      expect(moment(rowUd.ud_dob).local().format('YYYY-MM-DD')).to.eql(
        body.personal_info.birth_date,
        'ud_dob'
      );

      let rowCr = await newcoreDb('customer_role').select('cr_type').where({
        cr_ci_id: customerId
      });
      let borrowerRoleFound = false;
      for (let rowCrs of rowCr) {
        if (rowCrs.cr_type === 1) {
          borrowerRoleFound = true;
        }
      }
      expect(borrowerRoleFound, `cr_type 1 for ci_id ${customerId} not found`).to.be.true;

      let rowCif = await newcoreDb('cif_list')
        .select('cl_id')
        .where({
          cl_ci_id: customerId
        })
        .first();
      expect(rowCif.cl_id).to.eql(parseInt(body.sync.bpd_number), 'cl_id');
    });
  });
});

function generateBody() {
  let gender = help.randomGender();
  let addr = help.randomAddress();
  let body = {
    personal_info: {
      full_name: help.randomFullName(gender),
      gender: gender ? 'f' : 'm',
      birth_place: addr.city.id,
      birth_date: help.randomDate(1990),
      phone_number: help.randomInteger(10),
      email: help.randomEmail(),
      title: gender ? 1 : 3 // Direktur Utama or Komisaris
    },
    sync: {
      referral: help.randomAlphaNumeric(6).toUpperCase(),
      activation_code: help.randomAlphaNumeric(7).toUpperCase(),
      hash_password: help.getDefaultPassword({ hash: 'hmac' }),
      bpd_number: help.randomInteger(7)
    }
  };
  return body;
}
