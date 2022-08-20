const { normalize, join } = require("path");
const { existsSync } = require("fs");
const dayjs = require("dayjs");
const { conf, zone, form_up, auth, rs } = require("qiniu");
const { sendNotify } = require("./sendNotify");

const backupDirPath = process.env.BACKUP_FILE_PATH;
const accessKey = process.env.QINIU_ACCESS_KEY;
const secretKey = process.env.QINIU_SECRET_KEY;

//存储桶名
const BUCKET = "bt-docker-backup";
//存储文件名及可覆盖文件名
const KEY_TO_OVERWRITE = "backup.tar.gz";
let message = "备份上传失败，";

/**
 * 获取上传凭证及上传配置
 * @returns {{uploadToken: string, uploadConfig: conf.Config}}
 */
function generateToken() {
  const mac = new auth.digest.Mac(accessKey, secretKey);
  const putPolicy = new rs.PutPolicy({
    scope: BUCKET + ":" + KEY_TO_OVERWRITE,
  });
  //上传token
  const uploadToken = putPolicy.uploadToken(mac);
  //上传配置
  const uploadConfig = new conf.Config({
    zone: zone.Zone_z1,
    useHttpsDomain: true,
    useCdnDomain: true,
  });
  return {
    uploadToken,
    uploadConfig,
  };
}

/**
 * 生成备份文件名
 * @returns {string} 备份文件名
 */
function generateBackupFileName() {
  return `path_volumes_${dayjs().format("YYYYMMDD")}_013000.tar.gz`;
}

/**
 * 生成备份文件路径
 * @param {string} backupFileName 备份文件名
 * @returns {string} 备份文件路径
 */
function generateBackupFilePath(backupFileName) {
  const dirPath = normalize(backupDirPath);
  return join(dirPath, backupFileName);
}

/**
 * 判断备份文件是否存在
 * @param {string} backupFilePath 备份文件夹路径
 * @returns {boolean} 是否存在
 */
function hasBackupFile(backupFilePath) {
  return existsSync(backupFilePath);
}

/**
 * 上传备份文件
 * @param {string} filePath 备份文件路径
 * @param {conf.Config} uploadConfig 上传配置
 * @param {string} uploadToken 上传凭证
 */
function uploadFile(filePath, uploadConfig, uploadToken) {
  const formUploader = new form_up.FormUploader(uploadConfig);
  const putExtra = new form_up.PutExtra();
  // 文件上传
  formUploader.putFile(
    uploadToken,
    KEY_TO_OVERWRITE,
    filePath,
    putExtra,
    async function (resErr, resBody, resInfo) {
      if (resErr) throw resErr;
      if (resInfo.statusCode === 200) {
        console.log("上传成功");
        console.log(resBody);
      } else {
        console.error("上传失败");
        console.error(resInfo.statusCode);
        console.error(resBody);
        message += `状态码：${resInfo.statusCode}，错误信息：${resBody}。`;
        await pushMessage(message);
      }
    }
  );
}

/**
 * 推送上传备份文件信息
 * @param message 生成的备份信息
 * @returns {Promise<void>}
 */
async function pushMessage(message) {
  await sendNotify("上传服务器备份", message, {}, "\n本通知By:@ServerBackup");
}

async function main() {
  const { uploadToken, uploadConfig } = generateToken();
  const backupFileName = generateBackupFileName();
  const backupFilePath = generateBackupFilePath(backupFileName);
  if (hasBackupFile(backupFilePath)) {
    uploadFile(backupFilePath, uploadConfig, uploadToken);
  } else {
    console.error("备份文件不存在");
    message += "错误信息：备份文件不存在。";
    await pushMessage(message);
  }
}

main();
