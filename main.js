import { Actor } from "apify";

console.log("SCRIPT STARTED (MAIN.JS)");
await Actor.init();

console.log("ACTOR INIT OK");

await Actor.exit();
console.log("DONE");
