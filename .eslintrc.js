'use strict';

module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  extends: ['semistandard', 'plugin:mocha/recommended', 'plugin:json/recommended'],
  rules: {
    'no-var': 2,
    'no-unused-expressions': 0,
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-param-reassign': 2,
    'no-return-await': 2,
    'require-await': 2,
    yoda: 2,
    'no-shadow': 2,
    'spaced-comment': 2,
    'mocha/no-exclusive-tests': 2,
    'mocha/valid-test-description': [
      'error',
      {
        pattern: '(S|s)hould.+ #TC-',
        testNames: ['it'],
        message: "Title must include 'should' and ' #TC-'"
      }
    ]
  }
};
