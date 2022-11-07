const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Landing Page Statistics Data', () => {
  const baseUrl = req.getBackendUrl();
  const url = '/landing-page/statistics';
  let headers = req.createNewCoreHeaders();

  describe('#smoke', () => {
    it('Get statistics should return data needed for landing page', async function() {
      const startTime = help.startTime();
      const res = await chai.request(baseUrl)
        .get(url)
        .set(headers);
      const responseTime = help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      report.setIssue(this, "NH-71");
      report.setSeverity(this, "critical");

      let data = res.body.data;
      expect(data).to.have.all.keys(
        "total_fasilitas",
        "pinjaman_tersalurkan_sejak_berdiri",
        "nilai_pinjaman_lunas_sejak_berdiri",
        "jumlah_borrower_aktif",
        "pinjaman_tersalurkan_tahun_ini",
        "outstanding",
        "jumlah_pinjaman_tersalurkan",
        "jumlah_pinjaman_lunas",
        "jumlah_borrower_sejak_berdiri",
        "rata_rata_tingkat_pengembalian",
        "rata_rata_waktu_terdanai",
        "jumlah_pinjaman_untuk_didanai",
        "tkb90");

      for (let field of Object.keys(data)) {
        expect(data[field]).to.be.not.empty;
      }
    });

    it.skip('Statistics data should be mutated after cron is executed #manual');
  });
});