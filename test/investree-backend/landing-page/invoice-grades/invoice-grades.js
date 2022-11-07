const help = require('@lib/helper');
const req = require('@lib/request');
const report = require('@lib/report');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

describe('Landing Page Invoice Grades', () => {
	const baseUrl = req.getBackendUrl();
	const url = '/landing-page/invoice-grades';
  let headers = req.createNewCoreHeaders();

	describe('#smoke', () => {
		it('Get conventional invoice grades should return array of grades', async function() {
			const startTime = help.startTime();
			const res = await chai.request(baseUrl)
        .get(`${url}?preference=conventional`)
        .set(headers);
			const responseTime = help.responseTime(startTime);

			report.setPayload(this, res, responseTime);
			report.setIssue(this, "NH-260");
      report.setSeverity(this, "critical");

			let dataArray = res.body.data;
			expect(dataArray).to.be.an('array');
			for (let data of dataArray) {
				expect(data).to.have.all.keys('name', 'rate', 'description');

				for (let field of Object.keys(data)) {
					expect(data[field].toString()).to.be.not.empty;
				}
			}
		});

		it('Get conventional invoice grades without accept-language should return id_ID array of grades', async function() {
			const startTime = help.startTime();
			const res = await chai.request(baseUrl)
        .get(`${url}?preference=conventional`)
        .set(headers);
			const responseTime = help.responseTime(startTime);

			report.setPayload(this, res, responseTime);
			report.setIssue(this, "NH-260");
      report.setSeverity(this, "critical");

			let dataArray = res.body.data;
			let tinggiFound = false;
			for (let data of dataArray) {
				if (data.name.includes('Tinggi')) {
					tinggiFound = true;
					break;
				}
			}
			expect(tinggiFound, `Grade that includes string 'Tinggi' not found`).to.be.true;
		});

		it('Get conventional invoice grades en_US should return english names of grades', async function() {
			const startTime = help.startTime();
			const res = await chai.request(baseUrl)
        .get(`${url}?preference=conventional`)
        .set(req.createNewCoreHeaders({
					"Accept-Language": "en_US"
				}));
			const responseTime = help.responseTime(startTime);

			report.setPayload(this, res, responseTime);
			report.setIssue(this, "NH-260");
      report.setSeverity(this, "critical");

			let dataArray = res.body.data;
			let highFound = false;
			for (let data of dataArray) {
				if (data.name.includes('High')) {
					highFound = true;
					break;
				}
			}
			expect(highFound, `Grade that includes string 'High' not found`).to.be.true;
		});

		it('Get sharia invoice grades should return description with approximation symbol ~', async function() {
			const startTime = help.startTime();
			const res = await chai.request(baseUrl)
        .get(`${url}?preference=sharia`)
        .set(headers);
			const responseTime = help.responseTime(startTime);

			report.setPayload(this, res, responseTime);
			report.setIssue(this, "NH-260");
      report.setSeverity(this, "critical");

			let dataArray = res.body.data;
			let notApproxFound = false;

			for (let data of dataArray) {
				if (!data.description.includes('~')) {
					notApproxFound = true;
					break;
				}
			}
			expect(notApproxFound, `Found at least 1 description without '~' symbol`).to.be.false;
		});

		it.skip('Invoice grades should be mutated after data update and cache expired #manual');
	});
});
