[![js-semistandard-style](https://raw.githubusercontent.com/standard/semistandard/master/badge.svg)](https://github.com/standard/semistandard)

# qa-backend-mocha

API testing using [Mocha](https://mochajs.org).

## Table of Contents

- [Table of Contents](#markdown-header-table-of-contents)
- [Getting Started](#markdown-header-getting-started)
    - [Prerequisites](#markdown-header-prerequisites)
    - [Installing](#markdown-header-installing)
    - [Usage](#markdown-header-usage)
    - [Using Docker](#markdown-header-using-docker)
- [Coding Style and Rules](#markdown-header-coding-style-and-rules)
    - [Semistandard Style and Pre-commit Hook](#markdown-semistandard-style-and-pre-commit-hook)
    - [Folder Structure](#markdown-header-folder-structure)
    - [Module Alias](#markdown-header-module-alias)
- [Writing Test Case](#markdown-header-writing-test-case)
    - [Good Test Case Title](#markdown-header-good-test-case-title)
    - [Arrange Act Assert Pattern](#markdown-header-arrange-act-assert-pattern)
    - [Test Case Essential Components](#markdown-header-test-case-essential-components)
    - [How to Use Describe and It](#markdown-header-how-to-use-describe-and-it)
    - [Skipping Test](#markdown-header-skipping-test)
    - [Fixtures](#markdown-header-fixtures)
- [Use Visual Studio Code](#markdown-header-use-visual-studio-code)
- [Troubleshooting](#markdown-header-troubleshooting)
    - [Connect to Multiple VPNs](#markdown-header-connect-to-multiple-vpns)
    - [Fail to Discover Database Domain Name](#markdown-header-fail-to-discover-database-domain-name)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for testing purposes.

### Prerequisites

Install git and npm. For Debian/Ubuntu distribution:

```
$ sudo apt install npm git
```

For Windows, download installer using links below:

- [npm](https://nodejs.org/en/)
- [git](https://git-scm.com/downloads)

### Installing

These are the steps to install qa-backend-mocha

```bash
$ git clone git@bitbucket.org:investree/qa-backend-mocha.git
$ cd qa-backend-mocha
$ npm install
```

### Usage

```
$ ENV=<environment_name> npm run test -- /path/to/test/folder
```

For example, BIZ tribe

```
$ ENV=tribe-biz npm run test -- /path/to/test/folder
```

or staging environment

```
$ ENV=stg npm run test -- /path/to/test/folder
```

### Using Docker

1. Install docker
2. Change current working directory to this project
3. Build docker image

```
$ docker build -t qa-backend-mocha .
```

4. Run your test

```
$ docker run -v $(pwd):/qa-backend-mocha -it qa-backend-mocha:latest test ./path/to/test/folder
```

Tip: For those who uses bash, you can create an alias for those commands so you don't need to retype all of them. To create an alias, create a `.bash_profile` file in your home directory

```
$ cd
$ touch .bash_profile
```

Edit `.bash_profile` using your favorite text editor and put these inside your file

```
alias mocha='docker build -t qa-backend-mocha .; docker run -v $(pwd):/qa-backend-mocha -it qa-backend-mocha:latest test'
```

Then, execute `source .bash_profile` or simply restart your terminal

To test whether your alias works,

```
$ ENV=<environment_name> mocha ./path/to/test/folder
```

Why are we going through the hassle by not using docker-compose? Because somehow docker-compose makes running test suite slower. If you have any suggestion regarding this matter, feel free to contact QA team.

## Coding Style and Rules

Before contributing to this repository, please read and follow these rules:

### Semistandard Style and Pre-commit Hook

This repository uses semistandard style. Semistandard is [Standard JS rules](https://standardjs.com/rules.html) with semicolon.

Pre-commit hook will be triggered before running `git commit`. There are two processes involved in pre-commit:

- Prettier: To automatically prettify staged files which format defined in `.prettierrc.js`
- Eslint: To evaluate staged files using rule defined in `.eslintrc.js` and possibly fix fixable problems

If one of those processes returns error, you won't be able to commit unless you fix it manually. In order to know the error(s) before you even do `git commit`, please install Eslint extension referred in [Use Visual Studio Code](#markdown-use-visual-studio-code) section.

### Folder Structure

These are the rules for folder structure:

- Folder name should be written in **lowercase**.
- Folder name should be separated by `-` character.
- Folder should be created per API endpoint.
- Folder should only contain test file(s), e.g. **\*.js** files.

```
 test
    |_ users
        |_ frontoffice
        |   |_ register
        |   |   |_ register.js
        |   |_ user
        |   |   |_ user.js
        |   |_ update
        |       |_ update.js
        |_ auth
            |_ login
                |_ login.js
```

### Module Alias

Because we have test scripts that most likely will be inside long path, we use **module-alias** so requiring module doesn't have to use relative path. **module-alias** register will be run once as defined in `.mocharc.yml`.

## Writing Test Case

Is this your first time writing test case in Mocha? Don't worry! These general guidelines will help you.

### Good Test Case Title

A good test case starts with an easy-to-understand title. What you wrote will be used and read by stakeholders, e.g. developers, product owner, release committee, etc. So it's a necessary for us to develop a good test case title. It also makes you (as a QA) easier to develop testcase implementation because the "action" and "expectation" are defined.

A good title uses this structure:

    [Object / Activity] should [Expectation]

For example: Borrower registration using invalid email format should return relevant error message

Tip: After writing a title, try to read your title as a non-QA person in one go. If that title makes sense and easy to understand, then you are doing it right.

### Arrange Act Assert Pattern

A good test case implementation consist of three parts: Arrange, Act, Assert.

- Arrange: Prepare for test case preconditions

- Act: Does the thing that mentioned in test case title

- Assert: Make sure that 'Act' result meets our expectation

### Test Case Essential Components

A test case implementation must consist of at least:

- Add testcase ID at the end of your testcase title

  For example: `Login using valid credential should succeed #BE-1`.

  Notice there is `#BE-1` at the end of testcase title. Testcase ID begins with hashtag symbol ('#').

  To get the ID, use your favorite DB client and connect to qa_report DB (see knexfile.js for the credential).

  Go to 'qa' database > 'utilities' schema. Then, do this query: `select new_be_id(how_many_testcase_ids);`.

  Let's say you have implemented 10 testcases. Do steps above, then query: `select new_be_id(10)`.

  It will show 10 generated testcase IDs. Add those IDs at the end of each testcase titles you have implemented.

- report.setIssue()

  To assign which JIRA issue related to this test case.

- report.setSeverity()

  To assign which severity this test case belongs to. There are three kind of severities: 'blocker', 'critical', and 'minor'.
  What is test case severity? Check out [this reference](https://www.lambdatest.com/blog/bug-severity-vs-priority-in-testing-with-examples/).
  Sometimes S1 is also called critical. But, don't confuse it with our 'critical'.
  To keep it relevant with any severity reference, treat 'blocker' as S1, 'critical' as S2, 'minor' as S3 or S4 (we grouped S3 and S4 since it has too many similarities).

- report.setPayload() or report.setInfo()

  To provide context of your test case implementation.

- Make sure your test case is atomic by ASSERTING ONLY WHATEVER YOUR TEST CASE DESCRIBED

  Suppose your test case title is `Login as borrower should return 200`.
  Call assertion for status code 200 right after action is done. Don't assert anywhere else in that test case!

- Don't evaluate response body structure as expectation!

  Self-explanatory. That kind of test belongs in unit test, not integration test.

  For example, the response body has "code", "body", and "meta".

  Don't make an expectation for the existence of "code", "body", and/or "meta" field in response body.

- Always report test case action response time! (see line 10, 11-14, 15, 17)

  Also, make sure there is only one response time report. Report parser only fetches the last response time in your test case implementation.

```
1   it('Login as borrower should succeed', async function() {
2       // Arrange
3       let body = {
4           "username": username,
5           "password": help.getDefaultPassword(),
6           "flag": 1
7       };
8
9       // Act
10      const startTime = help.startTime();
11      const res = await chai.request(req.getSvcUrl())
12            .post(loginUrl)
13            .set(req.createNewCoreHeaders())
14            .send(body); // test case action
15      const responseTime = help.responseTime(startTime);
16
17      report.setPayload(this, res, responseTime);
18      report.setIssue(this, 'OBS-1802');
19      report.setSeverity(this, 'blocker');
20
21      // Assert
22      expect(res).to.have.status(200);
23  });
```

### How to Use Describe and It

- Use **describe()** to provide context for test cases inside it
  - Use it to group test cases
  - Write feature name on **describe()**, e.g. "OTP Verification"
  - Write inner describe to group #smoke and #negative cases
- Write test case name inside **it()**

```
describe('OTP Verification', function () {
    describe('#smoke', function () {
        it('Invalid OTP code 5 times should block OTP');
    });
    describe('#negative', function () {
        // negative test cases
    });
});
```

### Skipping Test

If you want to prepare test cases before user story moved to In Review or for some reasons need to skip the test, use **it.skip()**.

```
describe('Frontoffice Register', function () {
    it.skip('Maximum phone number length should be 12');
});
```

### Fixtures

Fixtures will be placed inside /fixtures folder. To access it inside your script, concatenate `__dirname` as prefix to your path.

```
let imageFile = __dirname + '/fixtures/ktpSelfie.jpg';
```

Make fixture file name simple and meaningful. For example, we need a profile picture image fixture. Don't name it **mountain.jpg**. Instead, name it in **lowerCamelCase**, e.g. **profilePicture.jpg**

```
qa-backend-mocha
    |_ fixtures
        |_images
        |   |_ profilePicture.jpg
        |   |_ ktpSelfie.jpg
        |_borrower_individual.json
```

## Use Visual Studio Code

This project had been setup with **jsconfig.json** to enable VS Code Intellisense (autocompletion).

Run or debug test suite or test case in a single click using this VS Code extension:

- Testify (felixjb.testify)

Add these lines to VS Code `settings.json` to change ENV either to tribe or staging, e.g. `tribe-newhope` or `stg`.
Make sure to define the path to mocha executable.

    "testify.envVars": {
        "ENV": "tribe-newhope"
    },
    "testify.testRunnerPath": "node_modules/mocha/bin/mocha"

- Eslint (dbaeumer.vscode-eslint)

This extension runs eslint against your code in the background. It will output the error in Problems tab.

Tip: **To know linter error(s) that is happening in your code, installing this extension without using optional setting below is already enough**.

Optionally, you could make eslint fix your code on save which is not recommended since it slows down save time. In order to that, add these lines to `settings.json`.

    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    }

- Prettier (esbenp.prettier-vscode)

This extension runs prettier to clean your code.

Add these lines to VS Code `settings.json`.

    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"

## Troubleshooting

Here are some common problems that possibly happen when you try to run the test

### Connect to Multiple VPNs

Testcases that check for legacy and new core data synchronization need to be run using two different VPNs at once
if using staging environment (ENV=stg). For Mac or Linux users, there is no need to this because network interface
will be created on-demand. For Windows however, you need to create another tap driver. To do that, please follow these steps:

- Press Windows button
- Find "Add a new TAP virtual ethernet adapter"
- Follow the steps until a new TAP adapter is successfully created
- Go to the directory where you store your .ovpn file
- Right click and choose "Start OpenVPN on this config file"
- Do the same thing for the other config file

### Fail to Discover Database Domain Name

Sometimes DNS resolver fails to resolve our internal database domain. To solve this problem:

Linux

- Edit resolv.conf (sudo vim /etc/resolv.conf)
- Change nameserver to 1.1.1.1 or 8.8.8.8

Windows

- Go to Control Panel\Network and Internet\Network Connections
- Right click on your network adapter that is connected to internet
- Click Properties
- Click Internet Protocol Version 4 and click Properties
- Choose "Use the following DNS server addresses" radio button
- On Preferred DNS server, fill 1.1.1.1 or 8.8.8.8
- Click OK
