# koishi-plugin-gatheringhub-helper

[![npm](https://img.shields.io/npm/v/koishi-plugin-gatheringhub-helper?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-gatheringhub-helper)


## 介绍  
`koishi-plugin-gatheringhub-helper` 是一款为怪猎玩家设计的简单的插件，此插件旨在帮助怪猎群友快速发布获取群集会码

## 使用例
- **查询集会码**  
  输入 `jhm` 即可查询本群的所有集会码。

- **添加集会码**  
  输入 `jhm -a 114514191981 冥赤龙`，添加一条新的集会码 `114514191981`，备注为`冥赤龙`。

- **删除集会码**  
  输入 `jhm -d 1` 删除编号为 1 的集会码。

- **集会码记录**  
  输入 `jhm -s 1` 查看编号为 1 的集会码的添加记录。  
## 功能特性  
✅ 数据库存储：高效地存储和管理群集会码。  
✅ 分群存储：根据群组进行集会码的独立存储。  
✅ 管理员/群主控制：仅群管理员和群主可以进行管理操作。  
✅ 指定用户控制：允许特定用户进行集会码的管理。  
✅ 检测非法格式：自动检测并拒绝非法格式的集会码。  
✅ 编号自动对齐：新增集会码时自动对齐编号。  
✅ 记录追溯：记录集会码的添加操作。  
🚧 回复添加：通过回复消息添加集会码。  
🚧 跨平台支持：即将支持更多平台适配。  
## 兼容性
目前，本插件仅支持 [**onebot**](https://github.com/koishijs/koishi-plugin-adapter-onebot) 适配器。

## 其他 
如果有问题欢迎提出[Issue](https://github.com/intling-luo/koishi-plugin-gatheringhub-helper/issues)  
不管有没有问题都欢迎通过abc1514671906@163.com联系我

## License
[MIT](LICENSE) License Copyright (c) 2024 ling
