import {  Context, Schema } from 'koishi'
import { DataBaseService } from './Service/DataBaseService'

export const name = 'gatheringhub-helper'
export const usage =`
此插件旨在帮助怪猎群友快速发布获取群集会码,免去频繁发公告修改公告的麻烦
TODO:
数据库存储
分群存储
管理员群主可控(可配置)
指定qq可控(可配置)
检测输入格式
编号自动对齐自动插入
`
export const inject = {
  required: ['database']
}

export interface Config {

}

export const Config: Schema<Config> = Schema.object({})

declare module 'koishi' {
    interface Tables {
        gatheringhub: Gatheringhub
    }
}

// 这里是新增表的接口类型
export interface Gatheringhub {
    hub_id: number//自增主键
    hub_name: string//集会码
    hub_no:number//排序编号
    add_date: Date//添加时间
    group_id: string//群号
    user_id: string//添加人id
    note: string//备注
}
//定义操作数据库对象
const dbs=new DataBaseService();
export function apply(ctx: Context) {
    dbs.dbInit(ctx);
    ctx.command('jhm <massage:string> <note:text>','怪物猎人集会码助手')
    .option('add', '-a 添加新的集会码')
    .option('remove', '-r 删除指定编号的集会码')
    .action((argv,massage,note) =>jhmService(argv,ctx,massage,note))
    .example('jhm -a 114514191981 冥赤龙 将 114514191981 添加到集会码列表中设置备注为冥赤龙')
    .example('jhm -r 1 将编号为1的集会码删除')
}

async function jhmService(argv:any,ctx:Context, massage: string,note:string){
    //console.log(argv.options.add+" "+argv.options.remove+" "+massage);
    //console.log(argv.session.onebot);
    if(!argv.session.onebot){
        return "暂仅支持onebot适配器喵"
    }

    //群号
    const groupId=argv.session.onebot.group_id;
    //发送者id
    const userId=argv.session.onebot.user_id;
    //发送者身份 owner 或 admin 或 member
    const userRole= argv.session.onebot.sender.role
    //是否为群聊
    const isGroup=argv.session.onebot.message_type=='group'?true:false;

    const hubNo=1

    if(!isGroup){
        return '非群聊环境无法使用集会码助手喵';
    }
    if(argv.options.add){
        if(!massage||massage.length!=12){
            return '输入的集会码长度错误喵';
        }
        return await jhmAdd(ctx,massage,note,userId,groupId,hubNo);
    }
    else if(argv.options.remove){
        return await jhmRemove(ctx,massage,groupId);
    }
    return await jhmShowAll(ctx,groupId);
}

/**
 * 
 * @returns 返回本群所有集会码信息
 */
async function jhmShowAll(ctx:Context, groupId:string){
        const gatheringhubArray=await dbs.showInfoByGroupId(ctx,groupId)
        let gatheringhubList:string="编号     集会码          备注\n"
        gatheringhubArray.forEach(element => {
            gatheringhubList+=(
                element.hub_no+"  "+
                element.hub_name+"  "+
                element.note+"\n"          
            )
        });
        return gatheringhubList

}

async function jhmAdd(ctx:Context,massage:string,note:string,userId:string,groupId:string,hubNo:number){
    if(!note){
        note="无"
    }
    // TODO:给本群添加一个集会码
   dbs.addInfo(ctx, massage, userId,groupId, note,hubNo);
   return "添加成功喵"
}

async function jhmRemove(ctx: Context, massage: string, groupId: string) {
    const hubNo = parseInt(massage, 10)
    return dbs.removeInfoByNo(ctx, hubNo, groupId);
}