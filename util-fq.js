const fetch = require("node-fetch");

const fq_baseurl = "https://kcssr.one";

const username = process.env.FQ_USERNAME;
const password = process.env.FQ_PASSWORD;

const params = new URLSearchParams({
  email: username,
  passwd: password,
});

/**
 * 登录网站并返回写入的cookie
 * @returns {Promise<string>}
 */
async function login() {
  const res = await fetch(fq_baseurl + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (res.ok) {
    const cookie = await parseCookie(res.headers.raw()["set-cookie"]);
    const result = await res.json();
    if (result.ret === 1) {
      console.log("登录成功");
    } else {
      console.error("登录失败");
    }
    return cookie;
  }
}

/**
 * 解析写入的cookie
 * @param {string[]} cookieArray cookie数组
 * @returns {Promise<string>} cookie字符串
 */
async function parseCookie(cookieArray) {
  return cookieArray
    .map((item) => {
      return item.split(";")[0];
    })
    .join(";");
}

module.exports = {
  fq_baseurl,
  login,
};
