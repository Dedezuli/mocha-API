module.exports = {
  trailingComma: 'none',
  tabWidth: 2,
  singleQuote: true,
  printWidth: 100,
  overrides: [
    {
      files: ['*.json'],
      options: {
        tabWidth: 4
      }
    }
  ]
};
