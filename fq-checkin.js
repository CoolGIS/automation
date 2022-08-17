const fetch = require("node-fetch");
const dayjs = require("dayjs");
const { sendNotify } = require("./sendNotify");
const { fq_baseurl, login } = require("./util-fq");

/**
 * 签到并生成签到信息
 * @returns {Promise<string|void>}
 */
async function checkin() {
  const datetime = dayjs().format("YYYY年MM月DD日");
  let message = `今天是${datetime}，`;
  const cookie = await login();
  const res = await fetch(fq_baseurl + "/user/checkin", {
    method: "POST",
    headers: { cookie: cookie },
  });
  if (res.ok) {
    const result = await res.json();
    if (result.ret === 1) {
      console.log("签到成功");
      message += `${result.msg}\n目前为止，流量总量：${result.traffic}，已用流量：${result.trafficInfo.lastUsedTraffic}，剩余流量：${result.trafficInfo.unUsedTraffic}。`;
    } else {
      console.error("签到失败");
      message += `签到失败。\n${result.msg}`;
    }
    return message;
  }
}

/**
 * 推送签到信息
 * @param message 生成的签到信息
 * @returns {Promise<void>}
 */
async function pushMessage(message) {
  await sendNotify("FQ签到", message, {}, "\n本通知By:@FQCheckin");
}

async function main() {
  const message = await checkin();
  await pushMessage(message);
}

main();
