import {  Context, Schema } from 'koishi'
import { DataBaseService } from './Service/DataBaseService'

export const name = 'gatheringhub-helper'
export const usage =`
此插件旨在帮助怪猎群友快速发布获取群集会码  
## 使用例
- **查询集会码**  
  输入 'jhm' 即可查询本群的所有集会码。

- **添加集会码**  
  输入 'jhm -a 114514191981 冥赤龙'，添加一条新的集会码 '114514191981'，备注为'冥赤龙'。

- **删除集会码**  
  输入 'jhm -d 1' 删除编号为 1 的集会码
`
export const inject = {
  required: ['database']
}

export interface Config {
    justAdmin: boolean
    otherUser:Array<string>
}

export const Config= Schema.intersect([

    Schema.object({
        justAdmin: Schema.boolean().default(false).description('仅允许管理员群主发布删除群集会码'),
    }),
    Schema.union([
        Schema.object({
            justAdmin: Schema.const(true).required(),
            otherUser: Schema.array(String).description("管理员以外可以操作的qqid").default(['3283467223'])
        }),
        Schema.object({}),
    ])
])


declare module 'koishi' {
    interface Tables {
        gatheringhub: Gatheringhub
    }
}

//这里是新增表的接口类型
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
export function apply(ctx: Context , config: Config) {
    dbs.dbInit(ctx);
    ctx.command('jhm <massage:string> <note:text>','怪物猎人集会码助手')
    .option('add', '-a 添加新的集会码')
    .option('remove', '-r 删除指定编号的集会码')
    .action((argv,massage,note) =>jhmService(argv,ctx,config,massage,note))
    .example('jhm -a 114514191981 冥赤龙 将 114514191981 添加到集会码列表中设置备注为冥赤龙')
    .example('jhm -r 1 将编号为1的集会码删除')
}

async function jhmService(argv:any,ctx:Context,config:Config, massage: string,note:string){
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
    const userRole=config.justAdmin?argv.session.onebot.sender.role:"owner"
    //是否为群聊
    const isGroup=argv.session.onebot.message_type=='group'?true:false;

    const hubNo=1

    if(!isGroup){
        return '非群聊环境无法使用集会码助手喵';
    }
    if(argv.options.add){
        if(userRole=="member"){
            return '非管理无法操作喵';
        }
        if(!massage||massage.length!=12){
            return '输入的集会码长度错误喵';
        }
        return await jhmAdd(ctx,massage,note,userId,groupId,hubNo);
    }
    else if(argv.options.remove){
        if(userRole=="member"){
            return '非管理无法操作喵';
        }
        return await jhmRemove(ctx,massage,groupId);
    }
    return await jhmShowAll(ctx,groupId);
}

/**
 * 返回本群所有集会码信息
 * @returns 集会码信息字符串
 */
async function jhmShowAll(ctx:Context, groupId:string){
        const gatheringhubArray=await dbs.showInfoByGroupId(ctx,groupId)
        let gatheringhubList:string="集会码            编号    备注\n"
        gatheringhubArray.forEach(element => {
            gatheringhubList+=(
                element.hub_name+"    "+
                element.hub_no+"    "+
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