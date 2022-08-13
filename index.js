import { db } from "./firebase.js";

db.collection("test").add({
  test: "test",
});
