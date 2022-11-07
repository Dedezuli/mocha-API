const chai = require('chai');
const expect = require('chai').expect;
const help = require('@lib/helper');
const report = require('@lib/report');
const request = require('@lib/request');
const sbnUrl = 'https://sbn.investree.id';
const careerUrl = 'https://career.investree.id';
const promoUrl = 'https://promo.investree.id';
const blogUrl = 'https://investree:investme!@blog.investree.tech';

describe('Landing Page Routes Collection', function () {
  describe('#smoke', function () {
    it('Routing to "Pendanaan-Semua Pinjaman" should be succeed #TC-70', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/invest');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to Pendanaan Pinjaman Konventional should be succeed #TC-71', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/invest/funding/conventional');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to "Pendanaan Pinjaman Sharia" should be succeed #TC-72', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/invest/funding/sharia');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Reksa Dana for Lender" should be succeed #TC-73', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/reksadana');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "SBN Ritel" should be succeed #TC-74', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(sbnUrl).get('/');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Pinjaman-Semua Pinjaman" should be succeed #TC-75', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/loan');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to "Pinjaman-Buyer Financing" should be succeed #TC-76', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getFrontendUrl())
        .get('/business-loan/buyer-financing');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to "Invoice Financing Konventional" should be succeed #TC-77', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getFrontendUrl())
        .get('/loan/invoice-financing/conventional');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Invoice Financing Sharia" should be succeed #TC-78', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getFrontendUrl())
        .get('/loan/invoice-financing/sharia');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Informasi-Cara Kerja" should be succeed #TC-79', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/how-it-works');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to "Informasi-Promosi" Page should be succeed #TC-80', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(promoUrl).get('/');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });

    it('Routing to "Informasi-Risiko Pendanaan" should be succeed #TC-81', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/how-it-works/know-your-risk');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Informasi-FAQ" should be succeed #TC-82', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/how-it-works/general-faq');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Informasi-Biaya-biaya" should be succeed #TC-83', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getFrontendUrl())
        .get('/how-it-works/interest-rate-fee');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Profil Perusahaan" should be succeed #TC-84', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/about-us');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Media" should be succeed #TC-85', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(blogUrl).get('/media');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Siaran Pers" should be succeed #TC-86', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(blogUrl).get('/press-release');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Blog" should be succeed #TC-87', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(blogUrl).get('/');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Karir" should be succeed #TC-88', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(careerUrl).get('/');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Hubungi Kami" should be succeed #TC-89', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/contact');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "TKB90" should be succeed #TC-90', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/informasi/tkb90');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Investree - Pelajari Lebih Lanjut" should be succeed #TC-91', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/how-it-works');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Berikan Pendanaan" should be succeed #TC-92', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/v3/auth/registration/lender');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Ajukan Pinjaman" should be succeed #TC-93', async function () {
      const startTime = await help.startTime();
      const res = await chai
        .request(request.getFrontendUrl())
        .get('/v3/auth/registration/borrower');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Ketentuan Penggunaan" should be succeed #TC-94', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/term-of-use');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Kebijakan Cookie" should be succeed #TC-95', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/cookie-policy');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Kebijakan Privacy" should be succeed #TC-96', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/privacy-policy');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
    it('Routing to "Kebijakan Layanan" Pengaduan should be succeed #TC-97', async function () {
      const startTime = await help.startTime();
      const res = await chai.request(request.getFrontendUrl()).get('/layanan-pengaduan-investree');
      const responseTime = await help.responseTime(startTime);

      report.setPayload(this, res, responseTime);
      expect(res).to.have.property('status', 200);
    });
  });
});
