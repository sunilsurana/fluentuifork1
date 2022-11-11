export const Greeter = (name: string) => `Hello ${name}`;
import { createFolderInApp, flattenDirectory, prepareFolders } from './directoryHelper';
import { getfirstCommitOfLGCI, getParentCommitFromMaster } from './azure-builddata/getParentCommitFromMaster';
import { diffFolders } from 'pixel-buffer-diff-folders';
import * as fs from 'fs';
import { getApis } from './package-core';
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

const diffResultContainer = 'diff-screenshots';
const candidateContainer = 'candidate-screenshots';
const baselineContainer = 'baseline-screenshots';
const reportPath = 'reportContent.txt';

const buildArtifactFolder = process.env['SCREENSHOT_ARTIFACT_FOLDER']
  ? process.env['SCREENSHOT_ARTIFACT_FOLDER']
  : 'vrscreenshot';

const octokit = new gihubApi({
  auth: getEnv('GITHUB_API_TOKEN'),
});

console.log('Starting screenshot diff');

startDiffing();

async function startDiffing(): Promise<void> {
  console.log('test');
  // await runScreenshotDiffing();
}

export async function runScreenshotDiffing(
  buildId: number,
  lkgCIBuild: number,
  clientType: string,
  pipelineId: string,
  pipelineName: string,
): Promise<void> {
  console.log('Step 1a - Initialized APIs');
  try {
    const apis = await getApis();
    console.log('Step 1a - Initialized APIs 2');
    const candidateDataFolder = clientType + '/candidate-' + buildId;

    const baselineCommitId = await getfirstCommitOfLGCI(lkgCIBuild, apis);

    var baselineFolder = clientType + '/baseline-' + baselineCommitId;

    console.log('baseline commit Id is :' + baselineCommitId);

    const { buildApi } = apis;
    const build = await buildApi.getBuild(project, buildId);

    const sourceBranch = build.sourceBranch;
    var prNumber, commitId;
    if (build.triggerInfo && build.sourceVersion) {
      prNumber = build.triggerInfo['pr.number'];
      commitId = build.sourceVersion;
    }

    console.log('Step 1a - Initialized APIs 3');
    try {
      await downloadBuildArtifact(buildId, buildArtifactFolder, candidateDataFolder, apis);
      console.log('Step 3a - Downloaded and Extracted candidate build artifacts');
    } catch {
      console.log('Step 3a - Error: Failed downloading/unzipping candidate  build artifacts');
      return;
    }

    //3. Get configuration for containers
    const blobUploadConfigCandidate: BlobUploadConfig = getDefaultBlobUploadConfig(
      candidateContainer,
      clientType,
      candidateDataFolder,
    );

    //Upload candidate screenshots
    const uploadedCandidateScreenshots = await getArtifactsFromLocalFolderAndWriteToBlobStorage(
      blobUploadConfigCandidate,
    );

    let folderSuffix = 'v9';
    if (clientType === 'fluentuiv8') folderSuffix = 'v8';
    await getArtifactsFromBlobStorageAndWriteToLocalFolderNew({
      localFolderPath: baselineFolder,
      container: baselineContainer,
      suffix: folderSuffix,
    });

    // 3c. Flatten the baseline and candidate directories
    // lpc-core/test.png will become lpc-core_test.png
    // This is a temporary solution. Proper solution tracked by:
    // https://msfast.visualstudio.com/People%20Experiences/_workitems/edit/334946

    const baselinePath = baselineFolder + '/' + buildArtifactFolder;
    const candidatePath = candidateDataFolder + '/' + buildArtifactFolder;

    // 4a. Perform Diffing between the baseline and candidate
    const resultPath = clientType + '/diff-result-' + buildId + '/' + buildArtifactFolder;

    await createFolderInApp(resultPath);

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

    const diffUploadConfig: BlobUploadConfig = getDefaultBlobUploadConfig(
      diffResultContainer,
      'testClient/artifact',
      resultPath,
    );

    const uploadedScreenshots = await getArtifactsFromLocalFolderAndWriteToBlobStorage(diffUploadConfig);
    console.log('Success: Writing diff file(s) from a folder and wrote to Azure Blob');

    // 4d. Save and upload Visual Regression report
    // const reportSubFolderPath = resultPath;
    const reportJsonFolderPath = join(resultPath, 'reportContent.txt');
    const options: fs.WriteFileOptions = { encoding: 'utf-8' };

    const screenshotURLs = {};

    const reportDetails: ReportDetail = {
      screenshotURLs,
      diffResult,
      baselinePath: `baseline-${baselineCommitId}`,
      candidatePath: candidateDataFolder,
      blobBaselinePath: baselinePath + '/',
      blobCandidatePath: candidatePath,
    };

    console.log('the report file is:- ');

    fs.writeFileSync(reportJsonFolderPath, JSON.stringify(reportDetails), options);

    diffUploadConfig.localFolder = resultPath;
    diffUploadConfig.fileExtension = 'txt';

    const uploadedReportFiles = await getArtifactsFromLocalFolderAndWriteToBlobStorage(diffUploadConfig);
    console.log(
      'Success: Writing ' +
        // uploadedReportFiles.size +
        ' file(s) from a folder and wrote to Azure   Blob',
    );

    //Posting PR comment

    let prCommentData = createScreenshotDiffingContent(
      diffResult,
      'pr',
      buildId,
      organization,
      project,
      prNumber,
      commitId,
      clientType,
    );

    prCommentData = prCommentData + '<div id="vrtComment' + clientType + '"/>';

    const commentList = await octokit.rest.issues.listComments({
      owner: owner,
      repo: repo,
      issue_number: prNumber,
    });

    const arrayComment = commentList.data;
    let issueId = -1;

    arrayComment.forEach(item => {
      if (item.body.includes('vrtComment' + clientType)) {
        issueId = item.id;
      }
    });

    if (issueId === -1) {
      await octokit.rest.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: prNumber,
        body: prCommentData,
      });
    } else {
      await octokit.rest.issues.updateComment({
        owner: owner,
        repo: repo,
        comment_id: issueId,
        body: prCommentData,
      });
    }

    // updating diff data into  DB
    await updateScreenshotDiffData(
      diffResult,
      resultPath + '/' + reportPath,
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
    console.log('done!');
  } catch (diffError: any) {
    console.log(diffError);
    throw diffError;
  }
}
