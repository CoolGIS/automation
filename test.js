console.log("测试一下日志输出");

const $ = new Env("测试环境");
console.log($)

// const sendNotify =require("./sendNotify.js");

// sendNotify.sendNotify("通知头","tongzhiti");

console.log(process.env.test);

console.log("测试日志输出结束")
