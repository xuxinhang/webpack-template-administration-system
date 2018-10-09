import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import Mock from 'mockjs';

// mock data
const usefulMockData = {
  pageInfo: { totalPage: 100, totalRecord: 12694 },
  okStat: { code: 200, msg: 'OK' },
  failStat: { code: 400, frimsg: 'Some Errors Occured.' },
};

const taskStageList = ['receiving', 'processing', 'confirming', 'finished'];

const filters = {
  login: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {token: 'TEST_TOKEN', username: input.username, ident: input.username},
        });
      }, 1800);
    },
  },
  // 登出
  logout: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {},
        });
      }, 1800);
    },
  },
  // 修改密码
  modifyPassword: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.prevPwd.length == 1 ? reject : resolve)({
          stat: { frimsg: '旧密码输入错误' },
          data: {},
        });
      }, 1000);
    },
  },
  // 添加项目数据
  addItem: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.gender ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 600);
    },
  },
  // 添加机构账号
  addOrganization: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.gender ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 1200);
    },
  },
  // 添加操作员
  addOperator: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.name.length % 2 ? resolve : reject)({
          stat: { code: 23, frimsg: '这里是友好的错误信息' },
          data: null,
        });
      }, 1200);
    },
  },
  // 操作员列表
  listOperators: {
    method: 'POST',
    url: '',
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'operator_id|+1': 16,
            'num|+1': 16,
            'name': '@cname',
            'created_time': '@date',
            'tel': '13853321909',
            'password': '@word',
            'task_statistics': {
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
  // 冻结解冻操作员
  freezeOperator: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.operator_id % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 2230);
    },
  },
  listOrganizations: {
    method: 'POST',
    url: '',
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'org_id|+1': 16,
            'num|+1': 16,
            'name': '@cname',
            'created_time': '@date',
            'tel': '13853321909',
            'password': '@word',
            'belong': '法医中心',
            'email': 'we@we.com',
            'task_number|25-299': 0,
            'frozen|1': [2, 1],
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    }
  },
  // 冻结解冻机构账户
  freezeOrganization: {
    method: 'POST',
    url: '/',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        if(input.org_id % 2) {
          resolve({stat: usefulMockData.okStat});
        } else {
          reject({stat: usefulMockData.failStat});
        }
      }, 1230);
    },
  },
  listTasks: {
    method: 'GET',
    url: '',
    handler: (resolve, reject, name, input) => {
      let mocked = Mock.mock({
        data: {
          pageInfo: usefulMockData.pageInfo,
          [`list|${input.pagination.pageSize}`]: [{
            'task_id|+1': input.pagination.pageNumber * 100,
            'num|+1': input.pagination.pageNumber * 100,
            'name': '@cname',
            'gender|1': [2, 1],
            'created_time': '@date',
            'org_name': '@cname',
            'operator_name': '@cname',
            'org_belong': '法医中心',
            'part': '腹部',
            'task_stage|1': input.filters.task_stage == 'progressing'
              ? ['processing', 'confirming']
              : input.filters.task_stage,
          }],
        },
        stat: usefulMockData.okStat,
      });
      setTimeout(() => resolve(mocked), 1230);
    }
  },
  taskDetail: {
    method: 'GET',
    url: '',
    handler: (resolve, reject, name, input) => {
      let mocked = {
        data: {
          task_detail: Mock.mock({
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
          operator_detail: {
            'name': '操作员姓名',
            'tel': '125643234565',
          },
          org_detail: {
            name: 'ORG',
            tel: 'ORG123456',
          },
          task_stage: 'processing',
          task_attachment_is_downloaded: false,
          task_attachment_url: 'https://baidu.com',
          task_report_url: 'https://weibo.com',
          can_operator_confirm: false,
        },
        stat: usefulMockData.okStat,
      };
      setTimeout(() => resolve(mocked), 1000);
    },
  },
  // 领取任务
  receiveTask: {
    method: 'GET',
    url: '',
    handler: (resolve, reject, name, input) => {
      if(input.taskId & 1) {
        setTimeout(() => resolve({
          status: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          status: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
  // 上传报告文件
  uploadTaskReport: {
    method: 'POST',
    url: '',
    handler: (resolve, reject, name, input) => {
      setTimeout(() => resolve({
        status: usefulMockData.okStat,
        data: {
          taskReportUrl: 'https://www.bing.com',
          canOperatorConfirm: true,
        },
      }), 1000);
    },
  },
  // 确认任务
  confirmTask: {
    method: 'GET',
    url: '',
    handler: (resolve, reject, name, input) => {
      if(input.taskId & 1) {
        setTimeout(() => resolve({
          status: usefulMockData.okStat,
        }), 300);
      } else {
        setTimeout(() => reject({
          status: usefulMockData.failStat,
        }), 1000);
      }
    },
  },
};

const stater = function (result, respData, respStat, currentFilter) {
  if (respStat.status !== 200) {
    result(false);
    return {
      code: -1,
      msg: 'HTTP Error',
      friMsg: 'Cannot connect to the servers.',
    };
  } else {
    result(respData.status == 0);
    return {
      code: respData.status,
      msg: respData.error_msg,
      friMsg: respData.error_msg, // mapToFriendlyMessage(respData.status),
    };
  }
};

export default new CattleBridge({
  debug: true,
  filters,
  requester: axios,
  stater,
});


