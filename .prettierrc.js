module.exports = {
  ...require('prettier-config-standard'),
  plugins: ['prettier-plugin-multiline-arrays'],
  printWidth: 120,
  singleAttributePerLine: false,
  bracketSameLine: true,
  trailingComma: 'none',
  multilineArraysWrapThreshold: 2
}
