import { BlobService } from 'azure-storage';
import * as fs from 'fs';
import * as path from 'path';

export const writeArtifactsToLocalFolder = async (
  folder: string,
  blobName,
  blobStorage,
  blobexp: boolean = false,
  // tslint:disable-next-line: no-any
  blobService: any = undefined,
  containerName: string | undefined = undefined,
) => {
  const blobFileName = blobName.split('/').pop();
  const filepath = path.join(folder, blobFileName);

  if (!blobexp) {
    try {
      const blobContent = await blobStorage.read(blobName);

      if (!fs.existsSync(folder)) {
        console.log("The folder doesn't exist, creating");
        fs.mkdirSync(folder, { recursive: true });
      }

      await fs.promises.writeFile(filepath, blobContent);
      console.log('The blob: ' + blobName + ' was saved in file: ' + blobFileName);
    } catch (blobWriteerror: any) {
      console.log('Error in writeArtifactsToLocalFolder from Blob: ' + blobWriteerror);
    }
  } else {
    if (blobService && containerName) {
      return new Promise((resolve, reject) => {
        const azurehelper = require('azure-storage');
        const fileOption: BlobService.GetBlobRequestOptions = {
          speedSummary: new azurehelper.BlobService.SpeedSummary(blobName),
        };
        const summary = blobService.getBlobToLocalFile(
          containerName,
          blobName,
          filepath,
          fileOption,
          (blobexperror, serverBlob) => {
            if (blobexperror) {
              console.log('!EXP: Failed to save the blob: ' + blobName + ', Error: ' + blobexperror);
              reject(blobexperror);
            } else {
              console.log('!EXP: The blob: ' + blobName + ' was saved in file: ' + blobFileName);
              resolve(filepath);
            }
          },
        );
        summary.on('progress', () => {
          console.log(
            'SpeedSummary for - ' +
              summary.name +
              ' Percent:' +
              summary.getCompletePercent() +
              ' TotalSize: ' +
              summary.getTotalSize() +
              ' TotalTime: ' +
              summary.getElapsedSeconds(),
          );
        });
      });
    }
  }
};

export async function readFilesFromFolderAsync(
  dirname: string,
  includeSubFolders: boolean = false,
  // tslint:disable-next-line: no-any
): Promise<any[]> {
  const allFilenames = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(dirname, (err, filenames) => {
      if (err) {
        reject(err);
      } else {
        resolve(filenames);
      }
    });
  });

  return await Promise.all(
    allFilenames.map(filename => {
      return new Promise((resolve, reject) => {
        const filePath = path.resolve(dirname, filename);
        resolve([filename, filePath]);
      });
    }),
  );
}

export const copyScreenshotsFromSubfoldersToParentFolder = async (
  candidateFolder,
  destinationFolder = candidateFolder,
) => {
  await new Promise<string[]>((resolve, reject) => {
    fs.readdir(candidateFolder, (err, files) => {
      files.forEach(file => {
        const candidateFile = path.join(candidateFolder, '/', file);
        //If directory, move to the next file
        if (fs.statSync(candidateFile).isDirectory()) {
          copyScreenshotsFromSubfoldersToParentFolder(candidateFile, destinationFolder);
        } else {
          // We have an image!
          const destinationFile = path.join(destinationFolder, file);
          // Let's copy it!
          fs.copyFile(candidateFile, destinationFile, err => {
            if (err) {
              throw err;
            }
            console.log('File: ' + file + ' was copied to ' + destinationFile);
          });
        }
      });
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
};
