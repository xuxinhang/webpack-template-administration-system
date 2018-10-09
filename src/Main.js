import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Router, Route, HashRouter, Redirect, Switch } from 'react-router-dom';
import { storeLoginInfo, retrieveLoginInfo, defaultLoginInfo } from '@/utils/loginInfoStorage.js';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import { LocaleProvider } from 'antd';
import Login from './pages/Login';
import Admin from './pages/Admin';

import './Main.md.sass';
import './styles/common.sass';

import { UserCtx } from './contexts/contexts.js';

// withRouter 
// 注意：withRouter 放在 render 之外否则每次渲染的都是不同的component
const withRouterAdmin = withRouter(Admin);
const withRouterLogin = withRouter(Login);

class Main extends Component {
  constructor(props) {
    super(props);

    this.updateLogin = (info, toStore = true) => {
      this.setState(prevState => {
        let nv = {...prevState.userLoginInfo, ...info};
        toStore && this.storeLoginInfo(nv);
        return {userLoginInfo: nv};
      });
    };

    this.retrieveLoginInfo = retrieveLoginInfo;
    this.storeLoginInfo = storeLoginInfo;
    
    // [NOTE] 需要在渲染<Route>之前读入登录状态
    //        否则刷新之后URL会因为Route未渲染而丢失
    this.state = {
      userLoginInfo: {
        ...defaultLoginInfo,
        update: this.updateLogin,
        ...this.retrieveLoginInfo(),
        exit: () => this.updateLogin({...defaultLoginInfo}),
      },
    };

    // this.updateLogin(, false);
  }

  render() {
    return (
      <main styleName="main-container">
        <HashRouter>
          <UserCtx.Provider value={this.state.userLoginInfo}>
            <UserCtx.Consumer>
              {info => (
              <LocaleProvider locale={zh_CN}>
                <Switch>
                  {(!info.token) && <Route path="/login" component={withRouterLogin} />}
                  {info.token    && <Route path="/admin" component={withRouterAdmin} />}
                  <Redirect to={info.token ? '/admin' : '/login'} />
                </Switch>
              </LocaleProvider>
              )}
            </UserCtx.Consumer>
          </UserCtx.Provider>
        </HashRouter>
      </main>
    );
  }

  componentDidMount() {
    this.updateLogin(this.retrieveLoginInfo(), false);
  }
}

export default Main;
