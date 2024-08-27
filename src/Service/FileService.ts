import * as fs from 'fs';
import { Context } from 'koishi';
import * as path from 'path';

export class FileService {
    private FileUrl = 'noticeTemplate/template1.txt';
    private nowDate = new Date().toLocaleString('zh-CN', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'long'
    });
    private replacements = {
        date: this.nowDate,
        hubInfo: ''
    }
    private targetDir: string; // 目标目录
    private ctx: Context;
    async init(hubInfo: any[], ctx: Context) {
        this.ctx = ctx;
        hubInfo.forEach((hub: any) => {
            this.replacements.hubInfo += (
                "· " + hub.note + ":  " + hub.hub_name + "\n"
            );
        });
        this.targetDir = path.join(this.ctx.baseDir, 'data/gatheringhub/noticeTemplate');
    }
    /**
     * 检查目标目录，如果目标目录不存在，则创建目标目录，并复制模板文件到目标目录
     */
    async checkAndCopyTemplate(): Promise<void> {
        try {
            // 检查目标目录是否存在
            await fs.promises.access(this.targetDir);
        } catch {
            // 如果目录不存在，则创建目录
            await fs.promises.mkdir(this.targetDir, { recursive: true });
            console.log(`目录 ${this.targetDir} 已创建`);
        }

        const destinationFilePath = path.join(this.targetDir, path.basename(this.FileUrl)); // 目标文件路径

        try {
            // 检查模板文件是否存在
            await fs.promises.access(destinationFilePath);
        } catch {
            // 如果模板文件不存在，则复制文件
            const templateFilePath = path.join(__dirname, this.FileUrl); // 获取模板文件的完整路径
            await fs.promises.copyFile(templateFilePath, destinationFilePath);
            console.log(`模板文件已复制到 ${destinationFilePath}`);
        }
    }

    /**
     * 读取模板文件
     * @returns 
     */
    replacePlaceholders(): Promise<string> {
        return new Promise((resolve, reject) => {
            const destinationFilePath = path.join(this.targetDir, path.basename(this.FileUrl)); // 获取目标文件路径
            fs.readFile(destinationFilePath, 'utf-8', (err, data) => {
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
