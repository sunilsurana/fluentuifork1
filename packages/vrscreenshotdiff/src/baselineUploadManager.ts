import * as path from 'path';
import { downloadBuildArtifact, getLastCommitInBuild } from './azure-builddata/getBuildArtifact';
import { getProject } from './azure-builddata/getProject';
import { getDefaultBlobUploadConfig } from './azure-storage/azureStorageCommon';
import { getArtifactsFromLocalFolderAndWriteToBlobStorage } from './azure-storage/getArtifactsFromBlobStorageAndWriteToLocalFolder';
import { cleanupDirectories } from './directoryHelper';
import { BlobUploadConfig, getApis } from './package-core';
import { updateScreenshotData } from './vrApprovalAPIHelper';

// import { runScreenshotDiffing } from "./screenshotDiffingManager";
const buildArtifactFolder = process.env['SCREENSHOT_ARTIFACT_FOLDER']
  ? process.env['SCREENSHOT_ARTIFACT_FOLDER']
  : 'vrscreenshot';
const diffResultContainer = 'diff-screenshots';
const candidateContainer = 'candidate-screenshots';
const baselineContainer = 'baseline-screenshots';

export async function runUploadBaselineData(buildId: number, jobTag: string): Promise<void> {
  // const folders = await prepareFolders(true, clientType, buildId);
  // const baseLineFolder: string = folders[0];
  let finalStatusCode = 500;
  // let statusMessageScreenshot = '';

  try {
    console.log('hello');
    const apis = await getApis();

    const lastMergeCommitId = await getLastCommitInBuild(buildId, apis);

    var baselineFolder = 'baseline-' + jobTag + '-' + lastMergeCommitId;

    await downloadBuildArtifact(buildId, buildArtifactFolder, baselineFolder, apis);

    //3.d Upload candidate screenshots to Azure blob storage
    // This is done to render the candidate images in the vr-approval app for thumbnails.
    const blobUploadConfigCandidate: BlobUploadConfig = getDefaultBlobUploadConfig(
      baselineContainer,
      'testClient/artifact',
      baselineFolder,
    );

    console.log('Step 3a - Downloaded and Extracted candidate build artifacts');
    await getArtifactsFromLocalFolderAndWriteToBlobStorage(blobUploadConfigCandidate);
    console.log('Screenshots successfully sent to blob storage');

    const { buildApi } = apis;

    const build = await buildApi.getBuild(getProject(), buildId);
    if (build && build.definition && build.definition.id && build.sourceBranch && build.sourceVersion) {
      const pipelineId = build.definition.id;
      const sourceBranch = build.sourceBranch;
      const commitId = build.sourceVersion;
      const project = getProject();
      const organization = 'uifabric';
      const screenshotBlobFolderPath = baselineFolder;
      await updateScreenshotData(buildId, pipelineId, organization, project, commitId, sourceBranch, baselineFolder);
      console.log('screenshot Uploaded data sent to the VR approval cosmos db');
    }
  } catch (exception) {
    console.log(exception.message);
  } finally {
    // folders[0] = path.join(baseLineFolder, ScreenshotArtifact);
    // await cleanupDirectories();
  }
}

// const runDiff: RunDiff = async (singlePrDetails, prBuildStatus, i) => {
//   const { artifactName, prBuildId, clientType } = singlePrDetails;

//   if (artifactName === ScreenshotArtifact) {
//     await runScreenshotDiffing(prBuildId, clientType);
//     prBuildStatus[i] = "true";
//   } else {
//     console.log(
//       "Failed to process PRBuild: " +
//         singlePrDetails.prBuildId +
//         " with clientType: " +
//         singlePrDetails.clientType +
//         " artifact: " +
//         singlePrDetails.artifactName
//     );
//     prBuildStatus[i] = "false";
//   }
// };
