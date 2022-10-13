import {
  BaselineTableName,
  CommitDetails,
  findRowsByPartitionKey,
  getOrCreateAzureTable,
  insertOrUpdateIntoAzureTable,
} from '../midgardbot-core';
import { BuildDetailRow, findBuildStatusRowsByPartitionKey, PrTableName } from './azureTableStorageManager';

export const insertCommitDetailsInBaselineTable = async (
  clientType: string,
  artifactName: string,
  lastMergeCommitDetails: CommitDetails,
  buildId: number,
) => {
  const tableStorage = getOrCreateAzureTable(BaselineTableName);
  const commitData = {
    artifactName,
    clientType,
    parentCommitId: lastMergeCommitDetails.ParentCommit,
    prCommitId: lastMergeCommitDetails.LastLocalCommit,
    prBuildId: buildId,
    prId: lastMergeCommitDetails.PrId,
    prOwner: lastMergeCommitDetails.Owner,
    isProcessed: false,
  };

  if (commitData.parentCommitId) {
    const insertResult = await insertOrUpdateIntoAzureTable(
      `${clientType}-${commitData.artifactName}-${commitData.parentCommitId}`,
      `${commitData.prBuildId}`,
      commitData,
      tableStorage,
    );
    return { insertResult, tableStorage, commitData };
  }
  console.log('Skipped writing empty/invalid commit details in Azure table for buildid: ' + buildId);
  return { insertResult: false, tableStorage, commitData };
};

export const insertBuildStatusInTable = async (
  clientType: string,
  artifactName: string,
  pridorcommitid: string | number | undefined,
  buildId: number,
) => {
  const tableStorage = getOrCreateAzureTable(PrTableName);
  const commitData = {
    artifactName,
    clientType,
    prBuildId: buildId,
    prId: pridorcommitid,
    isProcessed: false,
  };

  if (commitData.prId) {
    const insertResult = await insertOrUpdateIntoAzureTable(
      `${clientType}-${commitData.artifactName}-${commitData.prId}-${commitData.prBuildId}`,
      `${commitData.prBuildId}`,
      commitData,
      tableStorage,
    );
    console.log('Writing valid build details in Azure table for buildid: ' + buildId + ' PR ID: ' + commitData.prId);
    return { insertResult, tableStorage, commitData };
  }
  console.log('Skipped writing empty/invalid PR details in Azure table for buildid: ' + buildId);
  return { insertResult: false, tableStorage, commitData };
};

export async function getBuildDetailsForAwaitingPrBuilds(
  partitionKey: string,
  isProcessed: boolean,
  tablename: string = BaselineTableName,
): Promise<BuildDetailRow[]> {
  const prBuildRows = await findRowsByPartitionKey(tablename, partitionKey);

  return prBuildRows.filter(singlePr => singlePr.isProcessed === !!isProcessed);
}

export async function isBuildForPrExist(
  partitionKey: string,
  isProcessed: boolean,
  tablename: string = PrTableName,
): Promise<boolean> {
  const prBuildRows = await findBuildStatusRowsByPartitionKey(tablename, partitionKey);

  return prBuildRows.filter(singlePr => singlePr.isProcessed === !!isProcessed).length > 0;
}

export const updatePrBuildStatus = async (prBuildStatusKey: string | undefined, buildId: number) => {
  if (prBuildStatusKey) {
    const updatedStatusData = {
      isProcessed: true,
    };
    const updateResult = await insertOrUpdateIntoAzureTable(
      prBuildStatusKey,
      buildId.toString(),
      updatedStatusData,
      undefined,
      PrTableName,
    );
    console.log('Updated PR Build Status : ' + updateResult + ' for buildId: ' + buildId);
  }
};
