import { BlobDowloadConfig, BlobUploadConfig } from '../types';

export const getAzureStorage = (accountname?: string | undefined, accountkey?: string | undefined) => {
  const account = accountname ? accountname : process.env['STORAGE_ACCOUNT'];
  const key = accountkey ? accountkey : process.env['STORAGE_KEY'];
  const storage = require('azure-storage-simple')(account, key);
  return storage;
};

export const getAzureStorageFluentUI = (accountname?: string | undefined, accountkey?: string | undefined) => {
  console.log('test fuent account1');
  const account = accountname ? accountname : process.env['STORAGE_ACCOUNT_FLUENTUI'];
  console.log('test fuent account2');
  const key = accountkey ? accountkey : process.env['STORAGE_KEY_FLUENTUI'];
  console.log('test fuent account1');
  const storage = require('azure-storage-simple')(account, key);
  return storage;
};

export function getDefaultBlobDownloadConfig(
  containername: string,
  blobprefix: string,
  localfolder: string,
): BlobDowloadConfig {
  const config = {
    container: containername,
    blobPrefix: blobprefix,
    folder: localfolder,
    generateSasToken: false,
    skipBaselineDownload: false,
    blobexp: false, // Experimental flight to test different way of downloading blob
    storage: undefined,
    createFolder: true,
    includeSubFolders: false,
  };
  return config;
}

export function getDefaultBlobUploadConfig(
  containername: string,
  blobprefix: string,
  localfolder: string,
): BlobUploadConfig {
  const config = {
    container: containername,
    blobFilePrefix: blobprefix,
    localFolder: localfolder,
    generateSasToken: false,
    isGzip: false,
    includeSubFolders: false,
  };
  return config;
}
