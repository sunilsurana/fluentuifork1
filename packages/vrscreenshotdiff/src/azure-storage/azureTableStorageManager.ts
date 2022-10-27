import { getAzureStorage } from './azureStorageCommon';

export const BaselineTableName = 'midgarddiffingbotbaseline';
export const PrTableName = 'midgarddiffingbotprstatus';

type Table = {
  write: (partitionKey: string, rowKey: string, rowData: unknown) => Promise<void>;
};

export type BuildDetailRow = {
  parentCommitId?: string;
  prCommitId?: string;
  prBuildId: number;
  prBuildDefinition?: string;
  clientType: string;
  artifactName?: string;
  isProcessed: boolean;
};

export type BuildStatusRow = {
  prBuildId: number;
  prId: string;
  isProcessed: boolean;
  clientType?: string;
  artifactName?: string;
  prCommitId?: string;
};

export const getOrCreateAzureTable = (tableName: string) => {
  console.log('Started getOrCreateAzureTable for tableName: ' + tableName);

  try {
    const storage = getAzureStorage();
    const existingTable = storage.table(tableName);
    return existingTable;
  } catch (tableerror: any) {
    const statusMessage = 'Error: Failed to create/get azure table with error: ' + tableerror;
    console.log(statusMessage);
    throw tableerror;
  }
};

export async function insertOrUpdateIntoAzureTable(
  partitionKey: string,
  rowKey: string,
  rowData,
  existingTable: Table | undefined = undefined,
  tableName: string = BaselineTableName,
): Promise<boolean> {
  console.log(
    'Started insertOrUpdateIntoAzureTable for partitionKey: ' +
      partitionKey +
      ' rowKey: ' +
      rowKey +
      ' Table: ' +
      tableName,
  );

  if (!existingTable) {
    existingTable = getOrCreateAzureTable(tableName);
  }

  if (existingTable && rowData) {
    await existingTable.write(
      partitionKey, // `${clientType}-${tableData.artifactName}`,
      rowKey, //tableData.prBuildId,
      rowData,
    );
    return true;
  }

  console.log('Azure Table not found when inserting data');
  return false;
}

export async function deleteFromAzureTable(existingTable, partitionKey: string, rowKey: string): Promise<boolean> {
  console.log('Started deleteFromAzureTable for partitionKey: ' + partitionKey + ' rowKey: ' + rowKey);

  if (existingTable && partitionKey && rowKey) {
    await existingTable.delete(
      partitionKey, // `${clientType}-${tableData.artifactName}`
      rowKey, //tableData.parentCommitId
    );
    return true;
  }

  return false;
}

export async function findRowsByPartitionKey(tableName: string, partitionKey: string): Promise<BuildDetailRow[]> {
  const rowsWithData: BuildDetailRow[] = [];

  try {
    const storage = getAzureStorage();
    const existingTable = storage.table(tableName);

    let records = existingTable.query().where('PartitionKey eq ?', `${partitionKey}`);

    while (records.next) {
      records = await records.next();

      records.forEach(record => {
        console.log('Record Data PR CommitId: ' + record.prCommitId);
        rowsWithData.push({
          parentCommitId: record.parentCommitId,
          prCommitId: record.prCommitId,
          prBuildId: record.prBuildId,
          prBuildDefinition: record.prBuildDefinition,
          clientType: record.clientType,
          artifactName: record.artifactName,
          isProcessed: !!record.isProcessed,
        });
      });
    }
  } catch (tableerror: any) {
    const statusMessage = 'Error: Failed to query azure table, details: ' + tableerror;
    console.log(statusMessage);
    throw tableerror;
  }

  return rowsWithData;
}

export async function findBuildStatusRowsByPartitionKey(
  tableName: string,
  partitionKey: string, // ClientType-Prid-BuildId
): Promise<BuildStatusRow[]> {
  const rowsWithData: BuildStatusRow[] = [];

  try {
    const storage = getAzureStorage();
    const existingTable = storage.table(tableName);

    let records = existingTable.query().where('PartitionKey eq ?', `${partitionKey}`);

    while (records.next) {
      records = await records.next();

      records.forEach(record => {
        console.log('Record Data PR BuildId: ' + record.prBuildId);
        rowsWithData.push({
          prId: record.prId,
          prBuildId: record.prBuildId,
          clientType: record.clientType,
          artifactName: record.artifactName,
          isProcessed: !!record.isProcessed,
        });
      });
    }
  } catch (tableerror: any) {
    const statusMessage = 'Error: Failed to query azure table, details: ' + tableerror;
    console.log(statusMessage);
    throw tableerror;
  }

  return rowsWithData;
}
