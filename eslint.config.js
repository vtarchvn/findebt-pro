import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  },
  {
    files: ['src/server/**/*.js'],
    languageOptions: {
      globals: Object.fromEntries(['PropertiesService','SpreadsheetApp','Utilities','Session','MailApp','LockService','HtmlService','ScriptApp','DriveApp','DocumentApp','MimeType'].map(name => [name, 'readonly']))
    }
  }
];
