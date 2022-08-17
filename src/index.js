import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";

// Twitter Scripts

// fetch data
//await fetchTwitterData();

// etls
const userIds = await runUsersETL();
await runTweetETL(userIds);
