// import {
//   RunDiff,
//   uploadBaselineArtifactToBlobstorage,
// } from "./midgardbot-baseline-uploader";

// import {
//   BaselineScreenshotContainer1JS,
//   cleanupDirectories,
//   prepareFolders,
//   ScreenshotArtifact,
//   BuildDetailRow,
// } from "./midgardbot-core";
import * as path from 'path';
import { downloadBuildArtifact, getLastCommitInBuild } from './azure-builddata/getBuildArtifact';
import { getDefaultBlobUploadConfig } from './azure-storage/azureStorageCommon';
import { getArtifactsFromLocalFolderAndWriteToBlobStorage } from './azure-storage/getArtifactsFromBlobStorageAndWriteToLocalFolder';
import { cleanupDirectories } from './directoryHelper';
import { BlobUploadConfig, getApis } from './package-core';

// import { runScreenshotDiffing } from "./screenshotDiffingManager";
const buildArtifactFolder = 'vrscreenshot';
const diffResultContainer = 'diff-screenshots';
const candidateContainer = 'candidate-screenshots';
const baselineContainer = 'baseline-screenshots';

export async function runUploadBaselineData(buildId: number): Promise<void> {
  // const folders = await prepareFolders(true, clientType, buildId);
  // const baseLineFolder: string = folders[0];
  let finalStatusCode = 500;
  // let statusMessageScreenshot = '';

  try {
    console.log('hello');
    const apis = await getApis();

    const lastMergeCommitId = await getLastCommitInBuild(buildId, apis);

    var baselineFolder = 'baseline-' + lastMergeCommitId;

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
    // statusMessageScreenshot = await uploadBaselineArtifactToBlobstorage(
    //   buildId,
    //   baseLineFolder,
    //   BaselineScreenshotContainer1JS,
    //   clientType,
    //   ScreenshotArtifact,
    //   runDiff,
    //   { includeSubFolders: true }
    // );

    // if (statusMessageScreenshot.indexOf('Warning')) {
    //   finalStatusCode = 403;
    // }

    // if (statusMessageScreenshot.indexOf('Success')) {
    //   finalStatusCode = 200;
    // }

    // const statusMessage = statusMessageScreenshot;
    // return { finalStatusCode, statusMessage };
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
