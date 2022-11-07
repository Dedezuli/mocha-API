/*
 *  Table involved
 *  Result:
 *  - login_data
 *  - user_data
 *  - business_data
 *  - legal_information
 *  - customer_information
 *  - ecommerce_partnership_list
 *  - partnership_info
 *  - sales_transaction
 *  - financial_trend
 *  - customer_role
 *  - customer_ecomm_applicant
 *  - referral_data
 *  - bank_information
 *
 */

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

describe('Integration Bukalapak Apply Loan', function () {
  const url = '/validate/integration/ecommerce/bukalapak/apply-loan';

  let boAccessToken;
  before(async function () {
    const boLoginRes = await req.backofficeLogin(boUser.admin.username, boUser.admin.password);
    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Bukalapak borrower registration should succeed #TC-553', async function () {
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
      const emailAddress = body.personal_info.email;

      const newcoreDb = require('knex')(newcoreDbConf);
      const row = await newcoreDb('login_data')
        .select('ld_fullname', 'ld_gender', 'ld_mobile_prefix', 'ld_no_hp')
        .where({
          ld_email_address: emailAddress
        })
        .first();
      expect(row.ld_fullname).to.eql(body.personal_info.full_name, 'ld_fullname');
      expect(row.ld_gender).to.eql(body.personal_info.gender.toUpperCase(), 'ld_gender');
      expect(row.ld_mobile_prefix).to.eql('1', 'ld_mobile_prefix');
      expect(row.ld_no_hp).to.eql(body.personal_info.phone_number, 'ld_no_hp');

      const rowUd = await newcoreDb('user_data')
        .select(
          'ud_ext_pob',
          'ud_pob',
          'ud_dob',
          'ud_identity_card_number',
          'ud_identity_card_expired',
          'ud_domicile_address',
          'ud_domicile_postal_code',
          'ud_domicile_province_txt',
          'ud_domicile_city_txt',
          'ud_domicile_district_txt',
          'ud_domicile_village_txt'
        )
        .where({
          ud_ci_id: customerId
        })
        .first();
      expect(rowUd.ud_pob).to.eql(99999, 'ud_pob');
      expect(rowUd.ud_ext_pob).to.eql(body.personal_info.birth_place, 'ud_pob_ext');
      expect(moment(rowUd.ud_dob).local().format('YYYY-MM-DD')).to.eql(
        body.personal_info.birth_date,
        'ud_dob'
      );
      expect(rowUd.ud_identity_card_number).to.eql(body.ktp.ktp_no, 'ud_identity_card_number');
      expect(
        moment(rowUd.ud_identity_card_expired).local().add(1, 'day').format('YYYY-MM-DD')
      ).to.eql(body.ktp.expired_date, 'ud_identity_card_expired');
      expect(rowUd.ud_domicile_address).to.eql(body.domicile.full_address, 'ud_domicile_address');
      expect(rowUd.ud_domicile_postal_code).to.eql(
        body.domicile.postal_code,
        'ud_domicile_postal_code'
      );
      expect(rowUd.ud_domicile_province_txt).to.eql(body.domicile.province, 'ud_domicile_province');
      expect(rowUd.ud_domicile_city_txt).to.eql(body.domicile.city, 'ud_domicile_city');
      expect(rowUd.ud_domicile_district_txt).to.eql(body.domicile.district, 'ud_domicile_district');
      expect(rowUd.ud_domicile_village_txt).to.eql(
        body.domicile.sub_district,
        'ud_domicile_village'
      );

      const rowBd = await newcoreDb('business_data')
        .select(
          'bd_land_line_number',
          'bd_description',
          'bd_doe',
          'bd_address',
          'bd_postal_code',
          'bd_province_txt',
          'bd_city_txt',
          'bd_district_txt',
          'bd_village_txt'
        )
        .where({
          bd_ci_id: customerId
        })
        .first();
      expect(rowBd.bd_land_line_number).to.eql(
        body.personal_info.phone_number,
        'bd_land_line_number'
      );
      expect(rowBd.bd_description).to.eql(body.shop_info.seller_desc, 'bd_description');
      expect(moment(rowBd.bd_doe).local().format('YYYY-MM-DD')).to.eql(
        body.shop_info.open_since,
        'bd_doe'
      );
      expect(rowBd.bd_address).to.eql(body.shop_info.offline_address.full_address, 'bd_address');
      expect(rowBd.bd_postal_code).to.eql(
        body.shop_info.offline_address.postal_code,
        'bd_postal_code'
      );
      expect(rowBd.bd_province_txt).to.eql(
        body.shop_info.offline_address.province,
        'bd_province_txt'
      );
      expect(rowBd.bd_city_txt).to.eql(body.shop_info.offline_address.city, 'bd_city_txt');
      expect(rowBd.bd_district_txt).to.eql(
        body.shop_info.offline_address.district,
        'bd_district_txt'
      );
      expect(rowBd.bd_village_txt).to.eql(
        body.shop_info.offline_address.sub_district,
        'bd_village_txt'
      );

      const rowLi = await newcoreDb('legal_information')
        .select('li_doc_number', 'li_doc_type')
        .where({
          li_ci_id: customerId,
          li_doc_number: body.npwp
        })
        .first();
      expect(rowLi, `li_doc_number ${body.npwp} on customerId ${customerId} not found`).to.be.not
        .undefined;

      const rowCi = await newcoreDb('customer_information')
        .select('ci_name')
        .where({
          ci_id: customerId
        })
        .first();
      expect(rowCi.ci_name).to.eql(body.shop_info.shop_name, 'ci_name');

      const rowPi = await newcoreDb('partnership_info')
        .select('pi_seller_link')
        .where({
          pi_ci_id: customerId
        })
        .first();
      expect(rowPi.pi_seller_link).to.eql(body.shop_info.shop_domain, 'pi_seller_link');

      const rowsSt = await newcoreDb('sales_transaction').select('st_amount', 'st_date').where({
        st_ci_id: customerId
      });
      for (const rowSt of rowsSt) {
        const date = moment(rowSt.st_date).local().format('YYYY-MM').split('-');
        const year = parseInt(date[0]);
        const month = parseInt(date[1]);
        expect(year).to.eql(body.cashflow_history[month - 1].year, 'st_date year part');
        expect(month).to.eql(body.cashflow_history[month - 1].month, 'st_date month part');
        expect(rowSt.st_amount).to.eql(body.cashflow_history[month - 1].value, 'st_amount');
      }

      const rowsFt = await newcoreDb('financial_trend').select().where({
        ft_ci_id: customerId
      });
      for (const rowFt of rowsFt) {
        if (rowFt.ft_trend_period === '1 to 2') {
          expect(rowFt.ft_gross_profit).to.eql(body.profit_margin, 'ft_gross_profit');
        }
      }

      const rowsBi = await newcoreDb('bank_information').select().where({
        bi_ci_id: customerId
      });
      for (const rowBi of rowsBi) {
        if (rowBi.bi_type === '29') {
          expect(rowBi.bi_bank_id).to.eql(body.bank_account.bankid, 'bi_bank_id');
          expect(rowBi.bi_bank_account_holder).to.eql(
            body.bank_account.account_name,
            'bi_bank_account_holder'
          );
          expect(rowBi.bi_bank_account_number).to.eql(
            body.bank_account.account_number,
            'bi_bank_account_number'
          );
        }
      }

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
  const currentDate = new Date();

  const body = {
    partner_name: 'bukalapak',
    loan_amount: parseInt(help.randomInteger(8)),
    loan_duration: parseInt(help.randomInteger(2)),
    loan_type: 1,
    loan_duration_type: 'Bulan',
    program_name: 'Fast Track Loan',
    create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    personal_info: {
      full_name: help.randomFullName(gender),
      gender: gender ? 'f' : 'm',
      birth_place: addr.city.name,
      birth_date: help.randomDate(1990),
      phone_number: help.randomInteger(12),
      email: help.randomEmail()
    },
    ktp: {
      ktp_no: help.randomInteger('KTP'),
      expired_date: help.futureDate(10)
    },
    npwp: help.randomInteger('NPWP', { formatNpwp: true }),
    domicile: {
      full_address: addr.address,
      postal_code: addr.postalCode,
      province: addr.province.name,
      city: addr.city.name,
      district: addr.district.name,
      sub_district: addr.subDistrict.name
    },
    shop_info: {
      shop_name: help.randomCompanyName(),
      shop_domain: help.randomUrl(),
      seller_desc: help.randomDescription(),
      open_since: help.randomDate(),
      ecommerce_open_since: '6-12 Bulan',
      offline_address: {
        full_address: bizAddr.address,
        postal_code: bizAddr.postalCode,
        province: bizAddr.province.name,
        city: bizAddr.city.name,
        district: bizAddr.district.name,
        sub_district: bizAddr.subDistrict.name
      }
    },
    cashflow_history: [],
    external_loans: [],
    rating: '',
    six_months_average_cashflow: '',
    profit_margin: parseInt(help.randomInteger(1)),
    bank_account: {
      bankid: 1,
      bank_name: 'Bank Mandiri',
      account_name: help.randomFullName(),
      account_number: help.randomInteger(10)
    },
    external_shop_info: [],
    sync: {
      referral: help.randomAlphaNumeric(6).toUpperCase(),
      activation_code: help.randomAlphaNumeric(7).toUpperCase(),
      hash_password: help.getDefaultPassword({ hash: 'hmac' }),
      va_number: help.randomInteger(8),
      bpdNumber: help.randomInteger(7)
    }
  };

  let totalCashflow = 0;
  for (let i = 0; i < 6; i++) {
    const cashflow = {
      month: i + 1,
      year: currentDate.getFullYear(),
      value: parseInt(help.randomInteger(9))
    };
    totalCashflow += cashflow.value;
    body.cashflow_history.push(cashflow);
  }

  body.six_months_average_cashflow = parseFloat(totalCashflow / 6);

  for (let i = 0; i < 3; i++) {
    body.external_loans.push({
      institution_name: `PT ${help.randomCompanyName()}`,
      loan_amount: parseInt(help.randomInteger(7)),
      term: parseInt(help.randomInteger(1))
    });
  }

  for (let i = 0; i < 2; i++) {
    body.external_shop_info.push({
      ecommerce_name: help.randomCompanyName(),
      domain: help.randomUrl()
    });
  }

  return body;
}
