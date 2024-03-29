const querystring = require('querystring');
const { get, set } = require('./src/db/redis');
const { access } = require('./src/utils/log');
const handleBlogRouter = require('./src/router/blog');
const handleUserRouter = require('./src/router/user');

// 获取cookie的过期时间
const getCookieExpires = () => {
  const d = new Date()
  d.setTime(d.getTime() + (24 * 60 * 60 * 1000))       // 当前时间加一天单位ms，转换GMT格式
  // console.log('d.toGMTString() is', d.toGMTString())
  return d.toGMTString()
}

/*
**  session数据
*/
// const SESSION_DATA = {}

/*
** 用于处理 post data
*/
const getPostData = (req) => {
  const promise = new Promise((resolve, reject) => {
      if (req.method !== 'POST') {
          resolve({})
          return
      }
      if (req.headers['content-type'] !== 'application/json') {
          resolve({})
          return
      }
      let postData = ''
      req.on('data', chunk => {
          postData += chunk.toString()
      })
      req.on('end', () => {
          if (!postData) {
              resolve({})
              return
          }
          resolve(
              JSON.parse(postData)
          )
      })
  })
  return promise
}


const serverHandle = (req, res) => {

  // 记录 access log
  access(`${req.method} -- ${req.url} -- ${req.headers['user-agent']} -- ${Date.now()}`)

  // 设置返回格式为json
  res.setHeader('Content-type', 'application/json');

  // 处理 url
  const url = req.url;
  res.path = url.split('?')[0];  // path是前半部分

  // 解析 query
  req.query = querystring.parse(url.split('?')[1]);  // 参数是后半部分

  // 解析 cookie
  req.cookie = {};
  const cookieStr = req.headers.cookie || '';  //k1=v1;k2=v2;k3=v3...
  cookieStr.split(';').forEach(item => {
    if (!item) {
      return
    }
    const arr = item.split('=')
    const key = arr[0].trim()   // 去掉空格，同名值后面替换前面
    const val = arr[1].trim()
    req.cookie[key] = val
  });

  // // 解析session
  // let needSetCookie = false;
  // let userId = req.cookie.userid;
  // if (userId) {
  //   if (!SESSION_DATA[userId]) {
  //     SESSION_DATA[userId] = {};
  //   }
  // } else {
  //   needSetCookie = true;
  //   userId = `${Date.now()}_${Math.random()}`;
  //   SESSION_DATA[userId] = {};
  // }
  // req.session = SESSION_DATA[userId];

  /*
  ** 解析 session （使用redis）
  */
  let needSetCookie = false;
  let userId = req.cookie.userid
  if (!userId) {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`;
    // 初始化redis中的session值
    set(userId, {})
  }
  // 获取session
  req.sessionId = userId
  get(req.sessionId).then(sessionData => {
    if (sessionData == null) {
      // 初始化redis中的session
      set(req.sessionId, {})
      // 设置session
      req.session = {}
    } else {
      req.session = sessionData
    }
    console.log('req.session is=>', req.session)
    
    // 处理postData
    return getPostData(req)
  })
  .then(postData => {

  // 处理 post data
  // getPostData(req).then(postData => {

    //  放到 新定义的 req.body 中
    req.body = postData;

    /*
    ** 处理 blog 路由
    */
    const blogResult = handleBlogRouter(req, res);
    if (blogResult) {
      blogResult.then(blogData => {
        if (needSetCookie) {
          res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)
        }
        res.end(
          JSON.stringify(blogData)
        )
      })
      return
    }

    /*
    ** 处理 user 路由
    */
    const userData = handleUserRouter(req, res);
    if (userData) {
      userData.then(userData => {
        if (needSetCookie) {
          res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)
        }
        res.end(
          JSON.stringify(userData)
        )
      })
      return
    }

    // 未命中路由，返回 404
    res.writeHead(404, {"Content-type": "text/plain"});
    res.write("404 Not Found");
    res.end();

  })

  

};

module.exports = serverHandle;