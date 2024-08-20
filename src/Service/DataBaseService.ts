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
  }

}