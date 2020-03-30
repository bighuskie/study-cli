const axios = require('axios');
const ora = require('ora');
const inquirer = require('inquirer');
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');

downloadGitRepo = promisify(downloadGitRepo);
const path = require('path');
let ncp = require('ncp');

ncp = promisify(ncp);

const metalsimth = require('metalsmith');
let { render } = require('consolidate').ejs;

render = promisify(render);

const fs = require('fs');

const { downloadTemplateDir } = require('../constants');

const fetchReposList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};

const fetchTagsList = async (repo) => {
  const { data } = await axios.get(
    `https://api.github.com/repos/zhu-cli/${repo}/tags`,
  );
  return data;
};

const loading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const data = await fn(...args);
  spinner.succeed();
  return data;
};

const downloadTemplate = async (repo, tag) => {
  let url = `zhu-cli/${repo}`;
  if (tag) {
    url += `#/${tag}`;
  }
  const dest = `${downloadTemplateDir}/${repo}`;
  await downloadGitRepo(url, dest);
  return dest;
};

module.exports = async (projectName) => {
  const repoList = await loading(fetchReposList, 'fetching template...')();
  const repos = repoList.map((item) => item.name);
  const { repo } = await inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choose a template to create a project',
    choices: repos,
  });
  const tagsList = await loading(fetchTagsList, 'fetching tags...')(repo);

  const tags = tagsList.map((item) => item.name);
  const { tag } = await inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choose a tag to create a project',
    choices: tags,
  });
  const dest = await loading(downloadTemplate, 'downloading template...')(
    repo,
    tag,
  );

  const isAskjsExist = fs.existsSync(path.join(dest, 'ask.js'));
  const destination = path.join(process.cwd(), projectName);

  if (!isAskjsExist) {
    await ncp(dest, destination);
  } else {
    await new Promise((resolve, reject) => {
      metalsimth(__dirname)
        .source(dest)
        .destination(destination)
        .use(async (files, metal, done) => {
          const askConfigs = eval(`${files['ask.js'].contents.toString()}`);
          const userConfigs = await inquirer.prompt(askConfigs);
          const meta = metal.metadata();
          Object.assign(meta, userConfigs);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          const config = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, config);
                files[file].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }
};
