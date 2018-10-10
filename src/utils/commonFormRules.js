export default {
  idcard: {
    type: 'string',
    pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
    message: '不合规范的输入',
  },
  tel: {
    type: 'string',
    pattern: /[\d\-+#*P]{4,20}/,
    message: '请输入合法的电话号码',
  },
  personName: {
    type: 'string',
    // min: 2, max: 30,
    pattern: /[^<>#:;]{2,30}/,
    message: '请输入合法的姓名',
  },
  uploadFile: { // 还没想好怎么写
    validator: (rule, value, callback) => {
      let errors = [];
      if(value.some(f => f.size > 16 * 1024 * 1024)) {
        errors.push(new Error('文件体积要小于16MB'));
      }
      callback(errors);
    },
  },
};