const handleUserRouter = (req, res) => {
  const method = req.method;  // GET POST

  // 登陆接口
  if (method === 'POST' && res.path === '/api/user/login') {
    return {
      msg: '这是登陆的接口'
    }
  }
}

module.exports = handleUserRouter;