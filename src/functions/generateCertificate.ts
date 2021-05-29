import chromium from "chrome-aws-lambda";
import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import dayjs from "dayjs";
import { S3 } from "aws-sdk";

import { document } from "../utils/dynamodbClient";
import { APIGatewayProxyHandler } from "aws-lambda";

interface ICreateCertificate {
  id: string;
  name: string;
  grade: string;
}

interface ITemplate {
  id: string;
  name: string;
  grade: string;
  date: string;
  medal: string;
}

const compile = async function (data: ITemplate) {
  const filePath = path.join(process.cwd(), "src", "templates", "certificate.hbs");

  const html = fs.readFileSync(filePath, "utf-8");

  return handlebars.compile(html)(data);
};

export const handle: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

  // Save certificate on database
  const userCertificateQuery = await document.query({
    TableName: "users_certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    },
  }).promise();

  const userCertificateAlreadyExists = userCertificateQuery.Items[0];

  if (!userCertificateAlreadyExists) {
    await document.put({
      TableName: "users_certificates",
      Item: {
        id,
        name,
        grade,
      }
    }).promise();
  }

  // Generate certificate
  const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
  const medal = fs.readFileSync(medalPath, "base64");

  const data: ITemplate = {
    date: dayjs().format("DD/MM/YYYY"),
    grade,
    name,
    id,
    medal
  };

  // Compile using handlebars
  const content = await compile(data);

  // Convert to PDF
  const browser = await chromium.puppeteer.launch({
    headless: true,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  });

  const page = await browser.newPage();

  await page.setContent(content);

  const pdf = await page.pdf({
    format: "a4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? "certificate.pdf" : null, // only to view the pdf while testing locally
  });

  await browser.close();

  // Save to S3
  const s3 = new S3();

  await s3.putObject({
    Bucket: "itachi-ignite-serverless-certificate",
    Key: `${id}.pdf`,
    ACL: "public-read",
    Body: pdf,
    ContentType: "application/pdf",
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Certificate created!",
      url: `https://itachi-ignite-serverless-certificate.s3-sa-east-1.amazonaws.com/${id}.pdf`
    }),
    headers: {
      "Content-type": "application/json",
    },
  };
}