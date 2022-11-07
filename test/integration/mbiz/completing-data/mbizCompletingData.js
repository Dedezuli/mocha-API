const help = require('@lib/helper');
const report = require('@lib/report');
const moment = require('moment');
const faker = require('faker');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const request = require('@lib/request');
const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];

describe('Integration MBIZ Completing Data', () => {
  const basicRegistrationUrl = '/validate/integration/mbiz/basic-registration';
  const completingDataUrl = '/validate/integration/mbiz/completing-data';

  let boAccessToken;
  before(async function () {
    const boLoginCompleting = await request.backofficeLogin(
      boUser.admin.username,
      boUser.admin.password
    );
    boAccessToken = boLoginCompleting.data.accessToken;
  });

  describe('#smoke', () => {
    it('MBIZ completing data should succeed #TC-435', async function () {
      let basicRegistrationBody = generateBasicRegistrationBody();

      const basicRegStartTime = help.startTime();
      const basicRegRes = await chai
        .request(request.getSvcUrl())
        .post(basicRegistrationUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(basicRegistrationBody);

      const basicRegResponseTime = help.responseTime(basicRegStartTime);

      report.setPayload(this, basicRegRes, basicRegResponseTime);

      expect(basicRegRes.body.meta).to.have.property('code', 200);

      let customerId = basicRegRes.body.data.customer_id;
      let emailAddress = basicRegistrationBody.bpd_email_address;

      let completingDataBody = generateCompletingDataBody(emailAddress);

      const cdStartTime = help.startTime();
      const cdRes = await chai
        .request(request.getSvcUrl())
        .post(completingDataUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(completingDataBody);
      const cdResponseTime = help.responseTime(cdStartTime);

      report.setPayload(this, cdRes, cdResponseTime);

      expect(cdRes.body.meta).to.have.property('code', 200);

      let loginDataId;
      const newcoreDb = require('knex')(newcoreDbConfig);
      let rowLd = await newcoreDb('login_data')
        .select()
        .where({
          ld_email_address: basicRegistrationBody.bpd_email_address
        })
        .first();
      loginDataId = rowLd.ld_id;
      expect(rowLd.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(rowLd.ld_gender).to.eql(basicRegistrationBody.rd_gender, 'ld_gender');
      expect(rowLd.ld_salutation).to.eql(
        basicRegistrationBody.rd_salutation,
        'newcore.ld_salutation legacy.rd_salutation'
      );
      expect(rowLd.ld_fullname).to.eql(basicRegistrationBody.rd_full_name, 'ld_fullname');
      expect(rowLd.ld_email_address).to.eql(
        basicRegistrationBody.rd_email_address,
        'newcore.ld_email_address legacy.rd_email_address'
      );
      expect(rowLd.ld_no_hp).to.eql(
        basicRegistrationBody.rd_mobile_number,
        'newcore.ld_no_hp legacy.rd_mobile_number'
      );
      expect(rowLd.ld_gender).to.eql(basicRegistrationBody.bpd_gender, 'ld_gender');
      expect(rowLd.ld_password).to.eql(
        basicRegistrationBody.rd_upasswd,
        'newcore.ld_password legacy.rd_upasswd'
      );
      expect(rowLd.ld_agree_subscribe).to.eql(
        basicRegistrationBody.rd_agree_subscribe,
        'ld_agree_subscribe'
      );
      expect(rowLd.ld_agree_privacy).to.eql(
        basicRegistrationBody.rd_agree_privacy,
        'ld_agree_privacy'
      );
      expect(rowLd.ld_is_reset_password).to.eql(
        basicRegistrationBody.rd_is_reset_password,
        'ld_is_reset_password'
      );
      expect(rowLd.ld_email_address).to.eql(
        basicRegistrationBody.bpd_email_address,
        'newcore.ld_email_address legacy.bpd_email_address'
      );
      expect(rowLd.ld_no_hp).to.eql(
        basicRegistrationBody.bpd_mobile_number,
        'newcore.ld_no_hp legacy.bpd_mobile_number'
      );
      expect(rowLd.ld_agree_subscribe).to.eql(
        basicRegistrationBody.rd_agree_subscribe,
        'ld_agree_subscribe'
      );
      expect(rowLd.ld_fullname).to.eql(
        basicRegistrationBody.bpd_full_name,
        'newcore.ld_fullname legacy.bpd_full_name'
      );
      expect(rowLd.ld_password).to.eql(
        basicRegistrationBody.bpd_upasswd,
        'newcore.ld_password legacy.bpd_upasswd'
      );
      expect(rowLd.ld_salutation).to.eql(
        basicRegistrationBody.bpd_salutation,
        'newcore.ld_salutation legacy.bpd_salutation'
      );
      expect(rowLd.ld_gender).to.eql(
        basicRegistrationBody.bpd_gender,
        'newcore.ld_gender legacy.bpd_gender'
      );

      let rowCi = await newcoreDb('customer_information')
        .select()
        .where({
          ci_id: customerId
        })
        .first();
      expect(rowCi.ci_name).to.eql(
        basicRegistrationBody.rd_company_name,
        'newcore.ci_name legacy.rd_company_name'
      );
      expect(rowCi.ci_name).to.eql(
        basicRegistrationBody.bpd_company_name,
        'newcore.ci_name legacy.bpd_company_name'
      );
      expect(moment(rowCi.ci_created_at).format('YYYY-MM-DD')).to.eql(
        moment(basicRegistrationBody.rd_reg_start_date).format('YYYY-MM-DD'),
        'ci_created_at'
      );
      expect(rowCi.ci_prod_pref).to.eql(parseInt(completingDataBody.bpd_loan_type), 'ci_prod_pref');
      expect(rowCi.ci_legal_entity).to.eql(completingDataBody.bpd_company_type, 'ci_legal_entity');

      let rowBd = await newcoreDb('business_data')
        .select()
        .where({
          bd_ci_id: customerId
        })
        .first();
      expect(rowBd.bd_description).to.eql(completingDataBody.bpd_company_desc, 'bd_description');
      expect(moment(rowBd.bd_doe).format('YYYY-MM-DD')).to.eql(
        completingDataBody.bpd_company_year_start,
        'bd_doe'
      );
      expect(rowBd.bd_noe).to.eql(parseInt(completingDataBody.bpd_number_of_employees), 'bd_noe');
      expect(rowBd.bd_mobile_prefix).to.eql('1', 'bd_mobile_prefix');
      expect(rowBd.bd_land_line_number).to.eql(
        completingDataBody.bpd_company_phone,
        'bd_land_line_number'
      );
      expect(rowBd.bd_address).to.eql(completingDataBody.bpd_company_address, 'bd_address');
      expect(rowBd.bd_province_txt).to.eql(completingDataBody.bpd_company_province, 'bd_province');
      expect(rowBd.bd_city_txt).to.eql(completingDataBody.bpd_company_kab_kot, 'bd_city');
      expect(rowBd.bd_district_txt).to.eql(completingDataBody.bpd_company_kecamatan, 'bd_district');
      expect(rowBd.bd_village_txt).to.eql(completingDataBody.bpd_company_kelurahan, 'bd_village');
      expect(rowBd.bd_postal_code).to.eql(
        completingDataBody.bpd_company_postal_code,
        'bd_postal_code'
      );

      let rowBif = await newcoreDb('bank_information').select().where({
        bi_ci_id: customerId
      });

      for (let rowBi of rowBif) {
        if (rowBi.bi_type === 29) {
          expect(rowBi.bi_bank_account_holder).to.eql(
            completingDataBody.bpd_company_bank_account_name,
            'newcore.bi_bank_account_holder legacy.bpd_company_bank_account_name type 29'
          );
          expect(rowBi.bi_bank_account_number).to.eql(
            completingDataBody.bpd_company_bank_number,
            'newcore.bi_bank_account_number legacy.bpd_company_bank_number type 29'
          );
          expect(rowBi.bi_bank_id).to.eql(
            completingDataBody.bpd_company_bank_name_id,
            'newcore.bi_bank_id legacy.bpd_company_bank_name_id type 29'
          );
          expect(rowBi.bi_use_as_disbursement).to.eql(
            completingDataBody.bbd_is_default,
            'newcore.bi_use_as_disbursement legacy.bbd_is_default type 29'
          );
          expect(rowBi.bi_bank_account_holder).to.eql(
            completingDataBody.bbd_bank_acc_name,
            'newcore.bi_bank_account_holder legacy.bbd_bank_acc_name type 29'
          );
          expect(rowBi.bi_bank_account_number).to.eql(
            completingDataBody.bbd_bank_acc_number,
            'newcore.bi_bank_account_number legacy.bbd_bank_acc_number type 29'
          );
          expect(rowBi.bi_bank_id).to.eql(
            completingDataBody.bbd_bank_id,
            'newcore.bi_bank_id legacy.bbd_bank_id type 29'
          );
          expect(rowBi.bi_legacy_id).to.eql(
            parseInt(completingDataBody.bbd_bpd_id),
            'bi_legacy_id'
          );
        } else if (rowBi.bi_type === 33) {
          expect(rowBi.bi_bank_account_holder).to.eql(
            completingDataBody.bpd_company_bank_account_name,
            'bi_bank_account_holder type 33'
          );
          expect(rowBi.bi_bank_account_number).to.eql(
            completingDataBody.bpd_va_number,
            'bi_bank_account_number type 33'
          );

          if (
            completingDataBody.bpd_registered_va === 'D' ||
            completingDataBody.bpd_registered_va === 'N'
          )
            expect(rowBi.bi_status).to.eql('Unverified', 'bi_status');
          else if (completingDataBody.bpd_registered_va === 'Y')
            expect(rowBi.bi_status).to.eql('Verified', 'bi_status');
          expect(rowBi.bi_legacy_id).to.eql(
            parseInt(completingDataBody.bbd_bpd_id),
            'bi_legacy_id type 33'
          );
        }
      }

      let rowLif = await newcoreDb('legal_information').select().where({
        li_ci_id: customerId
      });
      for (let rowLi of rowLif) {
        switch (rowLi.li_doc_type) {
          case 4: // NPW
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_npwp,
              'li_doc_number type 4'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_npwp_file,
              'li_doc_file type 4'
            );
            break;
          case 5: // SIUP
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_siup_no,
              'li_doc_number type 5'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_siup_file,
              'li_doc_file type 5'
            );
            expect(moment(rowLi.li_doc_registered).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_siup_register_date,
              'li_doc_registered type 5'
            );
            expect(moment(rowLi.li_doc_expired).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_siup_expired_date,
              'li_doc_expired type 5'
            );
            break;
          case 8: // SK Menkumham
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_sk_menhumkam,
              'li_doc_number type 8'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_sk_menhumkam_file,
              'li_doc_file type 8'
            );
            expect(moment(rowLi.li_doc_registered).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_menhumkam_register_date,
              'li_doc_registered type 8'
            );
            break;
          case 6: // TDP
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_tdp_no,
              'li_doc_number type 6'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_tdp_file,
              'li_doc_file type 6'
            );
            expect(moment(rowLi.li_doc_registered).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_tdp_register_date,
              'li_doc_registered type 6'
            );
            expect(moment(rowLi.li_doc_expired).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_tdp_expired_date,
              'li_doc_expired type 6'
            );
            break;
          case 7: // Akta Pendirian
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_akta_pendirian_no,
              'li_doc_number type 7'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_akta_pendirian_file,
              'li_doc_file type 7'
            );
            expect(moment(rowLi.li_doc_registered).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_akta_pendirian_register_date,
              'li_doc_registered type 7'
            );
            break;
          case 9: // Akta Perubahan
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.bpd_cdoc_akta_perubahan_no,
              'li_doc_number type 9'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.bpd_cdoc_akta_perubahan_file,
              'li_doc_file type 9'
            );
            expect(moment(rowLi.li_doc_registered).format('YYYY-MM-DD')).to.eql(
              completingDataBody.bpd_cdoc_akta_perubahan_register_date,
              'li_doc_registered type 9'
            );
        }
      }

      let rowCr = await newcoreDb('customer_role').select().where({
        cr_ci_id: customerId
      });
      let borrowerRoleFound = false;
      for (let rowCrs of rowCr) {
        if (rowCrs.cr_type === 1) {
          borrowerRoleFound = true;
        }
      }
      expect(borrowerRoleFound, `customerId ${customerId} has no cr_type 1`).to.be.true;

      let rowOtp = await newcoreDb('otp_data')
        .select()
        .where({
          od_mobile_number: '+62' + basicRegistrationBody.bpd_mobile_number
        })
        .first();
      expect(moment(rowOtp.od_created_at).format('YYYY-MM-DD')).to.eql(
        moment(basicRegistrationBody.rd_activation_date).format('YYYY-MM-DD'),
        'od_created_at'
      );

      let rowCif = await newcoreDb('cif_list')
        .select()
        .where({
          cl_ci_id: customerId
        })
        .first();
      expect(rowCif.cl_id).to.eql(parseInt(basicRegistrationBody.bpd_number), 'cl_id');

      let rowUd = await newcoreDb('user_data')
        .select()
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(moment(rowUd.ud_dob).format('YYYY-MM-DD')).to.eql(
        basicRegistrationBody.bpd_dob,
        'ud_dob'
      );
      expect(rowUd.ud_ext_pob).to.eql(basicRegistrationBody.bpd_pob, 'ud_pob');
      expect(moment(rowUd.ud_fill_finish_at).format('YYYY-MM-DD')).to.eql(
        moment(completingDataBody.bpd_fill_finish_date).format('YYYY-MM-DD'),
        'ud_fill_finish_at'
      );

      let rowRd = await newcoreDb('referral_data')
        .select()
        .where({
          rfd_referral_user_id: loginDataId
        })
        .first();
      expect(rowRd.rfd_referrer_code).to.eql(
        basicRegistrationBody.rd_referral_id,
        'rfd_referrer_code'
      );
    });
  });
});

function generateBasicRegistrationBody() {
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

function generateCompletingDataBody(emailAddress) {
  let random = faker.random.boolean();
  let addr = help.randomAddress();
  let fullName = help.randomFullName(random);
  let bankAccountNumber = help.randomInteger(10);
  let phoneNumber = help.randomInteger(10);
  let currentDate = new Date();
  let body = {
    bpd_email_address: emailAddress,
    bpd_company_type: random ? 1 : 2,
    bpd_company_industry_cat_id: 0,
    bpd_company_industry_type_id: 10,
    bpd_company_desc: help.randomDescription(),
    bpd_number_of_employees: help.randomInteger(3),
    bpd_company_year_start: help.randomDate(),
    bpd_company_address: addr.address,
    bpd_company_province: addr.province.name,
    bpd_company_kab_kot: addr.city.name,
    bpd_company_kecamatan: addr.district.name,
    bpd_company_kelurahan: addr.subDistrict.name,
    bpd_company_postal_code: addr.postalCode,
    bpd_company_phone: phoneNumber,
    bpd_company_fax: phoneNumber,
    bpd_cdoc_siup_no: help.randomAlphaNumeric(10),
    bpd_company_bank_name_id: 1,
    bpd_company_bank_number: bankAccountNumber,
    bpd_company_bank_account_name: fullName,
    bpd_cdoc_npwp: help.randomInteger('NPWP'),
    bpd_cdoc_siup_register_date: help.randomDate(),
    bpd_cdoc_siup_expired_date: help.futureDate(),
    bpd_cdoc_tdp_no: help.randomInteger(10),
    bpd_cdoc_tdp_register_date: help.randomDate(),
    bpd_cdoc_tdp_expired_date: help.futureDate(),
    bpd_cdoc_sk_menhumkam: help.randomInteger(10),
    bpd_cdoc_menhumkam_register_date: help.randomDate(),
    bpd_cdoc_akta_pendirian_no: help.randomInteger(10),
    bpd_cdoc_akta_pendirian_register_date: help.randomDate(),
    bpd_cdoc_akta_perubahan_no: help.randomInteger(10),
    bpd_cdoc_akta_perubahan_register_date: help.randomDate(),
    bpd_loan_type: random ? '1' : '2',
    bpd_va_number: help.randomInteger(10),
    bpd_registered_va: 'D',
    bpd_right_data: 'Y',
    bpd_activated_date: moment(currentDate).format('YYYY-MM-DD HH:mm:ss'),
    bpd_approve_to_dashboard: 'Y',
    bpd_activation_date: moment(currentDate).format('YYYY-MM-DD HH:mm:ss'),
    bpd_last_login: moment(currentDate).format('YYYY-MM-DD HH:mm:ss'),
    bpd_ip_address: faker.internet.ip(),
    bpd_borrower_status: 1,
    bpd_fill_finish_date: moment(currentDate).format('YYYY-MM-DD HH:mm:ss'),
    bpd_bpl_id: 5,
    bpd_cdoc_siup_file: help.randomUrl(),
    bpd_cdoc_npwp_file: help.randomUrl(),
    bpd_cdoc_tdp_file: help.randomUrl(),
    bpd_cdoc_sk_menhumkam_file: help.randomUrl(),
    bpd_cdoc_akta_pendirian_file: help.randomUrl(),
    bpd_cdoc_akta_perubahan_file: help.randomUrl(),
    bbd_bpd_id: help.randomInteger(9),
    bbd_bank_id: 1,
    bbd_bank_acc_name: fullName,
    bbd_bank_acc_number: bankAccountNumber,
    bbd_is_default: 'Y',
    bvd_bpd_id: help.randomInteger(10),
    bvd_ad_id: 5,
    bvd_mct_id: 1,
    bvd_status: 'Y',
    bvd_aprroved_by_anchor_at: '2020-01-23 12:09:00',
    bvd_start_join_at: '2020-01-10',
    bvd_average_trx_per_month: 340000000,
    bvd_created_at: '2020-01-23 12:09:00'
  };

  return body;
}
