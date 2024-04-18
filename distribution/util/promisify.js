// 对于all service，必须要用这个custom promisify函数，而不能用
// 因为util.promisify()的判断是if(err), 会把{}也当作error处理！
function promisify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, data) => {
        if (err && err instanceof Error) {
          reject(err);
        } else if(err && Object.keys(err).length > 0) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    });
  };
}

module.exports = promisify;