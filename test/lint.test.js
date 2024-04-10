const {ESLint} = require('eslint');

test('(5 pts) eslint lint', async () => {
  let eslint = new ESLint();
  const results = await eslint.lintFiles(['**/*.js']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  // Filter out warnings if you only want to fail the test for errors
  const hasErrors = results.some((result) => result.errorCount > 0);

  if (hasErrors) {
    console.error(resultText);
    throw new Error('Linting errors found');
  }
});

