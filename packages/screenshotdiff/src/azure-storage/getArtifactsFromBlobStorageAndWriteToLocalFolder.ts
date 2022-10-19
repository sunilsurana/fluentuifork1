import { BlobService, ExponentialRetryPolicyFilter } from 'azure-storage';
import * as path from 'path';
import { createFolderInApp, getFileDetailsFromFolder, normalizeFolderPath } from '../directoryHelper';
import { getAzureStorageFluentUI } from './azureStorageCommon';
import { listBlobDirectories, listBlobs } from './listBlobs';
import { writeArtifactsToLocalFolder } from './writeArtifactsToLocalFolder';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { getEnv } from '../getEnv';

export async function getArtifactsFromBlobStorageAndWriteToLocalFolder({
  container,
  blobPrefix,
  folder,
  generateSasToken = false,
  skipBaselineDownload = false,
  blobexp = false,
  storage,
  createFolder = true,
}): Promise<Map<string, string>> {
  const statusMessage =
    'Started getArtifactsFromBlobStorageAndWriteToLocalFolder for folder: ' +
    folder +
    ', Generate SAS Token: ' +
    generateSasToken +
    ', Skip BaselineDownload: ' +
    skipBaselineDownload;
  console.log(statusMessage);

  const allFiles = new Map<string, string>();

  if (skipBaselineDownload) {
    return allFiles;
  }

  storage = !storage ? getAzureStorageFluentUI() : storage;
  const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  const blob = storage.blob(container, { publicAccessLevel: 'function' });
  console.log('Initialized azure blob storage with account details');

  const blobItems = await listBlobs(blobService, container, blobPrefix);

  // const blobServiceClient = BlobServiceClient.fromConnectionString("");
  // const containerClient = blobServiceClient.getContainerClient("$web");
  // const blobClient=containerClient.getBlobClient("blobName");
  // blobClient.

  if (createFolder) {
    await createFolderInApp(folder);
  }

  await Promise.all(
    blobItems.map(blobItem =>
      writeArtifactsToLocalFolder(folder, blobItem.name, blob, blobexp, blobService, container),
    ),
  );

  for (let i = 0; i < blobItems.length; ++i) {
    const blobNameWithPrefix = blobItems[i].name;
    const fileName = blobNameWithPrefix.substring(blobNameWithPrefix.lastIndexOf('/') + 1);
    if (generateSasToken) {
      const blobToken = await generateSasTokenWithReadAccess(
        container,
        blobNameWithPrefix.replace(/\\/g, '/'),
        storage,
      );
      allFiles.set(fileName, blobToken.uri);
    } else {
      allFiles.set(fileName, '');
      console.log('Adding file: ' + fileName);
    }
  }

  console.log('Completed getArtifactsFromBlobStorageAndWriteToLocalFolder for folder: ' + folder);

  return allFiles;
}

export async function getArtifactsFromBlobStorageDirectoriesAndWriteToLocalFolder({
  container,
  blobPrefix,
  folder,
  generateSasToken = false,
  skipBaselineDownload = false,
  blobexp = false,
  storage,
  createFolder = true,
  includeSubFolders = false,
}): Promise<Map<string, string>> {
  const statusMessage =
    'Started getArtifactsFromBlobStorageAndWriteToLocalFolder for folder: ' +
    folder +
    ', Generate SAS Token: ' +
    generateSasToken +
    ', Skip BaselineDownload: ' +
    skipBaselineDownload;
  console.log(statusMessage);
  const allFiles = new Map<string, string>();
  if (skipBaselineDownload) {
    return allFiles;
  }
  storage = !storage ? getAzureStorageFluentUI() : storage;
  const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  const blob = storage.blob(container, { publicAccessLevel: 'function' });
  console.log('Initialized azure blob storage with account details');
  if (createFolder) {
    await createFolderInApp(folder);
  }
  let blobScreenshots;

  const blobFolders = await listBlobDirectories(blobService, container, blobPrefix, includeSubFolders);

  await Promise.all(
    blobFolders.map(async directory => {
      blobScreenshots = await listBlobs(blobService, container, directory.name);
      await Promise.all(
        blobScreenshots.map(screenshot => {
          const blobPath = screenshot.name.replace(blobPrefix, '');
          const blobFolder = path.dirname(blobPath);
          return writeArtifactsToLocalFolder(
            path.join(folder, blobFolder),
            screenshot.name,
            blob,
            blobexp,
            blobService,
            container,
          );
        }),
      );
      for (let i = 0; i < blobScreenshots.length; ++i) {
        const blobNameWithPrefix = blobScreenshots[i].name;
        const fileName = blobNameWithPrefix.substring(blobNameWithPrefix.lastIndexOf('/') + 1);
        if (generateSasToken) {
          const blobToken = await generateSasTokenWithReadAccess(
            container,
            blobNameWithPrefix.replace(/\\/g, '/'),
            storage,
          );
          allFiles.set(fileName, blobToken.uri);
        } else {
          allFiles.set(fileName, '');
          console.log('Adding file: ' + fileName);
        }
      }
    }),
  );
  console.log('Completed getArtifactsFromBlobStorageAndWriteToLocalFolder for folder: ' + folder);
  return allFiles;
}

export const isAnyBlobWithPrefixAvailableV3 = async (
  container: string,
  blobPrefix: string,
  includeSubfolders: boolean = false,
  // tslint:disable-next-line: no-any
  storage: any = undefined,
) => {
  console.log('Started isAnyBlobWithPrefixAvailable for container: ' + container);
  storage = !storage ? getAzureStorageFluentUI() : storage;
  const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  console.log('Initialized azure blob storage with account details');
  // tslint:disable-next-line: no-any
  let blobItems: any[] = [];
  let blobFolders;
  if (includeSubfolders) {
    blobFolders = await listBlobDirectories(blobService, container, blobPrefix);
    await Promise.all(
      blobFolders.map(async singleFolder => {
        blobItems.push(await listBlobs(blobService, container, singleFolder.name));
      }),
    );
  } else {
    blobItems = await listBlobs(blobService, container, blobPrefix);
  }
  console.log('Found total ' + blobItems.length + ' Items with prefix: ' + blobPrefix);
  const isBaselineScreenshotAvailable = blobItems.length > 0 ? true : false;
  return {
    isBaselineScreenshotAvailable,
    baselineBlobDirectory: blobFolders,
  };
};
export const isAnyBlobWithPrefixAvailable = async (
  container: string,
  blobPrefix: string,
  includeSubfolders: boolean = false,
  // tslint:disable-next-line: no-any
  storage: any = undefined,
) => {
  console.log('Started isAnyBlobWithPrefixAvailable for container: ' + container);

  storage = !storage ? getAzureStorageFluentUI() : storage;
  const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  console.log('Initialized azure blob storage with account details');
  // tslint:disable-next-line: no-any
  const blobItems: any[] = [];

  if (includeSubfolders) {
    const blobFolders = await listBlobDirectories(blobService, container, blobPrefix, includeSubfolders);

    await Promise.all(
      blobFolders.map(async singleFolder => {
        blobItems.push(...(await listBlobs(blobService, container, singleFolder.name)));
      }),
    );
  }

  blobItems.push(...(await listBlobs(blobService, container, blobPrefix)));

  console.log('Found total ' + blobItems.length + ' Items with prefix: ' + blobPrefix);

  if (blobItems.length > 0) {
    return true;
  }

  return false;
};

export const deleteArtifactsFromBlobStorage = async (
  container: string,
  blobPrefix: string,
  // tslint:disable-next-line: no-any
  storage: any = undefined,
) => {
  console.log('Started deleteArtifactsFromBlobStorage for prefix: ' + blobPrefix);

  storage = !storage ? getAzureStorageFluentUI() : storage;
  const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  console.log('Initialized azure blob storage with account details');

  const blobItems = await listBlobs(blobService, container, blobPrefix);

  await Promise.all(
    blobItems.map(
      blobItem =>
        new Promise((resolve, reject) =>
          blobService.deleteBlobIfExists(container, blobItem.name, (deletebloberror, result) => {
            if (deletebloberror) {
              console.log('Error Removing Blob ' + blobItem.name + ': ' + deletebloberror);
              reject(deletebloberror);
            } else {
              console.log('Blob ' + blobItem.name + ' deleted successfully');
              resolve(blobItem.name);
            }
          }),
        ),
    ),
  );

  console.log('Completed deleteArtifactsFromBlobStorage for prefix: ' + blobPrefix);
};

export async function getArtifactsFromLocalFolderAndWriteToBlobStorage({
  localFolder,
  container,
  fileExtension,
  blobFilePrefix,
  // generateSasToken = false,
  // isGzip = false,
  includeSubFolders = false,
  retriesLeft = 3,
}): Promise<void> {
  // try {
  console.log('Started getArtifactsFromLocalFolderAndWriteToBlobStorage for folder: ' + localFolder);

  console.log('checkpoint 2');
  // const blobService = ''; // storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  console.log('Initialized azure blob storage with account detail');
  // isGzip = true;
  const filesWithContent = getFileDetailsFromFolder(localFolder, fileExtension, true);

  console.log('files with content are: ');
  console.log(filesWithContent);

  console.log('checkpoiint');
  const blobService = BlobServiceClient.fromConnectionString(getEnv('BLOB_CONNECTION_STRING'));

  const containerClient = blobService.getContainerClient(container);

  await Promise.all(
    filesWithContent.map(({ filename, filepath }) => {
      console.log(filename);
      console.log(filepath);

      // upload file
      uploadBlobInContainer(containerClient, filepath);
    }),
  );

  console.log('Completed getArtifactsFromLocalFolderAndWriteToBlobStorage for folder: ' + localFolder);
}

export async function getArtifactsFromBlobStorageAndWriteToLocalFolderNew({
  localFolderPath,
  container,
  blobFilePrefix = '',
  // generateSasToken = false,
  // isGzip = false,
  includeSubFolders = false,
  retriesLeft = 3,
}): Promise<void> {
  // try {
  console.log('Started getArtifactsFromBlobStorageAndWriteToLocalFolderNew for folder: ' + localFolderPath);

  // console.log('checkpoint 2');
  // const blobService = ''; // storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());
  // console.log('Initialized azure blob storage with account detail');
  // isGzip = true;
  // const filesWithContent = getFileDetailsFromFolder(localFolder, 'png', true);

  // console.log('files with content are: ');
  // console.log(filesWithContent);

  console.log('checkpoiint test');
  const blobService = BlobServiceClient.fromConnectionString(getEnv('BLOB_CONNECTION_STRING'));

  const containerClient = blobService.getContainerClient(container);

  await createFolderInApp('baseline_folder/vrscreenshot');

  await listBlobHierarchical(containerClient, localFolderPath);
}

// Recursively list virtual folders and blobs

// Recursively list virtual folders and blobs
async function listBlobHierarchical(containerClient, virtualHierarchyDelimiter = '/') {
  // page size - artificially low as example
  const maxPageSize = 100;

  // some options for filtering list
  const listOptions = {
    includeMetadata: true,
    includeSnapshots: false,
    includeTags: true,
    includeVersions: false,
    prefix: '',
  };

  let i = 1;
  console.log(`Folder ${virtualHierarchyDelimiter}`);

  for await (const response of containerClient
    .listBlobsByHierarchy(virtualHierarchyDelimiter, listOptions)
    .byPage({ maxPageSize })) {
    console.log(`   Page ${i++}`);
    const segment = response.segment;

    if (segment.blobPrefixes) {
      // Do something with each virtual folder
      for await (const prefix of segment.blobPrefixes) {
        // build new virtualHierarchyDelimiter from current and next
        await listBlobHierarchical(containerClient, `${virtualHierarchyDelimiter}${prefix.name}`);
      }
    }

    for (const blob of response.segment.blobItems) {
      // Do something with each blob
      console.log(`\tBlobItem: name - ${blob.name}`);
      const blobClient = await containerClient.getBlobClient(blob.name);
      await blobClient.downloadToFile(blob.name);
      console.log(`download of ${blob.name} success`);
    }
  }
}

const uploadBlobInContainer = async (containerClient, file) => {
  console.log('vrscreenshot is: ');
  console.log(file);

  const blobClient = containerClient.getBlockBlobClient(file);
  await blobClient.uploadFile(file, {});
  console.log('upload to blob:- ' + file);
};

async function writeArtifactsToBlob(
  blobFilePrefix: string,
  container: string,
  blobService,
  filename: string,
  filePath: string,
  generateSasToken: boolean,
  isGzip: boolean = false,
  subfolder: string = '',
  // tslint:disable-next-line: no-any
  storage: any | undefined = undefined,
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    const blobFileLocation = path.join(blobFilePrefix, subfolder, filename);
    const blockSize = 1024 * 1024 * 4;
    // file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;

    const options: BlobService.CreateBlobRequestOptions = isGzip
      ? {
          contentSettings: {
            contentEncoding: 'gzip',
            contentType: 'application/json',
          },
        }
      : {};

    blobService.singleBlobPutThresholdInBytes = blockSize;

    blobService.createBlockBlobFromLocalFile(container, blobFileLocation, filePath, options, async createblockError => {
      if (createblockError) {
        console.log('createBlockBlobFromLocalFile Error: ' + createblockError);
        reject([filename, 'Error:' + createblockError]);
      } else {
        const statusMessage = 'Uploaded File to ' + blobFileLocation + ' into Blob ';
        console.log(statusMessage);

        if (generateSasToken) {
          const blobToken = await generateSasTokenWithReadAccess(
            container,
            blobFileLocation.replace(/\\/g, '/'),
            storage,
          );
          console.log('Generated temporary Blob Url for ' + filename);
          resolve([filename, blobToken.uri]);
        } else {
          resolve([filename, '']);
        }
      }
    });
  });
}

function generateSasTokenWithReadAccess(
  container,
  blobName,
  // tslint:disable-next-line: no-any
  storage: any = undefined,
): Promise<{ token: string; uri: string }> {
  return new Promise(async (resolve, reject) => {
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() - 5);

    // Create a SAS token that expires in 60 days
    // Set start time to five minutes ago to avoid clock skew.
    const days = 60;
    const dayms = days * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(startDate.getTime() + dayms);

    storage = !storage ? getAzureStorageFluentUI() : storage;

    const blobService = storage.createBlobService().withFilter(new ExponentialRetryPolicyFilter());

    // TODO(Omar): Cache token for 1 or 3 days using node-cache
    const azurehelper = require('azure-storage');
    const permissions = azurehelper.BlobUtilities.SharedAccessPermissions.READ;

    const sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: permissions,
        Start: startDate,
        Expiry: expiryDate,
      },
    };

    const signature = await blobService.generateSharedAccessSignature(container, blobName, sharedAccessPolicy);

    resolve({
      token: signature,
      uri: blobService.getUrl(container, blobName, signature, true),
    });
  });
}
