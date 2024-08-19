import { Session } from 'inspector'
import { Argv, Context, Schema } from 'koishi'

export const name = 'gatheringhub-helper'
export const usage =`此插件旨在帮助怪猎群友快速发布获取群集会码,免去频繁发公告修改公告的麻烦`

export const inject = {
  required: ['database']
}

export interface Config {

}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    ctx.command('jhm','怪物猎人集会码助手')
    .option('add', '-a <massage:text>  添加新的集会码')
    .option('remove', '-r <massage:number> 删除指定编号的集会码')
    .action((argv,massage) =>jhmService(argv,massage))
    .example('jhm -a 114514191981 将 114514191981 添加到集会码列表中')
    .example('jhm -r 1 将编号为1的集会码删除')
}

function jhmService(argv:any, massage: string){
    console.log(argv.session.event.member+""+massage);
    if(!massage)
    {
        return "未检测到有效输入"
    }
    if(argv.options.add)
    {
        return
    }
    else if(argv.options.remove){
        return
    }
    
    return jhmShowAll();
}

/**
 * 
 * @returns 返回本群所有集会码信息
 */
function jhmShowAll() :string {
// TODO:根据群号查询集会码信息 
    return ;
}

function jhmAdd(){
    // TODO:给本群添加一个集会码
}

function jhmRemove(){
    // TODO:删除本群的指定集会码
}