const { program } = require('commander');
const path = require('path');
const { version } = require('../constants');

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: ['study-cli create <project-name>'],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'study-cli config set <config-name> <config-value>',
      'study-cli config get <config-name>',
    ],
  },
};

Reflect.ownKeys(mapActions).forEach((action) => {
  const { alias, description } = mapActions[action];
  program
    .command(action)
    .alias(alias)
    .description(description)
    .action(() => {
      if (action) {
        const args = process.argv.slice(3);
        require(path.resolve(__dirname, action))(...args);
      }
    });
});

program.on('--help', () => {
  console.info('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    const { examples } = mapActions[action];
    examples.forEach((item) => {
      console.info(`  ${item}`);
    });
  });
});

program.version(version).parse(process.argv);
