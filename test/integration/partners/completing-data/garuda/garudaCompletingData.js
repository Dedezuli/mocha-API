const help = require('@lib/helper');
const report = require('@lib/report');
const { Random } = require('random-js');
const moment = require('moment');
const boUser = require('@fixtures/backoffice_user');
const expect = require('chai').expect;
const chai = require('chai');
const request = require('@lib/request');
const newcoreDbConfig = require('@root/knexfile.js')[request.getEnv()];

describe('Integration Garuda Completing Data', () => {
  const url = '/validate/integration/partners/completing-data/garuda';
  const basicRegistrationUrl = '/validate/integration/partners/basic-registration/garuda';

  let boAccessToken;
  before(async function () {
    const boLoginRes = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', () => {
    it('Garuda completing data should succeed #TC-438', async function () {
      let basicRegBody = generateBasicRegistrationBody();

      let basicRegStartTime = help.startTime();

      const basicRegRes = await chai
        .request(request.getSvcUrl())
        .post(basicRegistrationUrl)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(basicRegBody);
      let currentDate = new Date();
      let basicRegResponseTime = help.responseTime(basicRegStartTime);

      report.setPayload(this, basicRegRes, basicRegResponseTime);

      let completingDataBody = generateCompletingDataBody(
        basicRegBody.personal_info.email,
        basicRegBody.sync.bpd_number
      );

      let startTime = help.startTime();

      const res = await chai
        .request(request.getSvcUrl())
        .post(url)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send(completingDataBody);

      let responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);

      let customerId = res.body.data.customer_id;

      let salutation;
      if (basicRegBody.personal_info.gender === 'F') salutation = 'Mrs.';
      else if (basicRegBody.personal_info.gender === 'M') salutation = 'Mr.';

      const newcoreDb = require('knex')(newcoreDbConfig);
      let rowLd = await newcoreDb('login_data')
        .select()
        .where({
          ld_email_address: basicRegBody.personal_info.email
        })
        .first();
      expect(rowLd.ld_fullname).to.eql(basicRegBody.personal_info.full_name, 'ld_full_name');
      expect(rowLd.ld_gender).to.eql(basicRegBody.personal_info.gender.toUpperCase(), 'ld_gender');
      expect(rowLd.ld_no_hp).to.eql(basicRegBody.personal_info.phone_number, 'ld_no_hp');
      expect(rowLd.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(moment(rowLd.ld_created_at).local().format('YYYY-MM-DD')).to.eql(
        moment(currentDate).local().format('YYYY-MM-DD'),
        'ld_created_at'
      );
      expect(rowLd.ld_activation_code).to.eql(
        basicRegBody.sync.activation_code,
        'ld_activation_code'
      );
      expect(rowLd.ld_salutation).to.eql(salutation, 'ld_salutation');
      expect(rowLd.ld_password).to.eql(basicRegBody.sync.hash_password, 'ld_password');
      expect(rowLd.ld_agree_subscribe).to.eql('Y', 'ld_agree_subscribe');
      expect(rowLd.ld_agree_privacy).to.eql('Y', 'ld_agree_privacy');

      let rowUd = await newcoreDb('user_data')
        .select()
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(rowUd.ud_ext_pob).to.eql(
        basicRegBody.personal_info.birth_place.toString(),
        'ud_ext_pob'
      );
      expect(moment(rowUd.ud_dob).local().format('YYYY-MM-DD')).to.eql(
        basicRegBody.personal_info.birth_date,
        'ud_dob'
      );
      expect(rowUd.ud_domicile_province_txt).to.eql(
        completingDataBody.company_info.company_province,
        'ud_domicile_province_txt'
      );
      expect(rowUd.ud_domicile_city_txt).to.eql(
        completingDataBody.company_info.company_city,
        'ud_domicile_city_txt'
      );
      expect(rowUd.ud_domicile_district_txt).to.eql(
        completingDataBody.company_info.company_district,
        'ud_domicile_district_txt'
      );
      expect(rowUd.ud_domicile_village_txt).to.eql(
        completingDataBody.company_info.company_sub_district,
        'ud_domicile_village_txt'
      );
      expect(rowUd.ud_domicile_postal_code).to.eql(
        completingDataBody.company_info.company_postal_code,
        'ud_domicile_postal_code'
      );

      let rowCr = await newcoreDb('customer_role').select('cr_type', 'cr_status').where({
        cr_ci_id: customerId
      });

      let borrowerRoleFound = false;
      for (let rowCrs of rowCr) {
        if (rowCrs.cr_type === 1) {
          borrowerRoleFound = true;
          expect(rowCrs.cr_status).to.eql(4, 'cr_status');
        }
      }
      expect(borrowerRoleFound, `cr_type 1 for ci_id ${customerId} not found`).to.be.true;

      let rowCif = await newcoreDb('cif_list')
        .select('cl_id')
        .where({
          cl_ci_id: customerId
        })
        .first();
      expect(rowCif.cl_id).to.eql(parseInt(basicRegBody.sync.bpd_number), 'cl_id');

      let rowCi = await newcoreDb('customer_information')
        .select()
        .where({
          ci_id: customerId
        })
        .first();
      expect(rowCi.ci_name).to.eql(completingDataBody.company_info.company_name, 'ci_name');
      expect(rowCi.ci_legal_entity).to.eql(
        completingDataBody.company_info.company_type,
        'ci_legal_entity'
      );
      expect(rowCi.ci_kbli_code).to.eql(
        completingDataBody.company_info.business_category,
        'ci_kbli_code'
      );
      expect(rowCi.ci_prod_pref).to.eql(completingDataBody.borrower_type, 'ci_prod_pref');

      let rowBd = await newcoreDb('business_data')
        .select()
        .where({
          bd_ci_id: customerId
        })
        .first();
      expect(rowBd.bd_description).to.eql(
        completingDataBody.company_info.company_desc,
        'bd_description'
      );
      expect(rowBd.bd_noe).to.eql(
        parseInt(completingDataBody.company_info.employee_number),
        'bd_noe'
      );
      expect(moment(rowBd.bd_doe).local().format('YYYY-MM-DD')).to.eql(
        completingDataBody.company_info.year_of_establishment,
        'bd_doe'
      );
      expect(rowBd.bd_address).to.eql(
        completingDataBody.company_info.company_address,
        'bd_address'
      );
      expect(rowBd.bd_province_txt).to.eql(
        completingDataBody.company_info.company_province,
        'bd_province'
      );
      expect(rowBd.bd_city_txt).to.eql(completingDataBody.company_info.company_city, 'bd_city');
      expect(rowBd.bd_district_txt).to.eql(
        completingDataBody.company_info.company_district,
        'bd_district'
      );
      expect(rowBd.bd_village_txt).to.eql(
        completingDataBody.company_info.company_sub_district,
        'bd_village'
      );
      expect(rowBd.bd_postal_code).to.eql(
        completingDataBody.company_info.company_postal_code,
        'bd_postal_code'
      );

      let rowLif = await newcoreDb('legal_information').select().where({
        li_ci_id: customerId
      });
      for (let rowLi of rowLif) {
        switch (rowLi.li_doc_type) {
          case 5: // SIUP
            expect(moment(rowLi.li_doc_registered).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.siup_registered_date,
              'li_doc_registered type 5'
            );
            expect(moment(rowLi.li_doc_expired).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.siup_expired_date,
              'li_doc_expired type 5'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.siup_file,
              'li_doc_file type 5'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.siup_number,
              'li_doc_number type 5'
            );
            break;

          case 4: // NPWP
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.company_npwp_file,
              'li_doc_file type 4'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.additional_data.company_npwp_number,
              'li_doc_number type 4'
            );
            break;

          case 6: // TDP
            expect(moment(rowLi.li_doc_registered).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.tdp_registered_date,
              'li_doc_registered type 6'
            );
            expect(moment(rowLi.li_doc_expired).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.tdp_expired_date,
              'li_doc_expired type 6'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.tdp_file,
              'li_doc_file type 6'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.additional_data.tdp_skdp_number,
              'li_doc_number type 6'
            );
            break;

          case 8: // SK Menkumham
            expect(moment(rowLi.li_doc_registered).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.sk_menhumkam_registered_date,
              'li_doc_registered type 8'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.sk_menhumkam_file,
              'li_doc_file type 8'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.additional_data.sk_menhumkam_number,
              'li_doc_number type 8'
            );
            break;

          case 7: // Akta Pendirian
            expect(moment(rowLi.li_doc_registered).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.akta_pendirian_registered_date,
              'li_doc_registered type 7'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.akta_pendirian_file,
              'li_doc_file type 7'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.additional_data.akta_pendirian_number,
              'li_doc_number type 7'
            );
            break;

          case 9: // Akta Perubahan
            expect(moment(rowLi.li_doc_registered).local().format('YYYY-MM-DD')).to.eql(
              completingDataBody.company_info.additional_data.akta_perubahan_registered_date,
              'li_doc_registered type 9'
            );
            expect(rowLi.li_doc_file).to.eql(
              completingDataBody.documents.akta_perubahan_terakhir_file,
              'li_doc_file type 9'
            );
            expect(rowLi.li_doc_number).to.eql(
              completingDataBody.company_info.additional_data.akta_perubahan_terakhir_number,
              'li_doc_number type 9'
            );
            break;
        }
      }

      let rowBif = await newcoreDb('bank_information').select().where({
        bi_ci_id: customerId
      });

      for (let rowBi of rowBif) {
        if (rowBi.bi_type === 29) {
          expect(rowBi.bi_bank_account_number).to.eql(
            completingDataBody.company_info.company_bank.account_number,
            'bi_bank_account_number'
          );
          expect(rowBi.bi_bank_account_holder).to.eql(
            completingDataBody.company_info.company_bank.account_name,
            'bi_bank_account_holder'
          );
          expect(rowBi.bi_bank_id).to.eql(
            completingDataBody.company_info.company_bank.bank_id,
            'bi_bank_id'
          );
          expect(rowBi.bi_use_as_disbursement).to.eql('Y', 'bi_use_as_disbursement');
          expect(moment(rowBi.bi_created_at).local().format('YYYY-MM-DD')).to.eql(
            moment(currentDate).local().format('YYYY-MM-DD'),
            'bi_created_at'
          );
        } else if (rowBi.bi_type === 33) {
          expect(rowBi.bi_bank_account_number).to.eql(
            completingDataBody.sync.va_number,
            'bi_bank_account_number'
          );
          expect(rowBi.bi_bank_account_holder).to.eql(
            completingDataBody.company_info.company_bank.account_name,
            'bi_bank_account_holder'
          );
          expect(moment(rowBi.bi_created_at).local().format('YYYY-MM-DD')).to.eql(
            moment(currentDate).local().format('YYYY-MM-DD'),
            'bi_created_at'
          );
        }
      }
    });
  });
});

function generateCompletingDataBody(emailAddress, bpdNumber) {
  let randomState = new Random().bool();

  let addr = help.randomAddress();
  let body = {
    personal_info: {
      email: emailAddress,
      borrower_number: bpdNumber
    },
    company_info: {
      company_name: help.randomCompanyName(),
      company_type: randomState ? 1 : 2, // PT or CV
      business_category: randomState ? 'F' : 'L', // Konstruksi or Real Estat
      business_type: 2,
      company_desc: help.randomDescription(),
      employee_number: help.randomInteger(3),
      year_of_establishment: help.randomDate(),
      company_address: addr.address,
      company_province: addr.province.name,
      company_city: addr.city.name,
      company_district: addr.district.name,
      company_sub_district: addr.subDistrict.name,
      company_postal_code: addr.postalCode,
      company_phone_number: help.randomInteger(12),
      fax_number: help.randomInteger(12),
      siup_number: help.randomAlphaNumeric(15),
      company_bank: {
        bank_id: 1,
        account_number: help.randomInteger(10),
        account_name: help.randomFullName()
      },
      additional_data: {
        company_npwp_number: help.randomInteger('NPWP', { formatNpwp: true }),
        siup_registered_date: help.randomDate(),
        siup_expired_date: help.futureDate(10),
        tdp_skdp_number: help.randomAlphaNumeric(15),
        tdp_registered_date: help.randomDate(),
        tdp_expired_date: help.futureDate(10),
        sk_menhumkam_number: help.randomInteger(15),
        sk_menhumkam_registered_date: help.futureDate(10),
        akta_pendirian_number: help.randomInteger(10),
        akta_pendirian_registered_date: help.randomDate(),
        akta_perubahan_terakhir_number: help.randomInteger(15),
        akta_perubahan_registered_date: help.randomDate()
      }
    },
    documents: {
      siup_file: help.randomUrl(),
      company_npwp_file: help.randomUrl(),
      tdp_file: help.randomUrl(),
      sk_menhumkam_file: help.randomUrl(),
      akta_pendirian_file: help.randomUrl(),
      akta_perubahan_terakhir_file: help.randomUrl()
    },
    borrower_type: randomState ? 1 : 2, // Konvensional or Syariah
    sync: {
      va_number: help.randomInteger(12)
    }
  };

  return body;
}

function generateBasicRegistrationBody() {
  let gender = help.randomGender();
  let addr = help.randomAddress();
  let body = {
    personal_info: {
      full_name: help.randomFullName(gender),
      gender: gender ? 'F' : 'M',
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
