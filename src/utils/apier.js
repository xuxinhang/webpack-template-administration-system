import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import Mock from 'mockjs';
import { retrieveLoginInfo } from '@/utils/loginInfoStorage.js';

// mock data
const usefulMockData = {
  pageInfo: { totalPage: 100, totalRecord: 12694 },
  okStat: { code: 200, msg: 'OK' },
  failStat: { code: 400, frimsg: 'Some Errors Occured.' },
};

const processPagination = raw => ({
  page_number: raw.pageNumber,
  page_size: raw.pageSize,
});

const processPageInfo = raw => ({
  totalPage: raw.total_page,
  totalRecord: raw.total_record,
});

const downloadUrlFilter = raw => {
  if(typeof raw !== String) return raw;
  if(/^((http|ftp|ftps|https):\/\/|\/\/|\/)/.test(raw)){
    return raw;
  }
  return false;
};


const objectMapper = (keyMap) => {
  if(!Array.isArray(keyMap)) {
    throw new Error('keyMap is expected to be an array');
  }
  return (source, reverse = false) => {
    let target = {};
    if(!source || typeof source !== 'object') {
      return {};
    }
    keyMap.forEach(m => {
      let [ fromKey, toKey ] = reverse ? [m[1],m[0]] : [m[0],m[1]];
      let rawValue = source[fromKey];
      if(rawValue !== undefined) {
        target[toKey] = m[2] && m[2].call
        ? (m[2])(rawValue)
        : rawValue;
      } else if(m[3] !== undefined) {
        target[toKey] = m[3];
      }
    });
    return target;
  };
};

const operatorItemMapper = objectMapper([
  ['operatorId', 'operator_id'],
  ['num', 'num'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  // ['taskStatistics', 'task_statistics'],
  ['frozen', 'frozen'],
]);

const organizationItemMapper = objectMapper([
  ['orgId', 'org_id'],
  ['num', 'num'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['belong', 'belong'],
  ['email', 'email'],
  ['taskNumber', 'task_number'],
  ['frozen', 'frozen'],
]);

const taskStageMapper = objectMapper([
  ['receiving', 0],
  ['processing', 1],
  ['confirming', 2],
  ['finished', 3],
]);

const taskStageMap = {
  0: 'receiving',
  1: 'processing',
  2: 'confirming',
  3: 'finished',
  receiving: 0,
  processing: 1,
  confirming: 2,
  finished: 3,
  progressing: -1, 
};

const taskItemMapper = objectMapper([
  ['taskId', 'task_id'],
  ['num', 'num'],
  ['name', 'name'],
  ['gender', 'gender'],
  ['createdTime', 'created_time'],
  ['time', 'time'],
  ['idcard', 'idcard'],
  ['method', 'method'],
  ['orgName', 'org_name'],
  ['operatorName', 'operator_name'],
  ['orgBelong', 'org_belong'],
  ['part', 'part'],
  ['age', 'age'],
  ['description', 'description'],
  [
    'taskStage',
    'task_stage',
    v => taskStageMap[v],
  ],
]);

const identMap = {
  0: 'administrator',
  1: 'operator',
  2: 'organization', 
};

// const API_SERVER_URL = '//';

const filters = {
  // 登录 @
  login: {
    method: 'POST',
    url: '/login',
    chop: inp => ({
      username: inp.username,
      password: inp.password,
    }),
    trim: rep => ({
      token: rep.data && rep.data.token,
      ident: rep.data
             ? identMap[rep.data.ident]
             : 'unknown',
      expireTime: +rep.data.expire_time || 0, // Timestamp
    }),
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {
            token: 'TEST_TOKEN',
            // username: input.username,
            ident: input.username,
            expireTime: 0,
          },
        });
      }, 1800);
    },
  },
  // 登出 @
  logout: {
    method: 'GET',
    url: '/logout',
    handler: (resolve, reject, name, input) => {
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
    method: 'POST',
    url: '/modify_password',
    chop: inp => ({
      prev_pwd: inp.prevPwd,
      new_pwd: inp.newPwd,
    }),
    handler: (resolve, reject, name, input) => {
      setTimeout(() => {
        (input.prevPwd.length == 1 ? reject : resolve)({
          stat: { frimsg: '旧密码输入错误' },
          data: {},
        });
      }, 1000);
    },
  },
  // 添加项目数据 (这里的实现不优雅)
  addItem: {
    method: 'POST',
    url: '/add_task',
    chop: inp => Object.keys(inp).reduce((prev, curt) => {
      if(curt == 'attachments') {
        prev.append(curt, inp[curt][0], inp[curt][0].name);
      } else { // 以后可能需要做一次映射
        prev.append(curt, inp[curt]);
      }
      return prev;
    }, new FormData()),
    trim: rep => {
      return {
        taskId: rep && rep.data
                ? rep.data.task_id
                : -1
      };
    },
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
    method: 'POST',
    url: '/add_organization',
    chop: inp => organizationItemMapper(inp, false),
    trim: rep => organizationItemMapper(rep.data, true),
    handler: (resolve, reject, name, input) => {
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
    method: 'POST',
    url: '/add_operator',
    chop: inp => operatorItemMapper(inp, false),
    trim: rep => operatorItemMapper(rep.data, true),
    handler: (resolve, reject, name, input) => {
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
    method: 'GET',
    url: '/operator/list',
    chop: inp => ({
      pagination: processPagination(inp.pagination),
    }),
    trim: rep => ({
      pageInfo: rep.pageInfo,
      list: Array.isArray(rep.data)
        && rep.data.map(item => ({
          ...operatorItemMapper(item, true),
          taskStatistics: taskStageMapper(item.task_statistics, true),
        })),
    }),
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
    method: 'GET',
    url: inp => `/operator/freeze?operator_id=${inp.operatorId}&action=${inp.action}`,
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
    method: 'GET',
    url: '/organization/list',
    chop: inp => ({
      pagination: processPagination(inp.pagination),
    }),
    trim: rep => ({
      pageInfo: rep.pageInfo,
      list: Array.isArray(rep.data)
            && rep.data.map(item => organizationItemMapper(item, true)),
    }),
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
    method: 'GET',
    url: inp => `/organization/freeze?org_id=${inp.orgId}&action=${inp.action}`,
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
    method: 'POST',
    url: '/tasks/list',
    chop: inp => ({
      pagination: processPagination(inp.pagination),
      task_stage: taskStageMap[inp.filters.taskStage],
    }),
    trim: rep => ({
      pageInfo: rep.pageInfo,
      list: Array.isArray(rep.data)
            && rep.data.map(item => taskItemMapper(item, true)),
    }),
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
  // 获取任务详情 X
  taskDetail: {
    method: 'GET',
    url: inp => `/tasks/detail/${inp.taskId}`,
    trim: rep => {
      if(!rep.data) return {};
      return {
        taskDetail: taskItemMapper(rep.data.task_detail, true),
        operatorDetail: operatorItemMapper(rep.data.operator_detail, true),
        orgDetail: organizationItemMapper(rep.data.organization_detail, true),
        taskStage: taskStageMap[rep.data.task_stage],
        task_attachment_is_downloaded: !!rep.data.task_attachment_is_downloaded,
        task_attachment_url: downloadUrlFilter(rep.data.task_attachment_url),
        task_report_url: downloadUrlFilter(rep.data.task_report_url),
        can_operator_confirm: !!rep.data.can_operator_confirm,
      };
    },
    handler: (resolve, reject, name, input) => {
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
          task_attachment_is_downloaded: false,
          task_attachment_url: 'https://baidu.com',
          task_report_url: false, // 'https://weibo.com',
          can_operator_confirm: false,
        },
        stat: usefulMockData.okStat,
      };
      setTimeout(() => resolve(mocked), 1000);
    },
  },
  // 领取任务 @
  receiveTask: {
    method: 'GET',
    url: inp => `/tasks/operate/${inp.taskId}?action=receive`,
    trim: rep => rep.data || {},
    handlerr: (resolve, reject, name, input) => {
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
  // 上传报告文件 @
  uploadTaskReport: {
    method: 'POST',
    url: inp => `/tasks/operate/${inp.taskId}?action=process`,
    chop: inp => inp.formdata,
    trim: rep => ({
      task_report_url: downloadUrlFilter(rep.data && rep.data.task_report_url),
    }),
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => resolve({
        status: usefulMockData.okStat,
        data: {
          taskReportUrl: 'https://www.bing.com',
          canOperatorConfirm: true,
        },
      }), 1000);
    },
  },
  // 确认任务 @
  confirmTask: {
    method: 'GET',
    url: inp =>`/tasks/operate/${inp.taskId}?action=confirm`,
    trim: rep => rep.data,
    handlerr: (resolve, reject, name, input) => {
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


export default new CattleBridge({
  debug: (process.env.NODE_ENV == 'development'),
  filters,
  gtrim(rep) {
    if(typeof rep !== Object) {
      return {
        status: {},
        data: {},
      };
    }

    if(rep.pageInfo) {
      rep.pageInfo = processPageInfo(rep.pageInfo);
    }
    if(!rep.data) {
      rep.data = {};
    }

    return rep;
  },
  requester(options) {
    let info = retrieveLoginInfo();

    let customizedHeaders = {
      'Auth-Token': info.token
    };
    options.headers
    && Object.assign(customizedHeaders, options.headers);

    return axios({
      ...options,
      headers: customizedHeaders,
    });
  },
  stater(result, respData, respStat) {
    
    if (respStat.status >= 300) {
      result(false);
      return {
        code: -1,
        msg: 'HTTP Error',
        frimsg: '网络或服务器错误',
      };
    } else if (typeof respData !== Object
      || (!respData.status)) {
      result(false);
      return {
        code: -2,
        msg: 'invalid data',
        frimsg: '返回的数据是无效的',
      };
    } else {
      result(respData.status.code >= 200 && respData.status.code <= 299);
      return {
        code: respData.status.code || 300,
        msg: respData.status.msg || 'Unknown Error',
        frimsg: respData.status.msg || '未知错误',
        // mapToFriendlyMessage(respData.status),
      };
    }
  },
});


