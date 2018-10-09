const defaultLoginInfo = {
  username: '',
  token: false,
  ident: false, 
};

function retrieveLoginInfo() {
  let stored = sessionStorage.getItem('userLoginInfo');
  if(stored) {
    try {
      let info = JSON.parse(stored);
      if(Date.now() > info.expireTime) {
        storeLoginInfo
      } 
    } catch(e) {
      return {};
    }
  } else {
    return {};
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
  broadcastList.push(callback);
}

function updateLoginInfo(info) {
  storeLoginInfo(info);
  broadcastLoginInfo(info);
}

export { 
  updateLoginInfo as update,
  retrieveLoginInfo as retrieve,
  exitLogin as exit,
  registerLoginInfoBroadcast as registerBroadcast,
  storeLoginInfo,
  retrieveLoginInfo,
  defaultLoginInfo,
};

