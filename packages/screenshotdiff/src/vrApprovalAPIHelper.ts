const adal = require('adal-node').AuthenticationContext;
import { getEnv } from './getEnv';
import axios from 'axios';
import { isNullOrUndefined } from 'util';

const vrApprovalHost = 'https://vrt-fluentapp.azurewebsites.net/api/';

type TestRunResult = {
  readonly imageName: string;
  readonly mismatchedPixels: number;
  readonly diffHash: number;
};

type FormattedResults = {
  readonly version: string;
  readonly message: string;
  readonly baselinePath: string;
  readonly candidatePath: string;
  readonly diffPath: string;
  readonly totalScreenshotsCount: number;
  readonly screenshotsAdded: string[];
  readonly screenshotsRemoved: string[];
  readonly screenshotsChanged: TestRunResult[];
};

let appAccessToken: string;

async function setAppToken(): Promise<void> {
  if (isNullOrUndefined(appAccessToken)) {
    appAccessToken = await getAppToken();
  }
}

export async function updateScreenshotDiffData(
  diffResult: FormattedResults,
  reportPath: string,
  buildId: number,
  project: string,
  commitId: string,
  pipelineId: number,
  pipelineName: string,
  prId: number,
  sourceBranch: string,
  organization: string,
  baselineCommitId: string,
  baselineCommitTime: number,
): Promise<void> {
  const unchangedScreenshotsCount =
    diffResult.totalScreenshotsCount -
    diffResult.screenshotsChanged.length -
    diffResult.screenshotsAdded.length -
    diffResult.screenshotsRemoved.length;

  const data = JSON.stringify({
    organization: organization,
    project: project,
    sourceBranch: sourceBranch,
    prId: prId,
    commitId: commitId,
    pipelineId: pipelineId,
    pipelineName: pipelineName,
    buildId: buildId,
    reportPath: reportPath,
    addedScreenshots: diffResult.screenshotsAdded.length,
    deletedScreenshots: diffResult.screenshotsRemoved.length,
    matchedScreenshots: unchangedScreenshotsCount,
    differentScreenshots: diffResult.screenshotsChanged.length,
    baselineCommitId: baselineCommitId,
    baselineCommitTime: baselineCommitTime,
  });

  console.log('Update screenshotDiffData in VR Approval DB Started. Data is ' + data);

  await setAppToken();

  const headers = {
    Authorization: 'Bearer ' + appAccessToken,
    'Content-Type': 'application/json',
  };

  await axios.post(vrApprovalHost + 'updateScreenshotDiffData', data, {
    headers,
  });

  console.log('Update screenshotDiffData in VR Approval DB Successful.');
}

export async function performPolicyStateUpdate(
  prId: number,
  pipelineId: number,
  organization: string,
  project: string,
  commitId: string,
  state: string,
  postPolicy: boolean,
): Promise<void> {
  const data = JSON.stringify({
    organization: organization,
    projectName: project,
    prId: prId,
    commitId: commitId,
    pipelineId: pipelineId,
    state: state,
    generate: false,
    postPolicy: postPolicy,
  });

  console.log('VR approval policy state update started. Data is ' + data);

  await setAppToken();

  const headers = {
    Authorization: 'Bearer ' + appAccessToken,
    'Content-Type': 'application/json',
  };

  await axios.post(vrApprovalHost + 'policyState', data, { headers });

  console.log('VR approval policy state update successful.');
}

export async function updateScreenshotData(
  buildId: number,
  pipelineId: number,
  organization: string,
  project: string,
  commitId: string,
  sourceBranch: string,
  screenshotBlobFolderPath: string,
): Promise<void> {
  const data = JSON.stringify({
    organization: organization,
    project: project,
    commitId: commitId,
    pipelineId: pipelineId,
    buildId: buildId,
    sourceBranch: sourceBranch,
    screenshotBlobFolderPath: screenshotBlobFolderPath,
  });

  console.log('UpdateScreenshotData in VR approval db started. Data is ' + data);

  await setAppToken();

  const headers = {
    Authorization: 'Bearer ' + appAccessToken,
    'Content-Type': 'application/json',
  };

  await axios.post(vrApprovalHost + 'updateScreenshotData', data, { headers });

  console.log('UpdateScreenshotData in VR approval db successful.');
}

async function getAppToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const authorityHostUrl = 'https://login.windows.net';
    const tenant = '72f988bf-86f1-41af-91ab-2d7cd011db47';
    const authorityUrl = authorityHostUrl + '/' + tenant;
    const clientId = '288a69b6-760d-4c1f-ad6d-0183b5e5740f';
    const clientSecret = getEnv('VR_APPROVAL_CLIENT_SECRET');
    const resource = 'api://288a69b6-760d-4c1f-ad6d-0183b5e5740f';
    const context = new adal(authorityUrl);

    context.acquireTokenWithClientCredentials(resource, clientId, clientSecret, (err, tokenResponse) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(tokenResponse.accessToken);
      }
    });
  });
}
