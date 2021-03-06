const { 
  getList, 
  getDetail, 
  newBlog,
  updateBlog,
  deleteBlog
} = require('../controller/blog');
const { SuccessModel, ErrorModel } = require('../model/resModel');


const handleBlogRouter = (req, res) => {
  const method = req.method;  // GET POST
  const id = req.query.id;  // 获取博客id

  // 获取博客列表
  if (method === 'GET' && res.path === '/api/blog/list') {
    // get请求传入参数处理
    const author = req.query.author || '';
    const keyword = req.query.keyword || '';
    // 调用controller中逻辑接收返回值
    const listData = getList(author, keyword);
    // 返回包装格式
    return new SuccessModel(listData)
  }

  // 获取博客详情
  if (method === 'GET' && res.path === '/api/blog/detail') {
    const data = getDetail(id);
    return new SuccessModel(data);
  }

  // 新建一篇博客
  if (method === 'POST' && res.path === '/api/blog/new') {
    const data = newBlog(req.body);
    return new SuccessModel(data)
  }

  // 更新一篇博客
  if (method === 'POST' && res.path === '/api/blog/update') {
    const result = updateBlog(id, req.body);
    if (result) {
      return new SuccessModel();
    } else {
      return ErrorModel('更新博客失败');
    }
  }

  // 删除一篇博客
  if (method === 'POST' && res.path === '/api/blog/delete') {
    const result = deleteBlog(id);
    if (result) {
      return new SuccessModel();
    } else {
      return ErrorModel('删除博客失败');
    }
  }  

}

module.exports = handleBlogRouter;