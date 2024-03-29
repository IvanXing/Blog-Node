# 一、初始化项目

- npm init -y
- 新建bin文件夹，下www.js为入口文件
- 运行 node bin/www.js ，访问localhost:8000查看结果，先跑通 http

- 安装 nodemon 和 cross-env
  - npm install nodemon cross-env --save-dev
  - nodemon可以监控文件变化，nodemon ./bin/www.js
  - cross-env NODE_ENV=dev，设置当前是dev环境，兼容linux和windows环境

- npm run dev
- npm run prd

- 通过 process.env.NODE_ENV 来识别 "dev": "cross-env NODE_ENV=dev nodemon ./bin/www.js" cross-env NODE_ENV指定的环境

# 二、项目分层

## 0. 分层总结

- www.js里创建http，监听端口
- 调用app.js中，设置请求头，解析url和参数，处理路由，未命中的404
- router中只管路由path，处理参数，返回正确格式
- controller中处理数据逻辑

## 1. 创建路由

- 新建 src/router/blog.js & user.js

## 2. 建立数据模型

- 新建 src/model/resModel.js
- 作用：在res.end返回时，返回一个清晰的数据结构，包含errno

## 3. 处理层 controller

- 新建 src/controller/blog.js
- Date.now()  =>  1603285217168

## 4. 分层总结

- bin/www.js 中是 createServer 的逻辑
- app.js 中是设置 请求头，404，以及返回值的公共逻辑，不涉及业务
- src/router 中 只管路由相关，来什么参数，返回给客户端什么，且是正确的格式
- src/controller 中处理 sql 逻辑，返回值，根据参数处理数据

- postdata是res.on监听data和end, res.end是一个异步的过程，需要promise
```
 if (method === "POST") {
    let postData = "";
    req.on("data", chunk => {
      postData += chunk.toString();
    });
    req.on("end", () => {
      resData.postData = postData;
      // 返回
      res.end(JSON.stringify(resData));
    });
  }
```
- 经过实际测试
```
req.headers['content-type'] 中，content 必须用小写，否则获取不到。
res.setHeader('Content-type', 'application/json') 中，content 大写小写浏览器都可以识别。但是，根据 http 协议的统一格式，还是建议 C 大写。
因此，总结一下。req.headers['content-type'] 中用小写，res.setHeader('Content-type', 'application/json') 中用大写。
```

## 5. GET 直接通过参数处理  POST 异步流接受数据，需要用promise处理 POST时候的 postData

## 6. 路由和API

- API = URL（路由） + get/post + 参数/返回值

# 三、MySQL 基础

- https://dev.mysql.com/downloads/mysql/
- https://dev.mysql.com/downloads/workbench/
- `show databases;`

## 1. 建库

- 创建 myblog 数据库
```
CREATE SCHEMA `myblog` DEFAULT CHARACTER SET utf8 ;
```
- 执行 show databases; 查询

## 2. 建表

- 两张表 users表 和blogs表

```
id  username  password  realname state
id  title  content  createtime  author
```

- longtext可以存储4g大小  bigint(20) 存储13位时间

```
column  datatype  pk主键  nn不为空  AI自动增加  Default默认值
id  int Y Y Y --
username  varchar(20) -- Y -- --
password varchar(20) -- Y -- -- 
realname varchar(10) -- Y -- --
state INT -- Y -- 1
```

```
column  datatype  pk主键  nn不为空  AI自动增加  Default默认值
id  int Y Y Y --
title  varchar(50) -- Y -- --
content longtext -- Y -- -- 
createtime bigint(20) -- Y -- 0
author varchar(20) -- Y -- -- 
```

```sql
CREATE TABLE `myblog`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(20) NOT NULL,
  `password` VARCHAR(20) NOT NULL,
  `realname` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id`));

CREATE TABLE `myblog`.`blogs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(50) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `createtime` BIGINT(20) NOT NULL DEFAULT 0,
  `author` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `myblog`.`users` 
ADD COLUMN `state` INT NOT NULL DEFAULT 1 AFTER `realname`;

ALTER TABLE `myblog`.`users` 
DROP COLUMN `state`;
```

## 3. 操作表

```sql
use myblog;
-- show tables; 显示所有的表

-- 插入
-- mysql关键字需要``引起来，列名-值
insert into users(username, `password`, realname) values ('zhangsan', '123', '张三');
insert into users(username, `password`, realname) values ('lisi', '123', '李四');

-- 查询全表列 * 消耗性能
select * from users;
-- 查询局部
select id, username from users;

select * from users where username='zhangsan';
select * from users where username='zhangsan' and `password`='123';
select * from users where username='zhangsan' or `password`='123';
select * from users where username like '%zhang%';
select * from users where `password` like '%1%';

-- 排序 默认正序 desc倒序
select * from users where `password` like '%1%' order by id;
select * from users where `password` like '%1%' order by id desc;

-- 更新 和 删除
update users set realname='李四2' where username='lisi';
-- 取消safe update设置
SET SQL_SAFE_UPDATES = 0;

delete from users where username = 'lisi';

select * from users;
select * from users where state = '1';
-- state !== 0
select * from users where state <> '0';

update users set state = '0' where username = 'lisi';
update users set state = '1' where username = 'lisi';

insert into blogs (title, content, createtime, author) values ('标题A', '内容A', 1604477996182, 'zhangsan');
insert into blogs (title, content, createtime, author) values ('标题B', '内容B', 1604478256477, 'lisi');

select * from blogs;
select * from users;

select * from blogs order by createtime desc;

select * from blogs where author = 'lisi' order by createtime desc;

select * from blogs where title like '%A%' order by createtime desc;

select version();
```

- mysql >= 5版本时 varchar(10) 可以存储10个汉字
- `Date.now()` 转化时间戳


# 四、SQL实现

## 1. Node.js链接MySQL工具

- npm i mysql --save 安装MySQl
- src下创建文件夹conf下创建db.js，根据环境切换连接地址
- src/db/mysql.js => 执行sql函数模块实现
- mysql.js 中返回promise => router/blog.js & app.js 中接收promise改造

# 五、登录

- 核心：登录校验 & 登录信息存储
- cookie 和 session
- session 写入 redis

## 5.1 cookie

### 5.1.1 什么是cookie

- 存储在浏览器的一段字符串，最大5kb
- 跨域不共享
- 格式如 k1=v1;k2=v2;k3=v3; 因此可以存储结构化数据
- 每次发送http请求，会将请求域的cookie一起发送给server
- server端可以修改cookie并返回浏览器
- 浏览器中也可以通过js修改cookie，但是有限制

### 5.1.2 js操作cookie，浏览器查看cookie

- 客户端查看cookie，三种方式
  - 1. 浏览器network中，请求头和返回体中
  - 2. 浏览器application中，左侧
  - 3. console中输入document.cookie

- JS查看修改cookie（有限制）
  - 不能修改，只能直接累加 document.cookie = 'k2=200'

### 5.1.3 Node Server端操作cookie实现登录验证

- 查看cookie
  - cookie在req.headers中
- 修改cookie
  - res.setHeader('Set-Cookie', `username=${data.username}; path=/`)
  - path=/ 标识根目录，适用于整个url
- 实现登录验证
  - 登录存储cookie，后续接口验证cookie中的username

### 5.1.4 cookie的限制

- httpOnly 浏览器修改无效，设置username也会被之前的username覆盖
- expires 设置过期时间
```js
res.setHeader('Set-Cookie', `username=${data.username}; path=/; httpOnly; expires=${getCookieExpires()}`)
```

## 5.2 session

### 5.2.1 cookie的问题 -> session

- cookie存储username明文，暴露
- 如何解决：cookie中存储userid，server端对应username，session，server端存储用户信息
- session是登录存储会话信息的统称

### 5.2.2 本地存储session的问题

- 目前session直接是js变量，放在NodeJS进程内存中，进程重启丢失
  - 1. 进程内存有限，访问量过大，内存暴增怎么办，引用，堆内存
    - 操作系统会限制一个进程的最大可用内存
  - 2. 正式线上运行是多进程，进程之间内存无法共享
    - 每个Node都是分多个进程来跑的，多核处理器可以处理多个进程，每个进程都有session的话，进程内存不能共享

- 解决方案 redis（可集群扩展）
  - web serve常用的缓存数据库，数据存放在内存中
  - 相比于mysql速度访问快（内存存储 vs 硬盘存储）
  - redis内存存储成本高，数据量更小

- 浏览器 -> web server (多进程) -> 访问同一个 redis & mysql

- 为何session适合redis，而不是mysql
  - session访问频繁，每次都需要验证session，对性能要求高
  - session可以不考虑断电丢失的问题（redis不特殊配置会断电丢失）
  - session数据量不会太大（相比于mysql中存储的数据）

- 为何网站数据不适合redis
  - api操作频率与session比太低
  - 断电不能丢失，必须保留
  - 数据量大，内存成本太高

- 安装redis

```js
// 安装 brew install redis
// 启动 redis-server
// 打开操作界面 redis-cli （127.0.0.1:6379）
// 关闭 brew services stop redis
// 重启 brew services restart redis

// redis是key-value数据库
// 查看所有值
keys *
// 设置值
set myname ivan
// 取值
get myname
// 删除值
del myname
```

## 5.3 Redis

### 5.3.1 Node链接Redis

- redis-test文件中
- yarn init -y
- touch index.js
- yarn add redis --save
- node index.js 运行

### 5.3.2 blog-1 中封装redis

- yarn add redis --save

- src/conf/db.js中配置redis端口，db/redis.js中封装redis读取方法

- router/blog.js & user.js 中加登录验证，登录改回POST

# 六、联调

- 登录功能依赖cookie，必须用浏览器联调
- cookie跨域不共享，前端和server端必须同域
- 需要用到nginx做代码，让前后端同域

- cd html-test
- yarn add http-server -g
- http-server -p 8001   + 启动

- 8001和8000 cookie跨域不共享， 访问 http://127.0.0.1:8001/api/blog/list ->404

## 6.1 nginx

### 6.1.1 概念
- 高性能的web服务器，开源免费
- 一般用于静态服务，负载均衡
- 反向代理

- 浏览器访问localhost/index.html -> nginx做一个统一入口，根目录去访问html服务，/api/去访问node服务

### 6.1.2 安装使用
- brew install nginx
  - 配置文件 /usr/local/etc/nginx/nginx.conf
  ```js
  worker_processes  2; 开启两个进程
  server {
    listen 8080;
  }
  // 注释掉原有的location代理
  // 新增（注意key value不要有冒号）
  location / {   // 如果访问/根目录 走8001 html服务
    proxy_pass http://localhost:8001;
  }
  location /api/ {   // 如果访问/api/目录 走8000 node服务
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
  }
  ```

- 测试配置文件格式是否正确 nginx -t  查询 写入正确
- 启动 nginx
- 重启 nginx -s reload
- 停止 nginx -s stop


#### 流程

- 启动 页面http服务（http-server -p 8001） 和 node服务 （yarn dev） 以及 redis服务（redis-server）

- 启动nginx监听8080端口，从http://localhost:8080/index.html访问，页面走 localhost:8001，服务走 localhost:8000

- http://localhost:8000/api/blog/list 访问成功
- http://127.0.0.1:8001/index.html 页面成功 api不成功
- http://localhost:8080/index.html 都成功


# 七、日志

## 7.1 概念
- 日志分类
  - 1. 访问日志 access log（server端访问就有日志）
  - 2. 自定义日志（包括自定义事件，错误记录等）
- 日志要存在文件中，日志文件很大，写文件异步，不存在mysql（b树）和redis中

## 7.2 nodejs文件操作，nodejs stream
- 创建file-test文件夹
- 读文件 fs.readFile 写文件 fs.writeFile 判断文件是否存在 fs.exists

## 7.3 stream
- 流 就要监听结束状态end
- 但是写入读取可能会有大文件 => stream
- IO操作，包括网络IO和文件IO，相比于cpu计算和内存读写，IO的特点就是慢 => stream 流，提高cpu和内存的效率
```js
// 标准输入输出，pipe就是管道（符合水流管道的模型图）
// process.stdin 获取数据，直接通过管道传递给 process.stdout
process.stdin.pipe(process.stdout)
```
- req.on('data'/'end') 就是网络IO流的方式，每传一点触发data，传完，触发end

- 创建 stream-test 文件夹
  - createReadStream / createWriteStream


## 7.2 开发日志

- 根目录创建log文件 / access.log（访问日志） event.log（自定义日志）error.log(错误日志)
- src下创建日志 utils/log.js
- app.js 中通过access函数调用写日志


## 7.3 日志文件拆分

- 体积变大，一个文件不好处理
- 按照时间划分日志，如2020-01-01.access.log
- 实现方式：linux的crontab命令，即定时任务
  - 设置定时任务，格式 *****command   分、时、号、月、每周几 执行
  - 把access.log拷贝并重命名为2019-02-10.access.log并清空继续积累日志

- 实现：
- logs目录：/Users/myname/MyProject/Blog-Node/blog-1/logs
- utils文件夹下创建copy.sh文件
```sh
#!/bin/sh   => 执行sh
cd /Users/[myname]/MyProject/Blog-Node/blog-1/logs  => 切换到log路径
cp access.log $(date +%Y-%m-%d).access.log   => 重命名
echo "" > access.log  => 清空原文件
```
- sh copy.sh

- 每天0点执行一次
```sh
// 编辑
crontab -e 
进入文件 
编辑： * 0 * * * sh /Users/[myname]/MyProject/Blog-Node/blog-1/logs/copy.sh
// 查看当前所有任务
crontab -l
```

## 7.4 日志分析

- 如针对 access.log日志，分析 chrome占比
- 日志按行存储，一行就是一条日志
- 使用NodeJs的readline逐行读取（基于Stream，效率高）

- 用不同浏览器跑http://localhost:8000/api/blog/list
- utils下新建readline.js




