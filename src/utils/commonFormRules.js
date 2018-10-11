let allowedExts = [
  'zip', 'rar', '7z',
  'doc', 'docx', 'xls', 'xlsx', 'pdf',
  'jpg', 'jpeg', 'png', 'tiff', 'gif',
];

export default {
  idcard: {
    type: 'string',
    pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
    message: '不合规范的输入',
  },
  tel: {
    type: 'string',
    pattern: /[\d\-+#*P]{6,20}/,
    message: '请输入合法的电话号码',
  },
  personName: {
    type: 'string',
    // min: 2, max: 30,
    pattern: /[^<>#:;]{2,30}/,
    message: '请输入合法的姓名',
  },
  uploadFile: { // 还没想好怎么写
    validator(rule, value, callback) {
      callback(this.syncValidator(rule, value));
    },
    syncValidator(rule, value) {
      let errors = [];
      if(value.some(f => f.size > 16 * 1024 * 1024)) {
        errors.push(new Error('文件体积要小于16MB'));
      }
      if(value.some(f => {
        let dotIndex = f.name.lastIndexOf('.');
        return dotIndex === -1
          || allowedExts.indexOf(f.name.substr(dotIndex + 1)) === -1;
      })) {
        errors.push(new Error('文件类型只允许 ' + allowedExts.join(', ')));
      }
      return errors;
    },
  },
};