const config = require('@root/config');
const addContext = require('mochawesome/addContext');

function setPayload(self, res, responseTime = null) {
  let responseJson = null;
  try {
    responseJson = JSON.parse(res.text);
  } catch (e) {
    responseJson = res.body;
  }

  if (responseJson && Object.keys(responseJson).length === 0) {
    responseJson = res.error; // body doesn't have error
  }

  addContext(self, {
    "title": "Request Payload",
    "value": res.request
  });

  addContext(self, {
    "title": "Response Payload",
    "value": responseJson
  });

  if (responseTime !== null) {
    addContext(self, {
      "title": "Response Time",
      "value": `${responseTime} ms`
    });
  }
}

function setInfo(self, text, title = "Info") {
  addContext(self, {
    "title": title,
    "value": text
  });
}

function setIssue(self, issueNumber) {
  issueNumber = issueNumber.toUpperCase().trim();
  if (issueNumber.split('-').length !== 2) {
    let strPart = issueNumber.match(/\D/g).join('');
    issueNumber = issueNumber.replace(/\D/g, '');
    issueNumber = strPart + '-' + issueNumber;
  }
  addContext(self, {
    "title": "JIRA Issue",
    "value": issueNumber
  });
}

function setSeverity(self, severity) {
  severity = severity.toLowerCase().trim();
  if (severity === 'blocker' ||
    severity === 'critical' ||
    severity === 'minor')
    addContext(self, {
      "title": "Severity",
      "value": severity
    });
  else
    throw new Error('[ERROR] setSeverity can only be blocker, critical, or minor');
}

function attachFile(self, filePath) {
  let newFilePath;
  let buildUrl = process.env.BUILD_URL;
  if (!buildUrl) {
    newFilePath = filePath;
  } else {
    let splitted = filePath.split('/');
    let fileName = splitted[splitted.length - 1];
    newFilePath = buildUrl + `artifact/fixtures/documents/random/${fileName}`;
  }
  addContext(self, newFilePath);
}

module.exports = {
  setPayload: setPayload,
  setInfo: setInfo,
  setIssue: setIssue,
  setSeverity: setSeverity,
  attachFile: attachFile
}
