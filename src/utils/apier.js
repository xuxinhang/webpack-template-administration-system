import CattleBridge from 'cattle-bridge';
import axios from 'axios';
import loginInfo from '@/utils/loginInfoStorage.js';
import _ from 'lodash';


// 将 Object 的键名做映射
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

const genderMap = {
  0: 'male',
  1: 'female',
  male: 0,
  female: 1,
};

// 转换时间字符串为 YYYY/MM/DD 的格式（后台 API 的要求）
const processTimeString = raw => String(raw).replace(/-/g, '/');

// Covert query string
// const covertQueryString = obj => {
// return Object.keys(obj).map(k => k + '=' + obj[k]).join('&');
// };

// 处理分页信息
const processPagination = raw => ({
  pageNumber: raw.pageNumber,
  pageSize: raw.pageSize,
});
const processPageInfo = raw => ({
  totalPage: raw.total_page,
  totalRecord: raw.total_record,
});

// 对 URL 做过滤，防 XSS
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

// 下面都是一些具体的键名的映射
const operatorItemMapper = objectMapper([
  ['operatorId', 'operator_id'],
  ['num', 'index'],
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
  ['num', 'index'],
  ['name', 'name'],
  ['createdTime', 'created_time'],
  ['tel', 'tel'],
  ['password', 'password'],
  ['belong', 'belong'],
  ['email', 'email'],
  ['taskNumber', 'taskNumber'],
  ['frozen', 'frozen', v => v-1, v => [2,1][v]],
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
  ['num', 'index'],
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

const taskOperationMapper = objectMapper([
  ['allowOperatorConfirm', 'allowOperatorConfirm', Boolean],
  ['confirmedBy', 'confirmedBy', v => identMap[v], v => identMap[v]],
  ['confirmingTime', 'confirmingTime', Number, Number],
  ['downloadingAttachmentTime', 'downloadingAttachmentTime', Number, Number],
  ['uploadingReportTime', 'uploadingReportTime', Number, Number],
  ['receivingTime', 'receivingTime', Number, Number],
  ['taskAttachmentUrl', 'taskAttachmentUrl', downloadUrlFilter, downloadUrlFilter],
  ['taskReportUrl', 'taskReportUrl', downloadUrlFilter, downloadUrlFilter],
]);

const identMap = {
  0: 'administrator',
  1: 'operator',
  2: 'organization', 
};

// API状态码和对应的友好的提示消息
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
  },
  // 登出 @
  logout: {
    name: 'logout',
    method: 'POST',
    url: API_SERVER_URL + '/logout',
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
  },
  // 添加机构账号 @
  addOrganization: {
    name: 'addOrganization',
    method: 'POST',
    url: API_SERVER_URL + '/organization/add',
    chop: inp => organizationItemMapper(inp, false),
    trim: rep => organizationItemMapper(rep.data, true),
  },
  // 添加操作员 @
  addOperator: {
    name: 'addOperator',
    method: 'POST',
    url: API_SERVER_URL + '/operator/add',
    chop: inp => operatorItemMapper(inp, false),
    trim: rep => operatorItemMapper(rep.data, true),
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
        // task_attachment_is_downloaded: !!rep.data.task_attachment_is_downloaded,
        // task_attachment_url: downloadUrlFilter(rep.data.task_attachment_url),
        // task_report_url: downloadUrlFilter(rep.data.task_report_url),
        // can_operator_confirm: !!rep.data.can_operator_confirm,
        // task_confirm_by: 'organization',
        taskOperation: taskOperationMapper(rep.data.taskOperation),
      };
    },
  },
  // 领取任务 @
  receiveTask: {
    name: 'receiveTask',
    method: 'GET',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=receive`,
    trim: rep => rep.data || {},
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
  },
  // 确认任务 @
  confirmTask: {
    name: 'confirmTask',
    method: 'GET',
    url: inp => API_SERVER_URL + `/tasks/operate/${inp.taskId}?action=confirm`,
    trim: rep => rep.data,
  },
};

// 开发环境下向 filter 注入 handler
if(process.env.NODE_ENV == 'development') {
  _.merge(filters, require('./apier-mock.js').default);
}

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


