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

// import { runScreenshotDiffing } from "./screenshotDiffingManager";

export async function runUploadBaselineData(
  buildId: number,
  clientType: string,
): Promise<{ finalStatusCode: number; statusMessage: string } | undefined> {
  // const folders = await prepareFolders(true, clientType, buildId);
  // const baseLineFolder: string = folders[0];
  let finalStatusCode = 500;
  let statusMessageScreenshot = '';

  try {
    // statusMessageScreenshot = await uploadBaselineArtifactToBlobstorage(
    //   buildId,
    //   baseLineFolder,
    //   BaselineScreenshotContainer1JS,
    //   clientType,
    //   ScreenshotArtifact,
    //   runDiff,
    //   { includeSubFolders: true }
    // );

    if (statusMessageScreenshot.indexOf('Warning')) {
      finalStatusCode = 403;
    }

    if (statusMessageScreenshot.indexOf('Success')) {
      finalStatusCode = 200;
    }

    const statusMessage = statusMessageScreenshot;
    return { finalStatusCode, statusMessage };
  } finally {
    // folders[0] = path.join(baseLineFolder, ScreenshotArtifact);
    // await cleanupDirectories(folders);
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
