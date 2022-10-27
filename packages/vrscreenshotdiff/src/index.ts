import * as yargs from 'yargs';
import { runUploadBaselineData } from './baselineUploadManager';
import { runScreenshotDiffing } from './screenshot-pr-diffing';
// import { runScreenshotDiffing } from "./screenshotDiffingManager";

const screenshotDiffCli = async () => {
  yargs
    .strict()
    .version(false)
    .option('clientType', {
      description: 'Client type of the build',
      alias: 'c',
      type: 'string',
      demandOption: true,
    })
    .option('buildId', {
      description: 'Build ID of the ADO build',
      alias: 'b',
      normalize: true,
      type: 'number',
      demandOption: true,
    })
    .option('lkgCIBuild', {
      description: 'Last green CI build ID',
      alias: 'g',
      normalize: true,
      type: 'number',
      demandOption: false,
    })
    .option('pilot', {
      description: 'Pilot users for Screenshot diffing test',
      alias: 'p',
      type: 'string',
      demandOption: false,
    })
    .command(
      'release',
      'Run this command if executing on the release build',
      yargs => yargs,
      async argv => {
        await runUploadBaselineData(argv.buildId);
      },
    )
    .command(
      'pr',
      'Run this command if executing on the PR build',
      yargs => yargs,
      async argv => {
        await runScreenshotDiffing(argv.buildId, argv.lkgCIBuild);
      },
    )
    .demandCommand().argv;
};

const tryScreenshotDiffCli = async (retriesLeft: number) => {
  try {
    screenshotDiffCli();
  } catch (err: any) {
    if (retriesLeft > 0) {
      console.log(`screenshotDiffCli Failed -- ${retriesLeft} retries left -- ${err}`);
      return tryScreenshotDiffCli(retriesLeft - 1);
    }
    throw err;
  }
  return;
};

tryScreenshotDiffCli(3);
