type DiffResult = {
  totalScreenshotsCount: number;
  screenshotsAdded: string[];
  screenshotsRemoved: string[];
  screenshotsChanged: Array<ImageDetails>;
  message: string;
};

type ImageDetails = {
  imageName: string;
  mismatchedPixels: number;
  type: string;
};

type DiffSectionData = {
  // "storyrunner/lpc-win32", "signoff-tests/lpc-web" etc.
  screenshotsSource: string;
  // screenshot diffs
  screenshotsChanged: Array<ImageDetails>;
};

export function createScreenshotDiffingContent(
  diffJsonResult: DiffResult,
  clientType: string,
  buildId: number,
  organization: string,
  project: string,
  prId: number,
  commitId: string,
): string {
  if (
    (diffJsonResult.screenshotsChanged && diffJsonResult.screenshotsChanged.length > 0) ||
    (diffJsonResult.screenshotsAdded && diffJsonResult.screenshotsAdded.length > 0) ||
    (diffJsonResult.screenshotsRemoved && diffJsonResult.screenshotsRemoved.length > 0)
  ) {
    const screenshotAffected =
      diffJsonResult.screenshotsAdded.length +
      diffJsonResult.screenshotsRemoved.length +
      diffJsonResult.screenshotsChanged.length;
    const appUrl =
      `https://staticpagerelease.z16.web.core.windows.net/azurestaticapps/vr-approval-app/index.html?organization=` +
      organization +
      `&project=` +
      project +
      `&prId=` +
      prId +
      `&commitId=` +
      commitId +
      `&env=prod`;
    const title =
      `## [🕵 Open the Visual Regressions report to inspect the ${screenshotAffected} screenshots]( ${appUrl}` + `)`;
    const disclaimer = '_watch out, the screenshots are still a bit noisy, mostly due to timing issues_';

    let diffSectionData: DiffSectionData[] = [];
    let sections: string[] = [];
    const summary = `✅ ${diffJsonResult.message}`;

    const imageDetails: ImageDetails[] = [];

    diffJsonResult.screenshotsChanged.forEach(item => {
      item.type = 'Changed';
      imageDetails.push(item);
    });

    diffJsonResult.screenshotsAdded.forEach(item => {
      const imageItem: ImageDetails = {
        imageName: item,
        mismatchedPixels: 0,
        type: 'Added',
      };
      imageDetails.push(imageItem);
    });

    diffJsonResult.screenshotsRemoved.forEach(item => {
      const imageItem: ImageDetails = {
        imageName: item,
        mismatchedPixels: 0,
        type: 'Removed',
      };
      imageDetails.push(imageItem);
    });

    diffSectionData = getDiffSectionData(imageDetails);

    sections = diffSectionData.map(sectionData => {
      const table = createStaticDiffTable(sectionData.screenshotsChanged);
      return createDiffSection(sectionData, table);
    });
    const additionalSection = getAdditionalSection(clientType, buildId);
    const report = `${[title, disclaimer, summary, ...sections, additionalSection].join('\n\n')}\n`;
    // There is a limit to comment length allowed in ADO. In case we exceed that, we skip the diff sections and just post report link.
    if (report.length >= 150000) {
      return `${[title, disclaimer, getDiffExceededLimitSection(), additionalSection].join('\n\n')}\n`;
    }
    return report;
  }
  {
    const title = `## 🕵 No visual regressions between this PR and main`;
    return `${[title].join('\n\n')}\n`;
  }
}
// split screenshot diff by source and package
function getDiffSectionData(screenshotsChanged: Array<ImageDetails>): Array<DiffSectionData> {
  const screenshotsMap: { [screenshotsSource: string]: ImageDetails[] } = {};

  for (const imageDetails of screenshotsChanged) {
    const screenshotsSource = getImageSource(imageDetails.imageName);
    if (!screenshotsMap[screenshotsSource]) {
      screenshotsMap[screenshotsSource] = [];
    }
    screenshotsMap[screenshotsSource].push(imageDetails);
  }

  const diffSectionData: DiffSectionData[] = [];
  Object.keys(screenshotsMap)
    .sort()
    .forEach(screenshotsSource => {
      const screenshotsChanged = screenshotsMap[screenshotsSource];
      if (screenshotsChanged) {
        diffSectionData.push({ screenshotsSource, screenshotsChanged });
      }
    });
  return diffSectionData;
}

function createDiffSection(diffSectionData: DiffSectionData, diffTable: string): string {
  const { screenshotsSource, screenshotsChanged } = diffSectionData;
  const prefix = `<summary><b>${screenshotsSource}</b> ${screenshotsChanged.length} screenshots</summary>`;

  return `
  <details>${[prefix, diffTable].join('\n')}\n</details>`;
}

function createStaticDiffTable(screenshotsChanged: Array<ImageDetails>): string {
  const header = '\n|Image Name|Diff(in Pixels)| Image Type';
  const headerSeparator = '|-|-|-|';
  const rows = screenshotsChanged.map(
    imageDetails => `|${imageDetails.imageName}|${Math.round(imageDetails.mismatchedPixels)}| ${imageDetails.type}|`,
  );
  return `${[header, headerSeparator, ...rows].join('\n')}\n`;
}

// parse screenshot name according to the current naming convention: <packageName>_<sourceName>_<imageName>.png
// Diff Name -> @1js-search-hostapp_storybookTests_chromium-conversationlist--conversation-list-story.png
// Image Source -> @1js/search-hostapp/storybookTests
function getImageSource(diffName: string): string {
  if (diffName.startsWith('@1js-visual-regression-tests')) {
    // Adding a special condition for @1js-visual-regression-tests because it's a
    // monolithic package and has a lot of screenshots in same folder
    // So we add differentiation on a more appropriate separator (.)
    // Diff Name -> @1js-visual-regression-tests_TellMe.TellMe.click in TellMe.chromium.png
    // Image Source -> TellMe
    const index = diffName.indexOf('.');
    return diffName.substr(0, index).replace('@1js-visual-regression-tests_', '') || 'unknown';
  }
  const lastIndex = diffName.lastIndexOf('_');
  return (diffName.substr(0, lastIndex) || 'unknown').replace(/_/g, '/').replace('@1js-', '@1js/');
}

function getAdditionalSection(clientType: string, buildId: number): string[] {
  return [];
}

function getDiffExceededLimitSection(): string {
  return '_Diffs exceeded the limit allowed for comments. Please use the report link above to check your diffs._';
}
