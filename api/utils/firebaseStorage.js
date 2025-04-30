// Import the Firebase Admin SDK instance itself
const admin = require('firebase-admin'); 

/**
 * Uploads a file from the local filesystem to Firebase Storage.
 * @param {string} localFilePath The path to the local file to upload.
 * @param {string} destinationPath The desired path and filename in Firebase Storage (e.g., 'pdfs/my_document.pdf').
 * @returns {Promise<string>} A promise that resolves with the signed URL for the uploaded file.
 * @throws {Error} If the upload fails.
 */
async function uploadFileToFirebase(localFilePath, destinationPath) {
  // Get the bucket reference directly from the admin instance
  let bucket;
  try {
    bucket = admin.storage().bucket();
  } catch (initError) {
     console.error("Error getting storage bucket in uploadFileToFirebase:", initError);
     throw new Error('Firebase Admin SDK not properly initialized or storage bucket unavailable.');
  }

  if (!bucket) {
     // This check might be redundant now but kept for safety
     throw new Error('Failed to get Firebase Storage bucket reference.');
  }

  const options = {
    destination: destinationPath,
    metadata: {
      // Infer content type based on file extension, or set explicitly if needed
      // contentType: 'application/pdf', 
    },
  };

  try {
    console.log(`Uploading ${localFilePath} to ${bucket.name}/${destinationPath}...`);
    await bucket.upload(localFilePath, options);
    console.log(`Successfully uploaded ${localFilePath} to ${bucket.name}/${destinationPath}`);

    // Generate a signed URL for temporary access (e.g., valid for 1 hour)
    const [signedUrl] = await bucket.file(destinationPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    });
    
    console.log(`Generated signed URL for ${destinationPath}`);
    return signedUrl;

  } catch (error) {
    console.error(`ERROR uploading file ${localFilePath} to Firebase Storage:`, error.message);
    // Log the full error stack in development for detailed debugging
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    // Re-throw a more specific error to be handled by the caller
    throw new Error(`Firebase Storage upload failed for ${localFilePath}.`);
  }
}

module.exports = { uploadFileToFirebase }; 