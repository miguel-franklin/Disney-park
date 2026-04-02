# AWS CodePipeline -> S3 (from GitHub `master`)

This project is a static Vite app.  
Pipeline flow:
1. Source: GitHub (`master`)
2. Build: AWS CodeBuild (`buildspec.yml`)
3. Deploy: S3 deploy action

## 1) Prepare S3 bucket

1. Create (or reuse) a bucket for site files, for example `travel-map-site-prod`.
2. Keep **Block Public Access ON** if you serve via CloudFront + OAC (recommended).
3. If you want direct S3 website hosting (not recommended for production), disable block public access and add public-read bucket policy.

## 2) Create CodeBuild project

1. Open AWS Console -> CodeBuild -> Create build project.
2. Source provider: **CodePipeline**.
3. Environment:
   - Managed image: Amazon Linux
   - Runtime: Standard
   - Image: standard latest
   - Service role: create new role (or existing with required permissions)
4. Buildspec: **Use a buildspec file**.
5. Filename: `buildspec.yml` (at repo root).
6. Save project.

## 3) Create CodePipeline

1. Open AWS Console -> CodePipeline -> Create pipeline.
2. Pipeline type: V2 (or V1, either works).
3. Source stage:
   - Source provider: **GitHub (via CodeStar connection)**
   - Connect account and select repository
   - Branch: `master`
   - Trigger: on push
4. Build stage:
   - Provider: **CodeBuild**
   - Select the build project from step 2
5. Deploy stage:
   - Provider: **Amazon S3**
   - Bucket: your target bucket (e.g. `travel-map-site-prod`)
   - Extract file before deploy: **Yes**
   - Input artifact: output from Build stage
6. Create pipeline.

## 4) IAM permissions to verify

The CodePipeline/CodeBuild roles need:
- Read access to source artifact bucket
- Build artifact write/read
- Deploy permission to target bucket (`s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`)

## 5) (Recommended) Add CloudFront in front of S3

If you use CloudFront:
1. Create distribution with S3 origin (OAC).
2. Point DNS/domain to CloudFront.
3. Optional: add a final pipeline step for cache invalidation.

## 6) Test

1. Push a commit to `master`.
2. Confirm pipeline runs all 3 stages.
3. Open your site URL and verify latest content.

---

## Notes for this repo

- Frontend app lives in `frontend/`.
- Build output is `frontend/dist`.
- Pipeline build commands come from `buildspec.yml`.
