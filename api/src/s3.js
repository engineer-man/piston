const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const enabled = !!config.s3_bucket;

const client = enabled
    ? new S3Client({
          region: config.s3_region,
          ...(config.s3_endpoint ? { endpoint: config.s3_endpoint } : {}),
          credentials: {
              accessKeyId: config.s3_access_key_id,
              secretAccessKey: config.s3_secret_access_key,
          },
      })
    : null;

async function upload(buffer) {
    if (!client) throw new Error('S3 is not configured');
    const key = uuidv4();
    await client.send(
        new PutObjectCommand({
            Bucket: config.s3_bucket,
            Key: key,
            Body: buffer,
        })
    );
    return key;
}

module.exports = { upload, enabled };
