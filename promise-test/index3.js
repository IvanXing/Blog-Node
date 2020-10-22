const fs = require('fs')
const path = require('path')

// 用 promise 获取文件内容
function getFileContent(fileName) {
  const promise = new Promise((resolve, reject) => {
      const fullFileName = path.resolve(__dirname, 'files', fileName)
      fs.readFile(fullFileName, (err, data) => {
          if (err) {
              reject(err)
              return
          }
          resolve(
              JSON.parse(data.toString())
          )
      })
  })
  return promise
}

getFileContent('a.json').then(aData => {
    console.log('a data', aData)
    return getFileContent(aData.next)
}).then(bData => {
    console.log('b data', bData)
    return getFileContent(bData.next)
}).then(cData => {
    console.log('c data', cData)
})

// 输出
// a data { next: 'b.json', msg: 'this is a' }
// b data { next: 'c.json', msg: 'this is b' }
// c data { next: null, msg: 'this is c' }