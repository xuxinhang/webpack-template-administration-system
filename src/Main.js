import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Route, HashRouter, Redirect, Switch } from 'react-router-dom';
import loginInfo from '@/utils/loginInfoStorage.js';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import { LocaleProvider, Modal } from 'antd';
import { LoginPage as Login, LoginForm } from './pages/Login';
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

    this.updateLoginState = (info, toStore = true) => {
      this.setState(prevState => {
        let nv = {...prevState.userLoginInfo, ...info};
        // console.log('new login info', info);
        toStore && this.storeLoginInfo(nv);
        let newState = {
          actualLoginInfo: {...nv},
        };
        if(!prevState.useLoginModal || nv.token) {
          newState.userLoginInfo = {...nv};
          newState.useLoginModal = !!info.token; // 登录后默认使用登录弹窗
        }
        return newState;
      });
    };

    console.log('registerBroadcast');
    loginInfo.registerBroadcast(info => {
      // 显示登录弹窗就不修改登录相关的UI状态
      this.updateLoginState(info, false);
    });

    this.retrieveLoginInfo = loginInfo.retrieve;
    this.updateLoginInfo = loginInfo.update;
    
    // [NOTE] 需要在渲染<Route>之前读入登录状态
    //        否则刷新之后URL会因为Route未渲染而丢失
    this.state = {
      userLoginInfo: {
        ...this.retrieveLoginInfo(),
        // 升级登录信息
        update: this.updateLoginInfo,
        // 在UI中使用此函数来退出登录
        // config.useLoginModal
        //   - true  改写登录状态、不修改登录相关的UI状态、显示登录弹窗
        //   - false 改写登录状态、修改登录相关的UI状态、回到登录页面
        exit: (config = {}) => {
          if(config.useLoginModal || false) {
            this.setState({
              useLoginModal: true,
            }, () => {
              loginInfo.exit();
            });
          } else {
            this.setState({
              useLoginModal: false,
            }, () => {
              loginInfo.exit();
            });            
          }
        },
      },
      useLoginModal: false,
      actualLoginInfo: {},
    };

  }

  render() {
    return (
      <UserCtx.Provider value={this.state.userLoginInfo}>
        <UserCtx.Consumer>
        {info => (
          <main styleName="main-container">
            <HashRouter>
              <LocaleProvider locale={zh_CN}>
                <>
                  <Switch>
                    {(!info.token) && <Route path="/login" component={withRouterLogin} />}
                    {info.token    && <Route path="/admin" component={withRouterAdmin} />}
                    <Redirect to={info.token ? '/admin' : '/login'} />
                  </Switch>
                </>
              </LocaleProvider>
            </HashRouter>
            {/* 未登录且useLoginModal时显示登录弹窗 */}
            <Modal
              title="请先登录账户"
              visible={this.state.useLoginModal && !this.state.actualLoginInfo.token}
              footer={false}
              width={370}
              closable={false}
            >
              <LoginForm />
            </Modal>
          </main>
        )}
        </UserCtx.Consumer>
      </UserCtx.Provider>
    );
  }

  componentDidMount() {
    // this.updateLoginState(this.retrieveLoginInfo(), false);
    // loginInfo.sync();
  }
}

export default Main;
