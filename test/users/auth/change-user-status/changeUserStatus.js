const help = require('@lib/helper');
const request = require('@lib/request');
const report = require('@lib/report');
const expect = require('chai').expect;
const boUser = require('@fixtures/backoffice_user');
const chai = require('chai');
const newcoreDbConf = require('@root/knexfile.js')[request.getEnv()];

describe('Backoffice User List Change User Status', function () {
  this.timeout(0);
  const url = '/validate/users/auth/change-user-status';
  const userListUrl = '/validate/user-search/backoffice/frontoffice';
  const STATUS_ACTIVE = 1;
  const STATUS_INACTIVE = 0;

  let boAccessToken;

  before(async function () {
    const boLoginRes = await request.backofficeLogin(boUser.admin.username, boUser.admin.password);

    boAccessToken = boLoginRes.data.accessToken;
  });

  describe('#smoke', function () {
    it('Backoffice user list change user status to Inactive should succeed #TC-433', async function () {
      const indRegisterRes = await request.borrowerRegister(false, ['all']);
      const indCustomerId = indRegisterRes.customerId;

      let loginId;

      const newcoreDb = require('knex')(newcoreDbConf);
      return newcoreDb
        .select('ld_id')
        .from('login_data')
        .whereIn('ld_id', function () {
          this.select('ci_created_by').from('customer_information').where({
            ci_id: indCustomerId
          });
        })
        .first()
        .then((row) => {
          loginId = row.ld_id;
        })
        .then(async () => {
          loginId;
          const startTime = help.startTime();
          const res = await chai
            .request(request.getSvcUrl())
            .post(`${url}/${loginId}/${STATUS_INACTIVE}`)
            .set(
              request.createNewCoreHeaders({
                'X-Investree-Token': boAccessToken
              })
            )
            .send({
              id: loginId,
              status: STATUS_INACTIVE
            });
          const responseTime = help.responseTime(startTime);

          report.setPayload(this, res, responseTime);

          await help.sleep(15000); // wait until elasticsearch refreshes

          const refreshUserListRes = await chai
            .request(request.getSvcUrl())
            .get(userListUrl)
            .set(
              request.createNewCoreHeaders({
                'X-Investree-Token': boAccessToken
              })
            )
            .query({
              page: 1,
              size: 10
            });

          const status = refreshUserListRes.body.data.data[0].status;
          expect(status, 'Status is still Active').to.be.false;
        });
    });

    it('Backoffice user list change user status to Active should succeed #TC-434', async function () {
      const tries = 10;

      await help.sleep(15000); // wait until elasticsearch refreshes
      let loginId;
      let attempt = tries;
      while (attempt--) {
        if (loginId) {
          break;
        }

        const userListRes = await chai
          .request(request.getSvcUrl())
          .get(userListUrl)
          .set(
            request.createNewCoreHeaders({
              'X-Investree-Token': boAccessToken
            })
          )
          .query({
            page: 1,
            size: 10
          });
        loginId = userListRes.body.data.data[0].loginId;
        await help.sleep(1000);
      }

      const inactiveStartTime = help.startTime();
      const inactiveRes = await chai
        .request(request.getSvcUrl())
        .post(`${url}/${loginId}/${STATUS_INACTIVE}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send({
          id: loginId,
          status: STATUS_INACTIVE
        });

      const inactiveResponseTime = help.responseTime(inactiveStartTime);

      report.setPayload(this, inactiveRes, inactiveResponseTime);

      const activateStartTime = help.startTime();
      const activateRes = await chai
        .request(request.getSvcUrl())
        .post(`${url}/${loginId}/${STATUS_ACTIVE}`)
        .set(
          request.createNewCoreHeaders({
            'X-Investree-Token': boAccessToken
          })
        )
        .send({
          id: loginId,
          status: STATUS_ACTIVE
        });
      const activateResponseTime = help.responseTime(activateStartTime);

      report.setPayload(this, activateRes, activateResponseTime);

      await help.sleep(15000); // wait until elasticsearch refreshes
      let status;
      attempt = tries;
      while (attempt--) {
        if (status) {
          break;
        }

        const userListRes = await chai
          .request(request.getSvcUrl())
          .get(userListUrl)
          .set(
            request.createNewCoreHeaders({
              'X-Investree-Token': boAccessToken
            })
          )
          .query({
            page: 1,
            size: 10
          });
        status = userListRes.body.data.data[0].status;
        await help.sleep(1000);
      }
      expect(status, 'Status is still Inactive').to.be.true;
    });
  });
});
