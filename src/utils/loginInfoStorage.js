const defaultLoginInfo = {
  username: '',
  token: false,
  ident: false,
  expireTime: -1,
};

const checkExpireTime = info => {
  return Date.now() > info.expireTime && info.expireTime >= 0;
};

function retrieveLoginInfo() {
  let stored = sessionStorage.getItem('userLoginInfo');
  if(stored) {
    try {
      let info = { ...defaultLoginInfo, ...JSON.parse(stored) };
      // eslint-disable-next-line
      // process.env.NODE_ENV === 'development' && console.log(info);
      if(checkExpireTime(info) || !info.token) {
        exitLogin();
        return {...defaultLoginInfo};
      }
      return {...defaultLoginInfo, ...info};
    } catch(e) {
      return {...defaultLoginInfo};
    }
  } else {
    exitLogin();
    return {...defaultLoginInfo};
  }
}

function storeLoginInfo(val) {
  return sessionStorage.setItem('userLoginInfo', JSON.stringify(val));
}

function exitLogin() {
  updateLoginInfo({...defaultLoginInfo});
}

let broadcastList = [];

function broadcastLoginInfo(info) {
  broadcastList.forEach(curt => {
    curt(info);
  });
}

function registerLoginInfoBroadcast(callback) {
  if(!broadcastList.includes(callback)) {
    broadcastList.push(callback);
  }
}

function syncLoginInfo() {
  broadcastLoginInfo(retrieveLoginInfo());
}

function updateLoginInfo(info) {
  if(checkExpireTime(info)) {
    exitLogin();
    return [false, '登录过期，请重新登录'];
  } else {
    storeLoginInfo(info);
    broadcastLoginInfo(info);
    return [true];
  }
}

export default { 
  update: updateLoginInfo,
  retrieve: retrieveLoginInfo,
  exit: exitLogin,
  registerBroadcast: registerLoginInfoBroadcast,
  sync: syncLoginInfo,
  storeLoginInfo,
  retrieveLoginInfo,
  defaultLoginInfo,
};

