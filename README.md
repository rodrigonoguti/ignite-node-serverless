# ignite-node-serverless
Rocketseat Ignite project to get into serverless and AWS tools.

The project concerns a course certificate generator and validator.

Main technologies and tools:
- NodeJS
- Typescript
- AWS: S3, DynamoDB, Lambda, API Gateway

To run the project on localhost, follow the steps:
- Clone the repository
- Change AWS Bucket name in the following files:
```
./src/functions/generateCertificate.ts
./src/functions/verifyCertificate.ts
```
- Install dependencies with ```yarn```
- Run DynamoDB with ```yarn dynamo:start```
- Run project with ```yarn dev```
- Deploy project to your AWS account with ```yarn deploy```

Available routes:
- POST http://localhost:3000/dev/generateCertificate
```
{
  "id": "5c75a2c3-be75-4ab4-85c4-3504d6867f14",
  "name": "Test name",
  "grade": "9.00"
}
```
- GET http://localhost:3000/dev/verifyCertificate/{id}

While in the development period, the project is running on:
- POST https://ymvi123se0.execute-api.sa-east-1.amazonaws.com/dev/generateCertificate
- GET https://ymvi123se0.execute-api.sa-east-1.amazonaws.com/dev/verifyCertificate/{id}
