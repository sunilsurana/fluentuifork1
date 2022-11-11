type BlobItem = {
  name: string;
};

// Find list of blobitems/files from a container and triggers the callback function
export function listBlobs(blobService, container: string, blobPrefix: string): Promise<BlobItem[]> {
  let blobItems: BlobItem[] = [];
  return new Promise(async resolve => {
    console.log('Started listBlobs');
    let token = null;
    do {
      const [resultItems, result] = await listBlobsSegmented(blobService, container, blobPrefix, token);

      blobItems = blobItems.concat(resultItems);
      console.log('There are ' + resultItems.length + ' blobs on this page.');

      if (result && result.continuationToken) {
        console.log('Received a page of results. There are ' + resultItems.length + ' blobs on this page.');
        token = result.continuationToken;
      } else {
        console.log('Completed listing. There are ' + blobItems.length + ' blobs');
        console.log('List of blob names:' + blobItems.map(a => a.name).join(', '));
      }
    } while (token);
    resolve(blobItems);
    console.log('Finished listBlobs');
  });
}

export function listBlobDirectories(
  blobService,
  container: string,
  blobPrefix: string,
  includeSubfolders?: boolean,
): Promise<BlobItem[]> {
  return new Promise(async resolve => {
    if (!includeSubfolders) {
      const blobItems = await listBlobDirectoriesShallow(blobService, container, blobPrefix);
      console.log('Found ' + blobItems.length + ' blobs in top level folder');
      resolve(blobItems);
      return;
    }

    const blobItems: BlobItem[] = [];
    await listBlobDirectoriesRecursive(blobService, container, blobPrefix, blobItems);
    console.log('Found ' + blobItems.length + ' blobs in all subfolders');
    resolve(blobItems);
  });
}

async function listBlobDirectoriesRecursive(
  blobService,
  container: string,
  blobPrefix: string,
  accBlobItems: BlobItem[],
): Promise<void> {
  console.log('Start listBlobDirectoriesRecursive for ' + blobPrefix);
  const blobItems: BlobItem[] = await listBlobDirectoriesShallow(blobService, container, blobPrefix);

  await Promise.all(
    blobItems.map((blobItem: BlobItem) => {
      accBlobItems.push(blobItem);
      return listBlobDirectoriesRecursive(blobService, container, blobItem.name, accBlobItems);
    }),
  );
}

function listBlobDirectoriesShallow(blobService, container: string, blobPrefix: string): Promise<BlobItem[]> {
  let blobItems: BlobItem[] = [];
  return new Promise(async resolve => {
    console.log('Started listBlobDirectories');
    let token = null;
    do {
      const [resultItems, result] = await listBlobDirectoriesSegmented(blobService, container, blobPrefix, token);

      blobItems = blobItems.concat(resultItems);
      console.log('There are ' + resultItems.length + ' blob folders on this page.');

      if (result && result.continuationToken) {
        console.log('Received a page of results. There are ' + resultItems.length + ' blob folders on this page.');
        token = result.continuationToken;
      } else {
        console.log('Completed listing folders. There are ' + blobItems.length + ' folders');
        console.log('List of blob folders:' + blobItems.map(a => a.name).join(', '));
      }
    } while (token);
    resolve(blobItems);
    console.log('Finished listBlobDirectories');
  });
}

function listBlobDirectoriesSegmented(
  blobService,
  container: string,
  prefix: string,
  token,
  // tslint:disable-next-line: no-any
): Promise<any> {
  return new Promise(resolve => {
    blobService.listBlobDirectoriesSegmentedWithPrefix(
      container,
      prefix,
      token,
      { delimiter: '/' },
      (errorBlobListing, result) => {
        if (errorBlobListing) {
          console.log('listBlobDirectories Error: ' + errorBlobListing);

          return resolve([[], result]);
        }
        console.log('There are ' + result.entries.length + ' folders on this page.');
        resolve([result.entries, result]);
      },
    );
  });
}

function listBlobsSegmented(
  blobService,
  container: string,
  blobPrefix: string,
  token,
  // tslint:disable-next-line: no-any
): Promise<any> {
  return new Promise(resolve => {
    blobService.listBlobsSegmentedWithPrefix(
      container,
      blobPrefix,
      token,
      { delimiter: '/' },
      (errorBlobListing, result) => {
        if (errorBlobListing) {
          console.log('listBlobs Error: ' + errorBlobListing);

          return resolve([[], result]);
        }
        console.log('There are ' + result.entries.length + ' blobs on this page.');
        resolve([result.entries, result]);
      },
    );
  });
}
