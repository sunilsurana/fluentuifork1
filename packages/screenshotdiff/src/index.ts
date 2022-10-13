export const Greeter = (name: string) => `Hello ${name}`;
import { prepareFolders } from './directoryHelper';
import { getParentCommitFromMaster } from './azure-builddata/getParentCommitFromMaster';
import {
  // BaselineScreenshotContainer1JS,
  // BlobDowloadConfig,
  // BlobUploadConfig,
  // cleanupDirectories,
  // CommitDetails,
  // createFolderInApp,
  // createPrComment,
  // deleteArtifactsFromBlobStorage,
  // downloadBuildArtifact,
  // flattenDirectory,
  getApis,
  // getArtifactsFromBlobStorageAndWriteToLocalFolder,
  // getArtifactsFromBlobStorageDirectoriesAndWriteToLocalFolder,
  // getArtifactsFromLocalFolderAndWriteToBlobStorage,
  // getDefaultBlobDownloadConfig,
  // getDefaultBlobUploadConfig,
  // getParentCommitFromMaster,
  // getfirstCommitOfLGCI,
  // getProject,
  // insertCommitDetailsInBaselineTable,
  // isAnyBlobWithPrefixAvailable,
  // prepareFolders,
  // ReportDetail,
  // ScreenshotArtifact,
} from './midgardbot-core';
import { BlobUploadConfig, CommitDetails, ScreenshotArtifact } from './types';
import { Octokit as gihubApi } from '@octokit/rest';
import { getEnv } from './getEnv';
import { getDefaultBlobUploadConfig } from './azure-storage/azureStorageCommon';
import { downloadBuildArtifact } from './azure-builddata/getBuildArtifact';

// import { Octokit as gihubApi } from '@octokit/net';

const octokit = new gihubApi({
  auth: getEnv('GITHUB_API_TOKEN'),
});

console.log('Starting screenshot diff');

startDiffing();

async function startDiffing(): Promise<void> {
  console.log('test');
  await runScreenshotDiffing();
}

export async function runScreenshotDiffing(): Promise<void> {
  // buildId: number,
  // clientType: string,
  // pilot?: string,
  // lkgCIBuild?: number
  // 1a. Initialize relevant APIs for getting builds details
  console.log('Step 1a - Initialized APIs');
  try {
    // const apis = await getApis();

    // const f = await octokit.pulls.get({
    //   owner: 'sunilsurana',
    //   repo: 'fluentuifork1',
    //   pull_number: 4,
    // });

    // const testCommit = await octokit.git.getCommit({
    //   owner: 'sunilsurana',
    //   repo: 'fluentuifork1',
    //   commit_sha: '0ce7f19cd978be278ce200ac937f207cb9051984',
    // });

    // console.log(testCommit.data.parents);

    // const folders = await prepareFolders(false, "PR", 123);

    const { gitApi, buildApi } = await getApis();

    const diffResultContainer = 'diff-screenshots';
    const candidateContainer = 'candidate-screenshots';
    const baselineContainer = 'diff-screenshots';
    //3.d Upload candidate screenshots to Azure blob storage
    // This is done to render the candidate images in the vr-approval app for thumbnails.
    const blobUploadConfigCandidate: BlobUploadConfig = getDefaultBlobUploadConfig('', '', '');

    // const ba=buildApi.getArtifact("uifabric", 1234, "" );
    // ba.
    const apis = await getApis();

    const candiateDataFolder = 'candidate_folder';

    try {
      await downloadBuildArtifact(270339, 'vrscreenshot', candiateDataFolder, apis);
      console.log('Step 3a - Downloaded and Extracted candidate build artifacts');
    } catch {
      console.log('Step 3a - Error: Failed downloading/unzipping candidate build artifacts');
      return;
    }

    // gihubApi;
    // const lastMergeCommitDetails: CommitDetails = await getParentCommitFromMaster(270070, apis);

    // console.log('Step 1a - Initialized APIs');

    // // 1c. Find Commit Details for this PR Build

    // console.log('Async function');

    // const folders = await prepareFolders(false, 'pr', 270070);

    console.log('done!');
  } catch (diffError: any) {
    console.log(diffError);
    throw diffError;
  }
}
