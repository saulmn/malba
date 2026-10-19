import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn } from '@tanstack/react-start'
import { randomBytes } from 'crypto'

// Cloudflare R2 / AWS S3 Configuration
// For Cloudflare R2: Endpoint is usually https://<account_id>.r2.cloudflarestorage.com
export const getPresignedUploadUrlFn = createServerFn({ method: 'POST' })
  .validator((data: { contentType: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3 || ''
    const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-2'
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''
    const bucketName = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET || ''
    const publicUrl = process.env.S3_PUBLIC_URL || ''

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("El almacenamiento S3/R2 no está configurado en el servidor.")
    }

    const s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const fileExtension = data.fileName.split('.').pop()
    const uniqueFileName = `${randomBytes(16).toString('hex')}.${fileExtension}`
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      ContentType: data.contentType,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    
    const finalImageUrl = publicUrl 
      ? `${publicUrl}/${uniqueFileName}`
      : `${endpoint}/${bucketName}/${uniqueFileName}`

    return {
      uploadUrl,
      finalImageUrl,
    }
  })
