function doGet(e) { return FinDebtApp.doGet(e); }
function initialize(company) { return FinDebtApp.initialize(company); }
function bootstrap() { return FinDebtApp.bootstrap(); }
function savePartner(input) { return FinDebtApp.savePartner(input); }
function createDocument(input) { return FinDebtApp.createDocument(input); }
function recordPayment(input) { return FinDebtApp.recordPayment(input); }
function voidRecord(table, id) { return FinDebtApp.voidRecord(table, id); }
function savePromise(input) { return FinDebtApp.savePromise(input); }
function saveBankAccount(input) { return FinDebtApp.saveBankAccount(input); }
function getVietQr(documentId, accountId) { return FinDebtApp.getVietQr(documentId, accountId); }
function processReminders() { return FinDebtApp.processReminders(); }
function createReminderTrigger() { return FinDebtApp.createReminderTrigger(); }
function createBackupTrigger() { return FinDebtApp.createBackupTrigger(); }
function createBackup() { return FinDebtApp.createBackup(); }
function listBackups() { return FinDebtApp.listBackups(); }
function restoreBackup(fileId) { return FinDebtApp.restoreBackup(fileId); }
function exportCsv(table) { return FinDebtApp.exportCsv(table); }
function importCsv(entityType, csvText, fileName) { return FinDebtApp.importCsv(entityType, csvText, fileName); }
function generateDebtPdf(partnerId) { return FinDebtApp.generateDebtPdf(partnerId); }
