import { Context } from 'koishi'
import { $ } from 'koishi'

  //习惯把增删改都加了事务不知道会有什么后果
 export class DataBaseService{

  /**
   * 查询所有集会码信息
   * @param ctx 
   * @param groupId 群号
   * @returns 数据表数组
   */
   async showInfoByGroupId(ctx: Context, groupId: string) {
     try {
       // 查询排序返回
       return await ctx.database
         .select('gatheringhub')
         .where(row => $.eq(row.group_id, groupId))
         .orderBy(row => row.hub_no)
         .execute();
     } catch (error) {
       console.error('Error fetching data:', error);
       throw new Error('Unable to fetch data');
     }
   }
   
   /**
    * 根据编号查询集会码信息
    * @param ctx 
    * @param hubNo 编号
    * @param groupId 群号
    * @returns 数据表数组
    */
   async showInfoByNo(ctx:Context, hubNo: number, groupId: string ){
    try {
      return await ctx.database
        .select('gatheringhub')
        .where(row => $.eq(row.hub_no, hubNo)&&$.eq(row.group_id, groupId))
        .execute();
      } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Unable to fetch data');
      }
   }

  /**
   * 添加集会码
   * @param ctx 
   * @param hubName 集会码
   * @param userId 添加者id
   * @param groupId 群号
   * @param note 备注
   * @param hubNo 排序编号
   */
   async addInfo(ctx: Context, hubName: string, userId: string,groupId:string, note: string, hubNo: number) {
    await ctx.database.transact(async()=>{
    //判断是否有指定编号数据,有的话全部后移1个编号
     const hasData = await ctx.database.get('gatheringhub',
       {
         hub_no: [hubNo],
         group_id: [groupId]
       }) !== null;
     if (hasData) {
       await this.incrementRowNo(ctx,hubNo,groupId,1)
     }
     //添加一行数据,返回值是添加的行的完整数据 (包括自动填充的 id 和默认属性等)
     await ctx.database.create('gatheringhub',
      {
        hub_name: hubName,
        hub_no: hubNo,
        add_date: new Date(),
        user_id: userId,
        group_id: groupId,
        note: note
      })
    })
    }

    /**
     * 删除指定编号的集会码,并把后面的所有编号前移1
     * @param ctx 
     * @param hubNo 编号
     * @param groupId 群号
     * @returns 提示字符串
     */
   async removeInfoByNo(ctx: Context, hubNo: number, groupId: string) {
     //删除指定No.的集会码,并把后面的No.前移
     const result=await ctx.database.remove('gatheringhub', {
       hub_no: hubNo,
       group_id: groupId
     })
     await this.incrementRowNo(ctx, hubNo, groupId, -1);
     return result.matched==0?  "删除失败,没有这个编号喵":"删除成功喵";
   }

  /**
   * 将大于指定编号的行的编号全部前移或后移
   * @param ctx 
   * @param hubNo 指定的编号
   * @param groupId 群号
   * @param num 指定移动的数
   */
  async incrementRowNo(ctx:Context,hubNo:number,groupId:string,num:number){
    await ctx.database.set('gatheringhub',
      {
        hub_no:{$gte: hubNo},
        group_id:{$eq : groupId}
      },
      (row)=>(
      {
        hub_no:$.add(row.hub_no,num)
      }))
  }
  /**
   * 删除某群的某个群公告
   * @param ctx 
   * @param noticeId 公告id
   * @param groupId 群号
   */
  async delNoticeByNoticeId(ctx:Context,noticeId:string,groupId:string){
    await ctx.database.remove('gatheringhub_notice',{
      notice_id:noticeId,
      group_id:groupId
    })
  }
  /**
   * 查询某群所有由本bot发送的所有公告
   * @param ctx 
   * @param groupId 群号
   * @returns gatheringhubNotice类型数组
   */
  async showNoticeByGroupId(ctx:Context,groupId:string){
    return await ctx.database.get('gatheringhub_notice',
      {
        group_id: [groupId]
      })
  }
  /**
   * 存储bot发送时的公告信息
   * @param ctx 
   * @param groupId 
   * @param noticeId 
   */
  async insertNoticeByGroupId(ctx:Context,groupId:string,noticeId:string){
    await ctx.database.create('gatheringhub_notice',
      {
        notice_id: noticeId,//公告id
        group_id: groupId,//群号
        add_date: new Date(),//添加时间
      })
  }


  /**
   * 初始化数据表
   * @param ctx 
   */
  async dbInit(ctx:Context){
    //创建表
    ctx.model.extend('gatheringhub',
      {
        hub_id: 'unsigned',
        hub_name: 'string',
        hub_no: 'unsigned',
        add_date: 'timestamp',
        group_id: 'string',
        user_id: 'string',
        note: 'string'
      },
      {
        primary:'hub_id',//设置主键
        autoInc:true,//主键自增
        //unique: ['hub_no'],//不可重复约束
      }
    )
    //这个表用来存储由bot发送的公告,不需要内容,方便后续删除更新
    ctx.model.extend('gatheringhub_notice',
      {
        hub_notice_id: 'unsigned',//自增主键
        notice_id: 'string',//公告id
        group_id: 'string',//群号
        add_date: 'timestamp',//添加时间
      },
      {
        primary:'hub_notice_id',//设置主键
        autoInc:true,//主键自增
      }
    )
  }

}