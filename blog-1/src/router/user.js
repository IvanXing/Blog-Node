const { login } = require('../controller/user')
const { SuccessModel, ErrorModel } = require('../model/resModel')
const { set } = require('../db/redis');

const handleUserRouter = (req, res) => {
    const method = req.method;  // GET POST
  
    // 登陆接口
    if (method === 'POST' && res.path === '/api/user/login') {
      const { username, password } = req.body;
      const result = login(username, password);
      return result.then(data => {
        if (data.username) {
          
          // 设置session
          req.session.username = data.username
          req.session.realname = data.realname
          // 同步到redis
          set(req.sessionId, req.session)

          console.log('req.session is', req.session)

          return new SuccessModel()
        } 
        return new ErrorModel('登录失败')
      })
    }

    // // 登录验证测试
    // if (method === 'GET' && res.path === '/api/user/login-test') {
    //   // 登陆过才有cookie
    //   if (req.session.username) {
    //     return Promise.resolve(new SuccessModel({
    //       session: req.session
    //     }))
    //   } 
    //   return Promise.resolve(new ErrorModel('尚未登录'))
    // }
}

module.exports = handleUserRouter;