import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import Mock from 'mockjs';
import loginInfo from '@/utils/loginInfoStorage.js';
import _ from 'lodash';

// mock data
const usefulMockData = {
  pageInfo: { totalPage: 100, totalRecord: 12694 },
  okStat: { code: 200, msg: 'OK' },
  failStat: { code: 400, frimsg: 'Some Errors Occured.' },
};

const genderMap = {
  0: 'male',
  1: 'female',
  male: 0,
  female: 1,
};

const processTimeString = raw => String(raw).replace(/-/g, '/');

const covertQueryString = obj => 
  Object.keys(obj).map(k => k + '=' + obj[k]).join('&');

const processPagination = raw => ({
  pageNumber: raw.pageNumber,
  pageSize: raw.pageSize,
});

const processPageInfo = raw => ({
  totalPage: raw.total_page,
  totalRecord: raw.total_record,
});

const downloadUrlFilter = raw => {
  if(typeof raw !== String) return raw;
  if(/^((http|ftp|ftps|https):\/\/|\/\/|\/)/.test(raw)){
    return raw;
    // [TODO] 同源策略
    // try {
    //   let url = new URL(raw);
    //   if(url.domain === window.location.domain) {
    //     return raw;
    //   }
    // } catch() {
    //   return false;
    // }
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
      let [ fromKey, toKey ] = m[1] !== undefined
                               ? reverse ? [m[1], m[0]] : [m[0], m[1]]
                               : [m[0], m[0]];
      let rawValue = source[fromKey];
      if(rawValue !== undefined) {
        let fn = reverse ? m[3] : m[2];
        target[toKey] = (fn && fn.call)
                        ? fn(rawValue)
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
  ['num', 'bianhao'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['frozen', 'frozen', v => v-1, v => [2,1][v]],
]);

const organizationItemMapper = objectMapper([
  ['orgId', 'org_id'],
  ['address', 'address'],
  ['gender', 'gender', v => genderMap[v], v => genderMap[v]],
  ['idcard', 'idcard'],
  ['organization'],
  ['num', 'bianhao'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['belong', 'belong'],
  ['email', 'email'],
  ['taskNumber', 'taskNumber'],
  ['frozen', 'frozen', v => v-1, v => [2,1][v]],
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
  receiving: 'receiving',
  processing: 'processing',
  confirming: 'confirming',
  finished: 'finished',
  progressing: 'progressing', 
};

const taskItemMapper = objectMapper([
  ['taskId', 'task_id'],
  ['num', 'bianhao'],
  ['name', 'name'],
  ['gender', 'gender', v => genderMap[v], v => genderMap[v]],
  ['createdTime', 'created_time'],
  ['time', 'time', processTimeString, processTimeString],
  ['idcard', 'idcard'],
  ['method', 'method'],
  ['orgName', 'org_name'],
  ['operatorName', 'operator_name'],
  ['orgBelong', 'org_belong'],
  ['part', 'part'],
  ['age', 'age'],
  ['description', 'description'],
  ['taskStage', 'stage', v => taskStageMap[v], v => taskStageMap[v]],
]);

const identMap = {
  0: 'administrator',
  1: 'operator',
  2: 'organization', 
};


const statusMsgMap = {
  // 登录 @
  login: {
    201: '没有密码或者用户名',
    202: '账号不存在',
    203: '密码错误',
    204: '账号被冻结',
  },
  // 登出
  logout: {
  },
  // 修改密码
  modifyPassword: {
    201: '没有找到该用户',
    202: '没有传入原始密码或者新密码的值',
    203: '原始密码错误',
  },
  // 添加任务
  addItem: {
    202: '没有权限，必须是机构账户才行',
    203: '参数错误，检查一下传入的参数字段',
  },
  // 添加机构账号
  addOrganization: {
    202: '没有权限',
    203: '参数错误',
    204: '账户已存在，电话应该唯一',
  },
  // 添加操作员
  addOperator: {
    202: '没有权限',
    203: '参数错误',
    204: '账户已存在，电话应该唯一',
  },
  // 操作员列表
  listOperators: {
    202: '没有权限', // 必须是超管账号才行
    203: '参数错误', // pageSize和pageNumber是否传入以及是否大于零
  },
  // 冻结解冻操作员
  freezeOperator: {
    202: '没有权限',
    203: '参数错误', // 检查传入字段是否正确
    204: '找不到对应的账号',
  },
  // 列出所有机构账户
  listOrganizations: {
    202: '没有权限',
    203: '参数错误', // pageSize和pageNumber是否传入以及是否大于零
  },
  // 冻结解冻机构账户
  freezeOrganization: {
    202: '没有权限',
    203: '参数错误', // 检查传入字段是否正确
    204: '找不到对应的账号',
  },
  // 任务列表
  listTasks: {
    203: '参数错误',
  },
  // 获取任务详情
  taskDetail: {
    202: '该任务不存在',
  },
  // 领取任务
  receiveTask: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  // 上传报告文件
  uploadTaskReport: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  // 确认任务 @
  confirmTask: {
    202: '没有权限',
    203: '该任务不存在',
    204: '没有此操作',
  },
  common: {
    301: '尚未登录，请重新登录后重试',
    302: '登录过期，请重新登录后重试',
    303: '请尝试重新登录',
    200: '成功',
  },
};


const API_SERVER_URL = '/api';

const filters = {
  // 登录 @
  login: {
    name: 'login',
    method: 'POST',
    url: API_SERVER_URL + '/login',
    chop: inp => ({
      username: inp.username,
      password: inp.password,
    }),
    trim: rep => ({
      token: rep.data && rep.data.token,
      ident: rep.data
             ? identMap[rep.data.ident]
             : 'unknown',
      // name: rep.data.name,
      expireTime: +rep.data.expire_time || 0, // Timestamp
    }),
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {
            token: 'TEST_TOKEN',
            ident: input.username,
            name: input.username,
            expireTime: ~~(Date.now() * 1.2),
          },
        });
      }, 1800);
    },
  },
  // 登出 @
  logout: {
    name: 'logout',
    method: 'POST',
    url: API_SERVER_URL + '/logout',
    handlerr: (resolve, reject, name, input) => {
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
    name: 'modifyPassword',
    method: 'POST',
    url: API_SERVER_URL + '/modifyPassword',
    chop: inp => ({
      prevPwd: inp.prevPwd,
      newPwd: inp.newPwd,
    }),
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
    name: 'addItem',
    method: 'POST',
    url: API_SERVER_URL + '/tasks/add',
    chop: inp => {
      let fd = new FormData();
      fd.append('attachments', inp.attachments[0]);
      let pro = taskItemMapper(inp);
      Object.keys(pro).forEach(k => fd.append(k, pro[k]));
      return fd;
    },
    trim: rep => taskItemMapper(rep.data, true),
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
    name: 'addOrganization',
    method: 'POST',
    url: API_SERVER_URL + '/organization/add',
    chop: inp => organizationItemMapper(inp, false),
    trim: rep => organizationItemMapper(rep.data, true),
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
    name: 'addOperator',
    method: 'POST',
    url: API_SERVER_URL + '/operator/add',
    chop: inp => operatorItemMapper(inp, false),
    trim: rep => operatorItemMapper(rep.data, true),
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
    name: 'listOperators',
    method: 'POST',
    url: API_SERVER_URL + '/operator/list',
    chop: inp => ({
      pagination: processPagination(inp.pagination),
    }),
    trim: rep => ({
      pageInfo: rep.pageInfo,
      list: Array.isArray(rep.data)
        && rep.data.map(item => ({
          ...operatorItemMapper(item, true),
          taskStatistics: {...item.task_statistics},
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
    name: 'freezeOperator',
    method: 'POST',
    url: API_SERVER_URL + '/operator/freeze',
    chop: inp => ({
      operator_id: inp.operatorId,
      action: inp.action,
    }),
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
    name: 'listOrganizations',
    method: 'POST',
    url: () => API_SERVER_URL + '/organization/list',
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
    name: 'freezeOrganization',
    method: 'POST',
    url: API_SERVER_URL + '/organization/freeze',
    chop: inp => ({
      org_id: inp.orgId,
      action: inp.action,
    }),
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
    name: 'listTasks',
    method: 'POST',
    url: API_SERVER_URL + '/tasks/list',
    chop: inp => ({
      pagination: processPagination(inp.pagination),
      query_stage: taskStageMap[inp.filters.taskStage], // [TODO]
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
  // 获取任务详情
  taskDetail: {
    name: 'taskDetail',
    method: 'POST',
    url: inp => API_SERVER_URL + `/tasks/detail/${inp.taskId}`,
    trim: rep => {
      return {
        taskDetail: taskItemMapper(rep.data.task_detail, true),
        operatorDetail: operatorItemMapper(rep.data.operator_detail, true),
        orgDetail: organizationItemMapper(rep.data.organization_detail, true),
        taskStage: taskStageMap[rep.data.stage],
        task_attachment_is_downloaded: !!rep.data.task_attachment_is_downloaded,
        task_attachment_url: downloadUrlFilter(rep.data.task_attachment_url),
        task_report_url: downloadUrlFilter(rep.data.task_report_url),
        can_operator_confirm: !!rep.data.can_operator_confirm,
        task_confirm_by: 'organization',
      };
    },
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
    name: 'receiveTask',
    method: 'GET',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=receive`,
    trim: rep => rep.data || {},
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
    name: 'uploadTaskReport',
    method: 'POST',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=process`,
    chop: inp => {
      let fd = new FormData();
      fd.append('report_file', inp.file);
      fd.append('task_id', inp.taskId);
      return fd;
    },
    trim: rep => ({
      task_report_url: downloadUrlFilter(rep.data && rep.data.task_report_url) || true,
    }),
    handlerr: (resolve, reject, name, input) => {
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
    name: 'confirmTask',
    method: 'GET',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=confirm`,
    trim: rep => rep.data,
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


export default new CattleBridge({
  debug: (process.env.NODE_ENV === 'development'),
  filters,
  gtrim(rep) {
    if(!(rep && rep.status)) {
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
    let info = loginInfo.retrieve();
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
  stater(result, respData, respStat, filter) {
    if (respStat.status >= 300) {
      result(false);
      return {
        code: -1,
        msg: 'HTTP Error',
        frimsg: '网络或服务器错误',
      };
    } else if (!(respData && respData.status)) {
      result(false);
      return {
        code: -2,
        msg: 'invalid data',
        frimsg: '返回的数据是无效的',
      };
    } else {
      result(respData.status.code == 200);
      if([301, 302, 303].indexOf(respData.status.code) !== -1) {
        loginInfo.exit();
      }
      return {
        code: respData.status.code || 300,
        msg: respData.status.msg || 'Unknown Error',
        frimsg: _.get(statusMsgMap, `${filter.name}.${respData.status.code}`)
                || _.get(statusMsgMap, `common.${respData.status.code}`)
                || respData.status.msg
                || '未知错误',
      };
    }
  },
});


