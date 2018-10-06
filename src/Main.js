import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Router, Route, HashRouter, Redirect, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';

import './Main.md.sass';
import './styles/common.sass';

import { UserCtx } from './contexts/contexts.js';

const defaultLoginInfo = {
  username: '',
  token: false,
  ident: false, 
};

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

    this.retrieveLoginInfo = () => {
      let stored = sessionStorage.getItem('userLoginInfo');
      return stored ? JSON.parse(stored) : {};
    };
    this.storeLoginInfo = (val) => {
      sessionStorage.setItem('userLoginInfo', JSON.stringify(val));
    };

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
              <Switch>
                {(!info.token) && <Route path="/login" component={withRouter(Login)} />}
                {info.token    && <Route path="/admin" component={withRouter(Admin)} />}
                <Redirect to={info.token ? '/admin' : '/login'} />
              </Switch>
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
