import Mock from 'mockjs';

// mock data
const usefulMockData = {
  pageInfo: { totalPage: 100, totalRecord: 12694 },
  okStat: { code: 200, msg: 'OK' },
  failStat: { code: 400, frimsg: 'Some Errors Occured.' },
};

const filters = {
  // 登录 @
  login: {
    name: 'login',
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {
            token: 'TEST_TOKEN',
            ident: input.username,
            name: input.username,
            expireTime: (Date.now() * 2),
          },
        });
      }, 1800);
    },
  },
  // 登出 @
  logout: {
    name: 'logout',
    handlerr: (resolve, reject) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {},
        });
      }, 1800);
    },
  },
  // 修改密码 @
  modifyPassword: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.prevPwd.length == 1 ? reject : resolve)({
          stat: { frimsg: '旧密码输入错误' },
          data: {},
        });
      }, 1000);
    },
  },
  // 添加任务 (这里的实现不优雅)
  addItem: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.gender ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 600);
    },
  },
  // 添加机构账号 @
  addOrganization: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.gender ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 1200);
    },
  },
  // 添加操作员 @
  addOperator: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.name.length % 2 ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 1200);
    },
  },
  // 操作员列表 @
  listOperators: {
    handlerr: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'operatorId|+1': 16,
            'num|+1': 16,
            'name': '@cname',
            'createdTime': '@date',
            'tel': '13853321909',
            'password': '@word',
            'taskStatistics': {
              'received|2-99': 0,
              'processing|2-99': 0,
              'confirming|2-99': 0,
              'finished|2-99': 0,
            },
            'frozen|1': [2, 1],
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    }
  },
  // 冻结解冻操作员 @
  freezeOperator: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.operator_id % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 2230);
    },
  },
  // 列出所有机构账户 @
  listOrganizations: {
    handlerr: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'orgId|+1': 16,
            'num|+1': 16,
            'name': '@cname',
            'createdTime': '@date',
            'tel': '13853321909',
            'password': '@word',
            'belong': '法医中心',
            'email': 'we@we.com',
            'taskNumber|25-299': 0,
            'frozen|1': [2, 1],
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    }
  },
  // 冻结解冻机构账户 @
  freezeOrganization: {
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.org_id % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 1230);
    },
  },
  // 任务列表 @
  listTasks: {
    handlerr: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'taskId|+1': input.pagination.pageNumber * 100,
            'num|+1': input.pagination.pageNumber * 100,
            'name': '@cname',
            'gender|1': [2, 1],
            'createdTime': '@date',
            'orgName': '@cname',
            'operatorName': '@cname',
            'orgBelong': '法医中心',
            'part': '腹部',
            'taskStage|1': input.filters.taskStage == 'progressing'
              ? ['processing', 'confirming']
              : input.filters.taskStage,
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    },
  },
  // 获取任务详情
  taskDetail: {
    handlerr: (resolve, reject, name, input) => {
      let mocked = {
        data: {
          taskDetail: Mock.mock({
            'taskId': input.taskId,
            'name': '@cname', 
            'gender|1-2': 2,
            'idcard': '@id',
            'part': '春树里',
            'method': '@word',
            'time': '@date',
            'description': '@cparagraph',
            'age|10-88': 0,
          }),
          operatorDetail: {
            'name': '操作员姓名',
            'tel': '125643234565',
          },
          orgDetail: {
            name: 'ORG',
            tel: 'ORG123456',
          },
          taskStage: 'processing',
          taskOperation: {
            confirmedBy: 'organization',
            allowOperatorConfirm: false,
            receivingTime: 1539959905632,
            downloadingAttachmentTime: 1539959905632,
            uploadingReportTime: 1539959905632,
            confirmingTime: 1539959905632,
            taskAttachmentUrl: 'https://baidu.com',
            taskReportUrl: 'https://weibo.com',
          },
          // task_attachment_is_downloaded: false,
          // task_attachment_url: 'https://baidu.com',
          // task_report_url: false, // 'https://weibo.com',
          // can_operator_confirm: false,
        },
        stat: usefulMockData.okStat,
      };
      setTimeout(() => resolve(mocked), 1000);
    },
  },
  // 领取任务 @
  receiveTask: {
    handlerr: (resolve, reject, name, input) => {
      if(input.taskId & 1) {
        setTimeout(() => resolve({
          stat: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          stat: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
  // 上传报告文件 @ $
  uploadTaskReport: {
    handlerr: (resolve, reject) => {
      setTimeout(() => resolve({
        stat: usefulMockData.okStat,
        data: {
          taskReportUrl: 'https://www.bing.com',
          canOperatorConfirm: true,
        },
      }), 1000);
    },
  },
  // 确认任务 @
  confirmTask: {
    handlerr: (resolve, reject, name, input) => {
      if(input.taskId & 1) {
        setTimeout(() => resolve({
          stat: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          stat: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
};


export default filters;


