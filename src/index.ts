import { Argv, Context, Schema, sleep } from 'koishi'
import { DataBaseService } from './Service/DataBaseService'
import type { OneBotBot } from 'koishi-plugin-adapter-onebot'
import { } from 'koishi-plugin-cron'
import { FileService } from './Service/FileService'
export const name = 'gatheringhub-helper'
export const usage = `
此插件旨在帮助怪猎群友快速发布获取群集会码  
<small>暂仅支持onebot适配器</small>  
## 使用例
- **查询集会码**  
  输入 'jhm' 即可查询本群的所有集会码。

- **添加集会码**  
  输入 'jhm -a 114514191981 冥赤龙'，添加一条新的集会码 '114514191981'，备注为'冥赤龙'。

- **删除集会码**  
  输入 'jhm -d 1' 删除编号为 1 的集会码。  
  
- **集会码记录**  
  输入 'jhm -s 1' 查看编号为 1 的集会码的添加记录。 

- **同步集会码**
  在编辑好群集会码信息后 输入 'jhm -n' 即可同步群集会码信息。  

`
export const inject = {
    required: ['database'],
    optional: ['cron']
}

export interface Config {
    botId: number
    justAdmin: boolean
    otherUser: Array<string>
    hoursBroad: boolean
    broadGroupId: Array<string>
}

export const Config = Schema.intersect([
    Schema.object({
        botId: Schema.number().required().description('机器人的QQ号'),
    }),
    Schema.object({
        justAdmin: Schema.boolean().default(false).description('仅允许管理员群主发布删除群集会码'),
    }),
    Schema.union([
        Schema.object({
            justAdmin: Schema.const(true).required(),
            otherUser: Schema.array(String).description("管理员以外可以操作的qqid").default(['3283467223'])
        }),
        Schema.object({}),
    ]),
    Schema.object({
        hoursBroad: Schema.boolean().default(false).description('每小时自动播报一次')
    }),
    Schema.union([
        Schema.object({
            hoursBroad: Schema.const(true).required(),
            broadGroupId: Schema.array(String).description('播报群号').default(['317701038'])
        }),
        Schema.object({})
    ])
])


declare module 'koishi' {
    interface Tables {
        gatheringhub: Gatheringhub
        gatheringhub_notice: GatheringhubNotice
    }
}

//这里是新增表的接口类型
export interface Gatheringhub {
    hub_id: number//自增主键
    hub_name: string//集会码
    hub_no: number//排序编号
    add_date: Date//添加时间
    group_id: string//群号
    user_id: string//添加人id
    note: string//备注
}
//公告表
export interface GatheringhubNotice {
    hub_notice_id: number//自增主键
    notice_id: string//公告id
    group_id: string//群号
    add_date: Date//添加时间
}
declare module 'koishi' {
    interface Events {
        // 方法名称对应自定义事件的名称
        // 方法签名对应事件的回调函数签名
        'gatheringhub-helper/timer-broad-event'(groupIdArray: Array<string>): void
    }
}

//定义操作数据库对象
const dbs = new DataBaseService();
const fileService = new FileService();
export function apply(ctx: Context, config: Config) {
    dbs.dbInit(ctx);

    if (ctx.cron && config.hoursBroad) {
        ctx.cron('0 * * * *', () => ctx.emit('gatheringhub-helper/timer-broad-event', config.broadGroupId));

        ctx.on('gatheringhub-helper/timer-broad-event', async (groupIdArray: string[]) => {
            const bot = ctx.bots[`onebot:${config.botId}`] as OneBotBot<Context>;
            for (const groupId of groupIdArray) {
                const message = await jhmShowAll(ctx, groupId);
                await bot.internal.sendGroupMsg(groupId, message.trim());
            }
        });
    }

    ctx.command('jhm <message:string> <note:text>', '怪物猎人集会码助手')
        .option('add', '-a 添加新的集会码')
        .option('remove', '-r 删除指定编号的集会码')
        .option('select', '-s 查询指定编号集会码的添加者和时间')
        .option('notice', '-n 将本群集会码同步到群公告')
        .action((argv, message, note) => jhmService(argv, ctx, config, message, note))
        .example('jhm -a 114514191981 冥赤龙 将 114514191981 添加到集会码列表中设置备注为冥赤龙')
        .example('jhm -r 1 将编号为1的集会码删除');
}


async function jhmService(argv: any, ctx: Context, config: Config, massage: string, note: string) {
    //console.log(argv.options.add+" "+argv.options.remove+" "+massage);
    //console.log(argv.session.onebot);
    if (!argv.session.onebot) {
        return "暂仅支持onebot适配器喵"
    }
    if (!(argv.session.onebot.message_type == 'group')) {
        return '非群聊环境无法使用集会码助手喵';
    }
    //群号
    const groupId = argv.session.onebot.group_id;
    //发送者id
    const userId = argv.session.onebot.user_id.toString();
    //发送者身份 owner 或 admin 或 member,如果在白名单则无视权限
    var userRole = config.justAdmin ? argv.session.onebot.sender.role : "owner"
    if (config.otherUser.includes(userId)) {
        userRole = "owner"
    }
    //bot在群内的信息
    const botInfo= await argv.session.onebot.getGroupMemberInfo(groupId,config.botId,false);
    //集会码在数据库中的排序编号
    const hubNo = 1
    

    if (argv.options.add) {
        if (userRole == "member") {
            return '非管理无法操作喵';
        }
        if (!massage || massage.length != 12) {
            return '输入的集会码长度错误喵';
        }
        return await jhmAdd(ctx, massage, note, userId, groupId, hubNo);
    }
    else if (argv.options.remove) {
        if (userRole == "member") {
            return '非管理无法操作喵';
        }
        return await jhmRemove(ctx, massage, groupId);
    }
    else if (argv.options.select) {
        if (userRole == "member") {
            return '非管理无法操作喵';
        }
        return await jhmSelect(ctx, massage, groupId);
    }
    else if (argv.options.notice) {
        if(botInfo.role=='member'){
            return '呜呜,不是管理无法操作群公告喵';
        }
        if (await sendGroupNoticeRun(ctx, argv, groupId)) {
            return '同步成功喵';
        }
        else {
            return '同步失败喵,请联系作者查看日志';
        }
    }
    return await jhmShowAll(ctx, groupId);
}

/**
 * 返回本群所有集会码信息
 * @returns 集会码信息字符串
 */
async function jhmShowAll(ctx: Context, groupId: string) {
    const gatheringhubArray = await dbs.showInfoByGroupId(ctx, groupId)
    let gatheringhubList: string = "集会码            编号    备注\n"
    gatheringhubArray.forEach(element => {
        gatheringhubList += (
            element.hub_name + "    " +
            element.hub_no + "    " +
            element.note + "\n"
        )
    });
    return gatheringhubList

}

/**
 * 返回本群指定编号的集会码添加信息
 * @param ctx 
 * @param groupId 
 * @returns 
 */
async function jhmSelect(ctx: Context, massage: string, groupId: string) {
    const hubNo = parseInt(massage)
    const gatheringhubArray = await dbs.showInfoByNo(ctx, hubNo, groupId)
    let gatheringhubList: string = "编号     添加者id        添加时间\n"
    gatheringhubArray.forEach(element => {
        gatheringhubList += (
            element.hub_no + "    " +
            element.user_id + "    " +
            element.add_date.toLocaleString('zh-CN', {
                month: 'long',   // 全称月份
                day: 'numeric',  // 数字日期
                hour: 'numeric', // 小时
                minute: 'numeric', // 分钟
                second: 'numeric', // 秒
                hour12: false    // 24小时制
            }) + "\n"
        )
    });
    return gatheringhubList
}


async function jhmAdd(ctx: Context, massage: string, note: string, userId: string, groupId: string, hubNo: number) {
    if (!note) {
        note = "无"
    }
    // TODO:给本群添加一个集会码
    dbs.addInfo(ctx, massage, userId, groupId, note, hubNo);
    return "添加成功喵"
}

async function jhmRemove(ctx: Context, massage: string, groupId: string) {
    const hubNo = parseInt(massage)
    return dbs.removeInfoByNo(ctx, hubNo, groupId);
}
/**
 * 执行发送群公告包括前后流程
 */
async function sendGroupNoticeRun(ctx: Context, argv: Argv, groupId: string) {
    /*TODO: 由于qq的神奇公告id,每次同步流程应该是:数据库查询所有bot发送的公告获取noticeId->调用接口删除对应noticeId的公告->删除数据库中的对应公告->
    调用数据库查询所有集会码信息->将信息传递给接口发送公告->保存公告信息到数据库*/
    try {
        let notices: GatheringhubNotice[] = await dbs.showNoticeByGroupId(ctx, groupId);
        for (const notice of notices) {
            try {
                await argv.session.onebot.delGroupNotice(groupId, notice.notice_id);
                argv.session.onebot.sendGroupMsgAsync(groupId, "成功删除一条bot发送的公告喵");
                ctx.logger("hubNoticeDel").info(groupId + notice.notice_id + " delOk");
                if (!await dbs.delNoticeByNoticeId(ctx, notice.notice_id, groupId)) {
                    throw new Error("the notice in database is not exist");
                }
                ctx.logger("hubNoticeDelDB").info(groupId + " " + notice.notice_id + " delOk");
            } catch (error) {
                ctx.logger("hubNoticeDelDB").warn(groupId + " " + notice.notice_id + " delFail!! " + error);
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
        }
        let hubNameArray: Gatheringhub[] = await dbs.showInfoByGroupId(ctx, groupId);
        await argv.session.onebot.sendGroupNotice(groupId, await noticeFormat(hubNameArray, ctx), null, 1, 0);
        let noticeInfo = await argv.session.onebot.getGroupNotice(groupId);
        noticeInfo.forEach(async (notice) => {
            if (notice.sender_id == argv.session.onebot.self_id) {
                await dbs.insertNoticeByGroupId(ctx, groupId, notice.notice_id);
            }
        })
        return true
    } catch (error) {
        ctx.logger("hubNoticeSend").warn("sendNoticeFail!!" + error)
        return false
    }
}

async function noticeFormat(hubNameArray: Gatheringhub[], ctx: Context) {
    await fileService.init(hubNameArray, ctx);
    await fileService.checkAndCopyTemplate();
    let notice = fileService.replacePlaceholders();
    if (notice == null) {
        throw new Error("获取公告模板发生错误");
    }
    return notice;
}