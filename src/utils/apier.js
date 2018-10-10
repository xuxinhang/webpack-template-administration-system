import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import Mock from 'mockjs';
import loginInfo from '@/utils/loginInfoStorage.js';

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
        target[toKey] = (m[2] && m[2].call)
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
  ['num', 'bianhao'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  // ['taskStatistics', 'task_statistics'],
  ['frozen', 'frozen'],
]);

const organizationItemMapper = objectMapper([
  ['orgId', 'org_id'],
  ['address'],
  ['gender', 'gender', v => genderMap[v]],
  ['idcard'],
  // ['organization'],
  ['num', 'bianhao'],
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
  ['gender', 'gender', v => {
    console.log(genderMap[v], v);
    return genderMap[v];
  }],
  ['createdTime', 'created_time'],
  ['time', 'time', processTimeString],
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
    'stage',
    v => taskStageMap[v],
  ],
]);

const identMap = {
  0: 'administrator',
  1: 'operator',
  2: 'organization', 
};


/*
  1）用户登录：
  200：登录成功并返回响应的data

  201 ：没有密码或者用户名

  202 ： 账号不存在

  203：密码错误

  204: 账号被冻结！
  备注：登录成功返回的ident字段：0代表超管、1代表操作员、2代表客户机构操作员

  2) 修改密码（/modifyPassword）
  200:修改成功

  201：没有找到该用户

  202：没有传入原始密码或者新密码的值

  203：原始密码错误
  3）添加操作员账号（/operator/add）
  200:添加成功

  201：该token用户不存在

  202:没有权限，必须是超管账号才行

  203：没有传入name 或者 tel的值

  204:  账户已存在！（tel的值在数据库中唯一）
  备注：tel字段必须在前端验证一下是手机号（11位），后端没有进行验证。

  4）获取操作员列表（/operator/list）
  200:获取成功返回数据

  201：该token用户不存在

  202:没有权限，必须是超管账号才行

  203：参数错误，pageSize和pageNumber是否传入以及是否大于零
  备注：返回data数据中的frozen字段 1代表正常，0代表冻结！

  5）冻结账号：
  200:操作成功

  201：该token用户不存在

  202:没有权限，必须是超管账号才行

  203：参数错误，检查传入字段是否正确

  204：找不到对应的账号！
  6）所有对机构账号的操作
  （增加、冻结解冻、获取列表），返回值参考上面3）4）5）对”操作员“的操作

  7）添加任务
  200:添加成功

  201：该token用户不存在

  202:没有权限，必须是机构账户才行

  203：参数错误，检查一下传入的参数字段，包括是否有文件
  备注：传入的日期格式必须是2018/10/09这样的格式~

  8）获取任务列表
  200:获取成功

  201：该token用户不存在

  202:没有权限，必须是机构账户才行

  203：参数错误，检查一下传入的参数字段
  备注：

  **1）三种身份请求的任务列表返回结果不相同：超管获取所有任务列表，操作员获取没有领取的任务列表以及与自己相关的任务列表，机构操作员获取与自己相关的任务列表 **

  2）‘stage’字段含义：

  0 代表未领取，

  1代表操作员处理中

  2代表客户机构待确认

  3代表任务流程已完成

  3）对于操作员“领取数”和“处理中”的两个值，无法进行区分，因为操作员下载客户机构的文件的时候，没有相应的接口，后端无法判断操作员是否已经下载文件，即无法区分领取任务和处理任务两种状态（receive_num 和 process_num 无法区分，暂时做等值处理）

  8）获取任务详细信息
  200:获取成功

  201：该token用户不存在

  202：该任务不存在
  备注：若该任务没有被操作员认领则传回的operator相关字段是空值

  9）对任务的各种操作
  200:操作成功

  201：该token用户不存在

  202:没有权限（只允许操作员或者机构客户操作，超管不行）

  203：该任务不存在

  204：action字段有误
  备注：对于操作员“领取数”和“处理中”的两个值，无法进行区分，因为操作员下载客户机构的文件的时候，没有相应的接口，后端无法判断操作员是否已经下载文件，即无法区分领取任务和处理任务两种状态

  4.身份验证，
  每次请求需要发送token，若token异常：

  301：没有token传入，需要重新登录

  302：token过期，需要重新登录

  303：token错误。
  如果token正常则执行响应的操作并返回数据。

  备注：后端暂时设置的token有效期是一天，24h之后需要重新登录获取新的token。
*/

const API_SERVER_URL = '/api';

const filters = {
  // 登录 @
  login: {
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
      expireTime: +rep.data.expire_time || 0, // Timestamp
    }),
    handlerr: (resolve, reject, name, input) => {
      setTimeout(() => {
        resolve({
          stat: 0,
          data: {
            token: 'TEST_TOKEN',
            // username: input.username,
            ident: input.username,
            expireTime: Date.now() * 1.2,
          },
        });
      }, 1800);
    },
  },
  // 登出 @
  logout: {
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
    method: 'POST',
    url: API_SERVER_URL + '/modify_password',
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
    method: 'POST',
    url: API_SERVER_URL + '/tasks/add',
    chop: inp => {
      let fd = new FormData();
      fd.append('attachments', inp.attachments[0], 'task_attachment');
      let pro = taskItemMapper(inp);
      Object.keys(pro)
      .forEach(k => fd.append(k, pro[k]));
      return fd;
    },
    trim: rep => taskItemMapper(rep.data),
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
    method: 'POST',
    url: inp => API_SERVER_URL + `/organization/freeze`,
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
    method: 'POST',
    url: API_SERVER_URL + '/tasks/list',
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
  // 获取任务详情
  taskDetail: {
    method: 'POST',
    url: inp => API_SERVER_URL + `/tasks/detail/${inp.taskId}`,
    trim: rep => {
      // if(!rep.data) return {};
      return {
          taskDetail: Mock.mock({
            'taskId': input.taskId,
            'name': '@cname', 
            'gender': 2,
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
        };
      return {
        taskDetail: {} && taskItemMapper(rep.data.task_detail, true),
        operatorDetail: {} && operatorItemMapper(rep.data.operator_detail, true),
        orgDetail: {} && organizationItemMapper(rep.data.organization_detail, true),
        taskStage: taskStageMap[rep.data.task_stage],
        task_attachment_is_downloaded: !!rep.data.task_attachment_is_downloaded,
        task_attachment_url: downloadUrlFilter(rep.data.task_attachment_url),
        task_report_url: downloadUrlFilter(rep.data.task_report_url),
        can_operator_confirm: !!rep.data.can_operator_confirm,
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
  // 上传报告文件 @
  uploadTaskReport: {
    method: 'POST',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=process`,
    chop: inp => inp.formdata,
    trim: rep => ({
      task_report_url: downloadUrlFilter(rep.data && rep.data.task_report_url),
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
    method: 'GET',
    url: inp => API_SERVER_URL +`/tasks/operate/${inp.taskId}?action=confirm`,
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
  debug: (process.env.NODE_ENV == 'development'),
  filters,
  gtrim(rep) {
    // if(typeof rep !== Object) {
    //   return {
    //     status: {},
    //     data: {},
    //   };
    // }

    if(rep.pageInfo) {
      rep.pageInfo = processPageInfo(rep.pageInfo);
    }
    // if(!rep.data) {
      // rep.data = {};
    // }
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
  stater(result, respData, respStat) {
    // [TODO]
    // If token is invalid, then:
    // loginInfo.exit();
  
    if (respStat.status >= 300) {
      result(false);
      return {
        code: -1,
        msg: 'HTTP Error',
        frimsg: '网络或服务器错误',
      };
    } /* else if (typeof respData !== Object || (!respData.status)) {
      result(false);
      return {
        code: -2,
        msg: 'invalid data',
        frimsg: '返回的数据是无效的',
      };
    } */ else {
      result(respData.status.code == 200);
      return {
        code: respData.status.code || 300,
        msg: respData.status.msg || 'Unknown Error',
        frimsg: respData.status.msg || '未知错误',
        // mapToFriendlyMessage(respData.status),
      };
    }
  },
});


