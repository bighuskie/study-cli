const { version } = require('../../../package.json');

const envRootName = process.platform === 'darwin' ? 'HOME' : 'USERPROFILE';
const envRootDir = process.env[envRootName];
const downloadTemplateDir = `${envRootDir}/.tmp`;

module.exports = {
  version,
  downloadTemplateDir,
};
