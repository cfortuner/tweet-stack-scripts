import { config as loadConfigs } from "dotenv";
loadConfigs();

export const config = {
  firebase: {
    serviceAccountFilePath: process.env.FIREBASE_SERVICE_ACCOUNT_FILE_PATH,
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiKeySecret: process.env.TWITTER_API_KEY_SECRET,
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  },
};
export default config;
