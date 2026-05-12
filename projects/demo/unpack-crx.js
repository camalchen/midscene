/**
 * 解压 Midscene Chrome 扩展 CRX 文件
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const crxPath = 'E:\\midscene\\chrome-extension\\midscene-extension\\gbldofcpkknbggpkmbdaefngejllnief_v1.38.crx';
const outputDir = 'E:\\midscene\\chrome-extension\\midscene-extension\\unpacked';

// 读取 CRX 文件
const buf = fs.readFileSync(crxPath);
// CRX3 格式：头部4字节魔数 + 4字节版本 + 4字节头部长度
const headerLen = buf.readUInt32LE(8);
console.log('CRX header length:', headerLen);

// 提取 ZIP 数据（CRX3头部 = 12字节前缀 + headerLen字节数据）
const zipOffset = 12 + headerLen;
console.log('ZIP data offset:', zipOffset);
const zipData = buf.slice(zipOffset);

// 写入临时 ZIP 文件
const tempZip = path.join(outputDir, '..', 'temp.zip');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(tempZip, zipData);

// 解压 ZIP 文件
console.log('解压中...');
execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${outputDir}' -Force"`);
fs.unlinkSync(tempZip);

console.log('解压完成！输出目录:', outputDir);
console.log('manifest.json:', fs.existsSync(path.join(outputDir, 'manifest.json')));
