import * as fs from 'fs';

export class FileService {
    private FileUrl='external/gatheringhub-helper/NoticeTemplate/template1.txt';
    private nowDate = new Date().toLocaleString('zh-CN', {
        month: 'long',   // 全称月份
        day: 'numeric',  // 数字日期
        hour: 'numeric', // 小时
        minute: 'numeric', // 分钟
        hour12: false,    // 24小时制
        weekday: 'long'
    });
    private replacements = {
        date: this.nowDate,
        hubInfo: ''
    }
    constructor(hubInfo: any[]) {
        hubInfo.forEach((hub: any) => {
            this.replacements.hubInfo += (
                "*" + hub.note + ":  " + hub.hub_name + "\n"
            )
        })
    }
    
    replacePlaceholders(): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.FileUrl, 'utf-8', (err, data) => {
                if (err) {
                    console.error(`读取公告模板文件失败: ${err}`);
                    reject(err);
                    return;
                }
                // 替换占位符
                let result = data;
                for (const [placeholder, value] of Object.entries(this.replacements)) {
                    const regex = new RegExp(`{{${placeholder}}}`, 'g');
                    result = result.replace(regex, value);
                }
                resolve(result);
            });
        });
    }
}