import { defineConfig } from 'checkly';
import { EmailAlertChannel, Frequency } from 'checkly/constructs';

const sendDefaults = {
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: true,
};

// TODO: Add your production URL
const productionURL = 'https://sonava.com.au';

const emailChannel = new EmailAlertChannel('email-channel-1', {
  // TODO: add your own email address, Checkly will send you an email notification if a check fails
  address: 'sam.tape@mcc-ltd.com.au',
  ...sendDefaults,
});

export const config = defineConfig({
  // TODO: Add your own project name, logical ID, and repository URL
  projectName: 'SaaS Boilerplate',
  logicalId: 'saas-boilerplate',
  repoUrl: 'https://github.com/ixartz/Next-js-Boilerplate',
  checks: {
    locations: ['au-east-1'],
    tags: ['website'],
    runtimeId: '2024.02',
    browserChecks: {
      frequency: Frequency.EVERY_24H,
      testMatch: '**/tests/e2e/**/*.check.e2e.ts',
      alertChannels: [emailChannel],
    },
    playwrightConfig: {
      use: {
        baseURL: process.env.ENVIRONMENT_URL || productionURL,
        extraHTTPHeaders: {
          'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN,
        },
      },
    },
  },
  cli: {
    runLocation: 'eu-west-1',
    reporters: ['list'],
  },
});

export default config;
