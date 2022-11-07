const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const moment = require('moment');
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const newcoreDbConf = require('@root/knexfile')[req.getEnv()];
const svcBaseUrl = req.getSvcUrl();
let currentDate = new Date();

describe('Integration Tokopedia Apply Loan', function () {
  const url = '/validate/integration/ecommerce/tokopedia/apply-loan';

  let boAccessToken;
  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Tokopedia borrower registration should succeed #TC-554', async function () {
      const body = generateBody();

      const startTime = help.startTime();
      const res = await chai
        .request(svcBaseUrl)
        .post(url)
        .set(
          req.createNewCoreHeaders({
            'X-Investree-token': boAccessToken
          })
        )
        .send(body);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);

      expect(res.body.meta).to.have.property('code', 200);

      const customerId = res.body.data.applicant_id;
      const emailAddress = body.email_address;

      const newcoreDb = require('knex')(newcoreDbConf);
      const rowLd = await newcoreDb('login_data')
        .select()
        .where({
          ld_email_address: emailAddress
        })
        .first();
      const loginDataId = rowLd.ld_id;
      expect(rowLd.ld_fullname).to.eql(body.full_name, 'ld_fullname');
      expect(rowLd.ld_salutation).to.eql(body.salutation, 'ld_gender');
      expect(rowLd.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(rowLd.ld_no_hp).to.eql(body.mobile_number, 'ld_no_hp');
      expect(rowLd.ld_password).to.eql(body.sync.hash_password, 'ld_password');

      const rowUd = await newcoreDb('user_data')
        .select()
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(rowUd.ud_ext_pob).to.eql(body.bpd_pob, 'ud_ext_pob');
      expect(moment(rowUd.ud_dob).local().format('YYYY-MM-DD')).to.eql(body.bpd_dob, 'ud_dob');
      expect(rowUd.ud_identity_card_number).to.eql(body.bpd_ktp, 'ud_identity_card_number');
      expect(rowUd.ud_ktp_address).to.eql(body.bpd_company_address, 'ud_ktp_address');
      expect(rowUd.ud_ktp_postal_code).to.eql(body.bpd_company_postal_code, 'ud_ktp_postal_code');
      expect(rowUd.ud_partner_province).to.eql(body.bpd_company_province, 'ud_partner_province');
      expect(rowUd.ud_partner_province).to.eql(body.seller_province, 'ud_partner_province');
      expect(rowUd.ud_partner_city).to.eql(body.bpd_company_kab_kot, 'ud_partner_city');
      expect(rowUd.ud_partner_city).to.eql(body.seller_kab_kot, 'ud_partner_city');
      expect(rowUd.ud_partner_district).to.eql(body.bpd_company_kecamatan, 'ud_partner_district');
      expect(rowUd.ud_domicile_address).to.eql(body.bpd_domicile_address, 'ud_domicile_address');
      expect(rowUd.ud_domicile_postal_code).to.eql(
        body.bpd_domicile_postal_code,
        'ud_domicile_postal_code'
      );
      expect(rowUd.ud_domicile_province_txt).to.eql(
        body.bpd_domicile_province,
        'ud_domicile_province_txt'
      );
      expect(rowUd.ud_domicile_city_txt).to.eql(body.bpd_domicile_kab_kot, 'ud_domicile_city_txt');
      expect(rowUd.ud_domicile_district_txt).to.eql(
        body.bpd_domicile_kecamatan,
        'ud_domicile_district_txt'
      );

      const rowsLi = await newcoreDb('legal_information').select().where({
        li_ci_id: customerId
      });
      for (const rowLi of rowsLi) {
        if (rowLi.li_doc_type === 4) {
          expect(rowLi.li_doc_number).to.eql(body.bpd_npwp_no, 'li_doc_number');
        }
      }

      const rowCi = await newcoreDb('customer_information')
        .select()
        .where({
          ci_id: customerId
        })
        .first();
      body.ecommerce_name.forEach((item) => {
        if (item.ecommerce_name === 'Tokopedia') {
          expect(rowCi.ci_name).to.eql(item.nama_toko, 'ci_name');
        }
      });

      const rowsPi = await newcoreDb('partnership_info').select().where({
        pi_ci_id: customerId
      });
      const sellerLinks = [];
      const ecommerceNames = [];
      let i = 0;
      for (const rowPi of rowsPi) {
        sellerLinks.push(rowPi.pi_seller_link);
        ecommerceNames.push(body.ecommerce_name[i].link_toko);
        i++;
      }
      expect(sellerLinks).to.include.members(ecommerceNames, 'pi_seller_link');

      const rowBd = await newcoreDb('business_data')
        .select()
        .where({
          bd_ci_id: customerId
        })
        .first();
      expect(rowBd.bd_address).to.eql(body.epd_offline_store_address, 'bd_address');
      expect(rowBd.bd_postal_code).to.eql(body.epd_offline_store_postal_code, 'bd_postal_code');
      expect(rowBd.bd_province_txt).to.eql(body.epd_offline_store_province, 'bd_province_txt');
      expect(rowBd.bd_city_txt).to.eql(body.epd_offline_store_kab_kot, 'bd_city_txt');
      expect(rowBd.bd_district_txt).to.eql(body.epd_offline_store_kecamatan, 'bd_district_txt');
      expect(rowBd.bd_description).to.eql(body.bpd_company_desc, 'bd_description');

      const rowsSt = await newcoreDb('sales_transaction').select().where({
        st_ci_id: customerId
      });
      i = 0;
      for (const rowSt of rowsSt) {
        expect(rowSt.st_transaction).to.eql(
          parseInt(body.transaction_history[i]),
          'st_transaction'
        );
        expect(rowSt.st_amount).to.eql(parseInt(body.cashflow_history[i]), 'st_amount');
        i++;
      }

      const rowsBi = await newcoreDb('bank_information').select().where({
        bi_ci_id: customerId
      });
      for (const rowBi of rowsBi) {
        if (rowBi.bi_type === 29) {
          expect(rowBi.bi_bank_id).to.eql(body.bpd_company_bank_name_id, 'bi_bank_id');
          expect(rowBi.bi_bank_account_holder).to.eql(
            body.bpd_company_bank_account_name,
            'bi_bank_account_holder'
          );
          expect(rowBi.bi_bank_account_number).to.eql(
            body.bpd_company_bank_number,
            'bi_bank_account_number'
          );
        } else if (rowBi.bi_type === 33) {
          expect(rowBi.bi_bank_account_number).to.eql(
            body.sync.va_number,
            'bi_bank_account_number'
          );
          expect(rowBi.bi_bank_account_holder).to.eql(
            body.company_bank.account_name,
            'bi_bank_account_holder'
          );
          expect(moment(rowBi.bi_created_at).local().format('YYYY-MM-DD')).to.eql(
            moment(currentDate).local().format('YYYY-MM-DD'),
            'bi_created_at'
          );
        }
      }

      const rowCl = await newcoreDb('cif_list')
        .select('cl_id')
        .where({
          cl_ci_id: customerId
        })
        .first();
      expect(rowCl.cl_id).to.eql(parseInt(body.sync.bpd_number), 'cl_id');

      const rowRd = await newcoreDb('referral_data')
        .select()
        .where({
          rfd_referral_user_id: loginDataId
        })
        .first();

      expect(rowRd.rfd_referrer_code).to.eql(body.sync.referral, 'rfd_referrer_code');

      newcoreDb.destroy();
    });
  });
});

function generateBody () {
  const addr = help.randomAddress();
  let bizAddr;

  let notFound = true;
  while (notFound) {
    bizAddr = help.randomAddress();
    if (bizAddr.address !== addr.address) {
      notFound = false;
    }
  }

  const gender = help.randomGender();
  const password = help.randomAlphaNumeric(16);
  const fullName = help.randomFullName(gender);
  currentDate = new Date();

  const body = {
    partnership_id: 1,
    partnership_name: 'Tokopedia',
    applicant_id: parseInt(help.randomInteger(7)),
    mobile_number: help.randomInteger(10),
    password: password,
    confirm_password: password,
    agree_subscribe: 'Y',
    agree_privacy: 'Y',
    email_address: help.randomEmail(),
    salutation: gender ? 'Mrs.' : 'Mr.',
    full_name: fullName,
    ecommerce_name: [
      {
        ecommerce_id: 4,
        ecommerce_name: 'Tokopedia',
        link_toko: help.randomUrl(),
        nama_toko: `${help.randomCompanyName()} ${help.randomInteger(3)}`
      },
      {
        ecommerce_id: 3,
        ecommerce_name: 'shopee',
        link_toko: help.randomUrl(),
        nama_toko: `${help.randomCompanyName()} ${help.randomInteger(3)}`
      }
    ],
    epd_lama_berjualan_online: help.randomDate(),
    epd_nilai_rata_penjualan: 0,
    epd_company_type: 4,
    seller_province: addr.province.name,
    seller_kab_kot: addr.city.name,
    rd_agree_terms: 'Y',
    shipping_from: addr.subDistrict.name,
    loan_type1: 'Y',
    loan_type2: '',
    eld_mlt_id: 1,
    bpd_company_bank_name_id: 1,
    bpd_company_bank_account_name: fullName,
    bpd_company_bank_number: help.randomInteger(12),
    domisili_same_as_ktp: '',
    bpd_dob: help.randomDate(1990),
    bpd_full_name: fullName,
    bpd_domicile_province: addr.province.name,
    bpd_domicile_kab_kot: addr.city.name,
    bpd_domicile_kecamatan: addr.district.name,
    bpd_domicile_kelurahan: addr.subDistrict.name,
    bpd_domicile_address: addr.address,
    bpd_domicile_postal_code: addr.postalCode,
    bpd_domicile_phone: help.randomInteger(10),
    epd_offline_store_address: bizAddr.address,
    epd_offline_store_province: bizAddr.province.name,
    epd_offline_store_kab_kot: bizAddr.city.name,
    epd_offline_store_kecamatan: bizAddr.district.name,
    epd_offline_store_kelurahan: bizAddr.subDistrict.name,
    epd_offline_store_postal_code: bizAddr.postalCode,
    bpd_ktp_expired: '',
    bpd_ktp: help.randomInteger('KTP'),
    bpd_npwp_no: help.randomInteger('NPWP'),
    bpd_company_desc: help.randomDescription(),
    bpd_pob: addr.city.name,
    right_data: 'Y',
    bpd_company_address: addr.address,
    bpd_company_postal_code: addr.postalCode,
    bpd_company_kecamatan: addr.district.name,
    bpd_company_kab_kot: addr.city.name,
    bpd_company_province: addr.province.name,
    bpd_company_kelurahan: addr.subDistrict.name,
    transaction_history: [],
    cashflow_history: [],
    ktp_image: help.randomUrl(),
    ktp_selfie: help.randomUrl(),
    cap_amount: help.randomInteger(12),
    eld_bank_statement: '',
    eld_rm_name: '',
    eld_loan_tenor: 6,
    loan_osf: 'Preapproved Investree',
    eld_loan_reg_date: '2019-02-21 01:10:00',
    sync: {
      bpd_number: help.randomInteger(9),
      va_number: help.randomInteger(12),
      referral: help.randomAlphaNumeric(7).toUpperCase(),
      activation_code: help.randomAlphaNumeric(7).toUpperCase(),
      hash_password: help.getDefaultPassword({ hash: 'hmac' })
    }
  };

  for (let i = 0; i < 12; i++) body.transaction_history.push(help.randomInteger(2));

  for (let i = 0; i < 12; i++) body.cashflow_history.push(help.randomInteger(9));

  return body;
}
