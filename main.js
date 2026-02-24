import { Actor } from "apify";

console.log("🚀 SCRIPT STARTED");

await Actor.init();

console.log("Actor initialized");

await Actor.pushData({ test: "It works" });

console.log("Data pushed");

await Actor.exit();
