import { db } from "./db/firebase.js";
import fetchTwitterData from "./scripts/fetch-twitter-data.js";
import { runTweetETL, runUsersETL } from "./scripts/twitter-ETL.js";

// Scripts
// await fetchTwitterData();
const userIds = await runUsersETL();
const countUsers = (await db.collection("users").get()).size;
console.log(`User ETL Performed on ${countUsers} users`);

await runTweetETL(userIds);
