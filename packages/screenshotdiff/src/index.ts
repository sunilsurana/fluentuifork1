export const Greeter = (name: string) => `Hello ${name}`;
import { flattenDirectory, prepareFolders } from './directoryHelper';
import { getfirstCommitOfLGCI, getParentCommitFromMaster } from './azure-builddata/getParentCommitFromMaster';
import { diffFolders } from 'pixel-buffer-diff-folders';
import * as fs from 'fs';
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
import { BlobUploadConfig, CommitDetails, ReportDetail, ScreenshotArtifact } from './types';
import { Octokit as gihubApi } from '@octokit/rest';
import { getEnv } from './getEnv';
import { getDefaultBlobUploadConfig } from './azure-storage/azureStorageCommon';
import { downloadBuildArtifact } from './azure-builddata/getBuildArtifact';
import {
  getArtifactsFromBlobStorageAndWriteToLocalFolderNew,
  getArtifactsFromLocalFolderAndWriteToBlobStorage,
} from './azure-storage/getArtifactsFromBlobStorageAndWriteToLocalFolder';
import { join } from 'path';
import { createScreenshotDiffingContent } from './screenshotReporter';
import { updateScreenshotDiffData } from './vrApprovalAPIHelper';
import { getProject } from './azure-builddata/getProject';

const organization = 'uifabric';
const project = getProject();
const owner = 'sunilsurana';
const repo = 'fluentuifork1';

const prNumber = 14;
const buildId = 270788;

const diffResultContainer = 'diff-screenshots';
const candidateContainer = 'candidate-screenshots';
const baselineContainer = 'baseline-screenshots';
const reportPath = 'reportContent.txt';
const pipelineId = 202;
const buildArtifactFolder = 'vrscreenshot';
const lkgCIBuild = 270788;

// import { Octokit as gihubApi } from '@octokit/net';

const octokit = new gihubApi({
  auth: getEnv('GITHUB_API_TOKEN'),
});

// const core = require('@actions/core');
// const github = require('@actions/github');
// const { context } = require('@actions/github')
// const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
// const octokit = github.getOctokit(GITHUB_TOKEN);

// octokit.rest.issues.createComment({
//   owner: 'sunilsurana',
//   "repo",
//   4,
//   "",
// });

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

    // const { gitApi, buildApi } = await getApis();

    // //3.d Upload candidate screenshots to Azure blob storage
    // // This is done to render the candidate images in the vr-approval app for thumbnails.
    // // const blobUploadConfigCandidate: BlobUploadConfig = getDefaultBlobUploadConfig('', '', '');

    // // const ba=buildApi.getArtifact("uifabric", 1234, "" );
    // // ba.
    const apis = await getApis();
    console.log('Step 1a - Initialized APIs 2');
    const candiateDataFolder = 'candidate_folder';

    const baselineCommitId = await getfirstCommitOfLGCI(lkgCIBuild, apis);

    const { buildApi } = apis;
    const build = await buildApi.getBuild(project, buildId);
    const pipelineName = build.definition.name;
    const sourceBranch = build.sourceBranch;
    const commitId = build.sourceVersion;

    console.log('Step 1a - Initialized APIs 3');
    try {
      await downloadBuildArtifact(buildId, buildArtifactFolder, candiateDataFolder, apis);
      console.log('Step 3a - Downloaded and Extracted candidate build artifacts');
    } catch {
      console.log('Step 3a - Error: Failed downloading/unzipping candidate build artifacts');
      return;
    }

    // const candidateBlobPrefix =
    //   `${candidateFolderPath}/${ScreenshotArtifact}`;

    //3.d Upload candidate screenshots to Azure blob storage
    // This is done to render the candidate images in the vr-approval app for thumbnails.
    const blobUploadConfigCandidate: BlobUploadConfig = getDefaultBlobUploadConfig(
      candidateContainer,
      'testClient/artifact',
      'candidate_folder',
    );

    // blobUploadConfigCandidate.generateSasToken = false;
    // blobUploadConfigCandidate.isGzip = false; // We don't compress/gzip screenshots
    const uploadedCandidateScreenshots = await getArtifactsFromLocalFolderAndWriteToBlobStorage(
      blobUploadConfigCandidate,
    );

    await getArtifactsFromBlobStorageAndWriteToLocalFolderNew({
      localFolderPath: 'baseline_folder',
      container: baselineContainer,
      blobFilePrefix: '/baseline_folder',
    });

    // 3c. Flatten the baseline and candidate directories
    // lpc-core/test.png will become lpc-core_test.png
    // This is a temporary solution. Proper solution tracked by:
    // https://msfast.visualstudio.com/People%20Experiences/_workitems/edit/334946

    console.log('Flatten process');
    const separator = '#';
    // const baselinePath = await flattenDirectory('baseline_folder/vrscreenshot', separator);
    // const candidatePath = await flattenDirectory('candidate_folder/vrscreenshot', separator);

    const baselinePath = 'baseline_folder/vrscreenshot';
    const candidatePath = 'candidate_folder/vrscreenshot';

    console.log('Step 3c - Flattened the baseline and candidate directories');

    // 4a. Perform Diffing between the baseline and candidate
    const resultPath = 'diff-result';
    const threshold = 0.04;
    const cumulatedThreshold = 1;
    let diffResult;
    try {
      const diffResultUsingPixelBufferDiff = await diffFolders(
        baselinePath,
        candidatePath,
        resultPath,
        { threshold, cumulatedThreshold, enableMinimap: true },
        true,
        false,
      );

      // Map diffResultUsingPixelBufferDiff to ScreenshotDiff format
      const totalScreenshotsCount =
        diffResultUsingPixelBufferDiff.added.length +
        diffResultUsingPixelBufferDiff.removed.length +
        diffResultUsingPixelBufferDiff.unchanged.length +
        diffResultUsingPixelBufferDiff.error.length +
        diffResultUsingPixelBufferDiff.changed.length;
      diffResult = {
        version: '0.0.2',
        message: `There was ${diffResultUsingPixelBufferDiff.added.length} screenshots added, ${diffResultUsingPixelBufferDiff.removed.length} screenshots removed, ${diffResultUsingPixelBufferDiff.unchanged.length} screenshots unchanged, ${diffResultUsingPixelBufferDiff.error.length} screenshots with different dimensions and ${diffResultUsingPixelBufferDiff.changed.length} screenshots with visible difference.`,
        baselinePath,
        candidatePath,
        diffPath: resultPath,
        totalScreenshotsCount,
        screenshotsAdded: diffResultUsingPixelBufferDiff.added,
        screenshotsRemoved: diffResultUsingPixelBufferDiff.removed,
        screenshotsChanged: diffResultUsingPixelBufferDiff.changed.map(v => {
          return {
            imageName: v.path,
            mismatchedPixels: v.cumulatedDiff,
            diffHash: v.hash,
          };
        }),
      };

      console.log('Step 4a - Completed finding diff results between builds');
      console.log('=======================');
      console.log('Result file from Diffing');
      console.log('=======================');
      console.log(diffResult);

      console.log(diffResult.message);
    } catch (diffError: any) {
      console.log(diffError);
      throw diffError;
    }

    // 4c. Upload diff result with screenshots to Azure blob storage
    // const blobUploadConfig: BlobUploadConfig = getDefaultBlobUploadConfig(
    //   diffResultContainer,
    //   diffBlobPrefix,
    //   diffResultFolder,
    // );

    const diffUploadConfig: BlobUploadConfig = getDefaultBlobUploadConfig(
      diffResultContainer,
      'testClient/artifact',
      'diff-result',
    );

    // blobUploadConfig.generateSasToken = false;
    // blobUploadConfig.isGzip = false; // We don't compress/gzip screenshots
    const uploadedScreenshots = await getArtifactsFromLocalFolderAndWriteToBlobStorage(diffUploadConfig);
    console.log('Success: Writing diff file(s) from a folder and wrote to Azure Blob');

    // 4d. Save and upload Visual Regression report
    const reportSubFolderPath = resultPath;
    const reportJsonFolderPath = join(reportSubFolderPath, 'reportContent.txt');
    const options: fs.WriteFileOptions = { encoding: 'utf-8' };

    const screenshotURLs = {};
    // uploadedScreenshots.forEach((value: string, key: string) => (screenshotURLs[key] = value));

    const reportDetails: ReportDetail = {
      screenshotURLs,
      diffResult,
      baselinePath: `baseline-${baselineCommitId}`,
      candidatePath: '',
      blobBaselinePath: '',
      blobCandidatePath: '',
    };

    console.log('the report file is:- ');
    // console.log(reportSubFolderPath);

    // fs.mkdirSync(reportSubFolderPath);
    fs.writeFileSync(reportJsonFolderPath, JSON.stringify(reportDetails), options);

    // Scope blobUploadConfig to the report sub folder
    // diffUploadConfig.localFolder = reportSubFolderPath;
    diffUploadConfig.localFolder = 'diff-result/';
    diffUploadConfig.fileExtension = 'txt';

    const uploadedReportFiles = await getArtifactsFromLocalFolderAndWriteToBlobStorage(diffUploadConfig);
    console.log(
      'Success: Writing ' +
        // uploadedReportFiles.size +
        ' file(s) from a folder and wrote to Azure Blob',
    );

    //Posting PR comment

    const prCommentData = createScreenshotDiffingContent(
      diffResult,
      'pr',
      buildId,
      organization,
      project,
      prNumber,
      commitId,
    );

    await octokit.rest.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: prNumber,
      body: prCommentData,
    });

    // const baselineCommitId = commitId;
    // const commitDetails = await gitApi.getCommit(
    //   baselineCommitId,
    //   repository
    // );
    // let baselineCommitTime;
    // if (commitDetails.author && commitDetails.author.date) {
    //   baselineCommitTime = commitDetails.author.date.getTime() / 1000;
    // }

    // updating diff data into  DB
    await updateScreenshotDiffData(
      diffResult,
      reportPath,
      buildId,
      project,
      commitId,
      pipelineId,
      pipelineName,
      prNumber,
      sourceBranch,
      organization,
      baselineCommitId,
      0,
    );
    // console.log(uploadedCandidateScreenshots);

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
