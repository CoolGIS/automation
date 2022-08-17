const fetch = require("node-fetch");
const dayjs = require("dayjs");
const { sendNotify } = require("./sendNotify");

/**
 * 需要监控的省市名称
 * @type [{children: string[], name: string}]
 */
const provinceList = [
  {
    name: "北京",
    children: ["顺义", "朝阳"],
  },
  {
    name: "山西",
    children: ["晋中"],
  },
  {
    name: "海南",
    children: ["海口"],
  },
];

/**
 * 疫情数据API
 * @type {string}
 */
const cityDetailUrl =
  "https://api.inews.qq.com/newsqa/v1/query/inner/publish/modules/list?modules=statisGradeCityDetail,diseaseh5Shelf";

/**
 * 获取疫情数据
 * @returns {Promise<string[]|[string]|[string]|number[]|SamplingHeapProfileNode[]|NodeJS.Module[]|HTMLCollection|*>}
 */
async function getDate() {
  const res = await fetch(cityDetailUrl);
  const data = await res.json();
  //各省疫情数据数组
  return data.data.diseaseh5Shelf.areaTree[0].children;
}

/**
 * 获取监控名单中各省市疫情数据，并生成疫情信息
 * @param data 各省疫情数据数组
 * @returns {Promise<string>} 疫情信息
 */
async function getMessage(data) {
  const datetime = dayjs().format("YYYY年MM月DD日");
  let message = `今天是${datetime}，`;
  provinceList.map((provinceItem) => {
    //监控列表省级疫情数据
    const provinceData = data.filter((dataItem) => {
      return dataItem.name === provinceItem.name;
    });
    if (provinceData[0].today.confirm) {
      message += `${provinceItem.name}昨日新增${provinceData[0].today.confirm}例，其中`;
      //若有疫情，则获取监测名单中市级疫情数据
      provinceItem.children.map((cityItem, index) => {
        //监控列表市级疫情数据
        const cityData = provinceData[0].children.filter((dataItem) => {
          return dataItem.name === cityItem;
        });
        if (cityData[0].today.confirm) {
          message += `${cityItem}新增${cityData[0].today.confirm}例`;
        } else {
          message += `${cityItem}无新增病例`;
        }
        if (index === provinceItem.children.length - 1) {
          message += "。";
        } else {
          message += "，";
        }
      });
    } else {
      message += `${provinceItem.name}昨日无新增病例。`;
    }
  });
  return message;
}

/**
 * 推送疫情信息
 * @param message 生成的疫情信息
 * @returns {Promise<void>}
 */
async function pushMessage(message) {
  await sendNotify("疫情信息", message, {}, "\n本通知By:@Covid19Alert");
}

async function main() {
  const provinceData = await getDate();
  const message = await getMessage(provinceData);
  await pushMessage(message);
}

main();
