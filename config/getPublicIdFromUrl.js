function getPublicIdFromUrl(url) {
    const parts = url.split('/');
    const filename = parts.pop();
    const publicId = filename.split('.')[0]; // Removing the file extension
    return publicId;
  }

module.exports = getPublicIdFromUrl