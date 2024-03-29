const mysql = require('mysql')
const { MYSQL_CONF } = require('../conf/db')

// 创建链接对象
const con = mysql.createConnection(MYSQL_CONF)

// 开始链接
con.connect()

// 统一执行 sql 的函数
function exec(sql) {
  // result 异步获取，用promise封装
  const promise = new Promise((resolve, reject) => {
    con.query(sql, (err, result) => {
      if (err) {
          reject(err)
          return
      }
      resolve(result)
    })
  })
  return promise
}

module.exports = {
  exec
}