import React, { Component, Fragment } from 'react';
import { Route, HashRouter, Link } from 'react-router-dom';
import { Layout, Menu, Icon, Modal } from 'antd';
const { /* Header, */ Content /* , Footer, Sider */ } = Layout;
import apier from '@/utils/apier';
import sty from './Admin.md.sass';
import withAsyncComponent from '@/utils/asyncComponent';

import { UserCtx } from '@/contexts/contexts.js';

// Routes for different identities
const WithAsyncTaskManage = withAsyncComponent(() => import('@/pages/TaskManage'));
const WithTaskManageStatus = ({match}) => {
  return (<WithAsyncTaskManage defaultFilters={{
    taskStage: match.params.taskStage,
  }} />);
};

const pageRoutes = [
  {
    path: 'taskManage/:taskStage',
    component: WithTaskManageStatus, // An async component, too.
    access: ['operator', 'administrator', 'organization'],
  }, {
    path: 'addTask',
    component: withAsyncComponent(() => import('@/pages/AddTask')),
    access: ['organization'],
  }, {
    path: 'operatorManage',
    component: withAsyncComponent(() => import('@/pages/OperatorList')),
    access: ['administrator'],
  }, {
    path: 'organizationManage',
    component: withAsyncComponent(() => import('@/pages/OrganizationList')),
    access: ['administrator'],
  }, {
    path: 'modifyPassword',
    access: -1,
    component: withAsyncComponent(() => import('@/pages/ModifyPassword')),
  }, {
    path: 'addOrganization',
    component: withAsyncComponent(() => import('@/pages/AddOrganization')),
    access: ['administrator'],
  }, {
    path: 'addOperator',
    component: withAsyncComponent(() => import('@/pages/AddOperator')),
    access: ['administrator'],
  },
];

const menuLinks = [
  {
    name: '任务管理',
    menus: [
      { path: 'taskManage/receiving',    title: '未领取', access: ['operator', 'administrator', 'organization'] },
      { path: 'taskManage/progressing', title: '跟进中', access: ['operator', 'administrator', 'organization'] },
      { path: 'taskManage/finished',  title: '已完结', access: ['operator', 'administrator', 'organization'] },
    ]
  }, {
    name: '账号管理',
    menus: [
      { path: 'operatorManage', title: '操作员管理', access: ['administrator'] },
      { path: 'organizationManage', title: '机构客户管理', access: ['administrator'] },
      // { path: 'addOperator', title: '添加操作员[Temp]', access: ['administrator'] },
      // { path: 'addOrganization', title: '添加机构账户[Temp]', access: ['administrator'] },
    ],
  }, {
    name: '操作中心',
    menus: [
      { path: 'addTask', title: '新建项目', access: ['organization'] },
    ],
  },
];


class Admin extends Component {
  constructor(props) {
    super(props);
    this.state= {
      logoutLoading: 0,
    };
    this.logoutClickHandler = this.logoutClickHandler.bind(this);
  }

  logoutClickHandler(infoUpdater) {
    return () => {
      this.setState({logoutLoading: 1});
      apier.fetch('logout')
      .then(() => infoUpdater())
      .catch(({stat}) => Modal.error({title: '登出遇到问题', content: `${stat.frimsg}`}))
      .finally(() => {
        this.setState({logoutLoading: 0});
      });
    };
  }

  render() {
    return(
      <div styleName="sty.layout-frame">
        <div styleName="sty.layout-sider-wrap">
          <div styleName="sty.layout-sider">
            <div styleName="sty.layout-sider_top">
              <em styleName="sty.logo-wrap">Body Scan</em>
            </div>
            <UserCtx.Consumer>
            {info =>
              <Menu theme="dark" styleName="sty.layout-sider_menu" selectedKeys={[this.props.location.pathname]}>
              {menuLinks.reduce((accu, curt) => {
                let menuList = curt.menus.reduce((accu, curt) => {
                  (curt.access === -1 || curt.access.includes(info.ident))
                  && accu.push(
                    <Menu.Item key={this.props.match.url+'/'+curt.path}>
                      <Link to={this.props.match.url+'/'+curt.path}>{curt.title}</Link>
                    </Menu.Item>
                  );
                  return accu;
                }, []);
                menuList.length && accu.push(
                  <Menu.ItemGroup
                    key={curt.name}
                    title={<span styleName="sty.layout-sider_menu_group_title">{curt.name}</span>}
                    styleName="sty.layout-sider_menu_group"
                  >
                    {menuList}
                  </Menu.ItemGroup>
                );
                return accu;
              }, [])}
              </Menu>
            }
            </UserCtx.Consumer>
            <p styleName="sty.layout-sider_bottom">
              <span styleName="sty.copyright">
                © 2018 BodyScan.<wbr />All Rights Reserved.
              </span>
            </p>
          </div>
        </div>
        <div styleName="sty.layout-body" style={{ flex: '1' }}>
          <header styleName="sty.layout-header">
            <ul styleName="sty.layout-header_content">
              <li styleName="sty.layout-header_content_left"></li>
              <li styleName="sty.layout-header_content_right sty.login-info-bar">
                <UserCtx.Consumer>
                  {info =>
                  <>
                    <span>欢迎, {info.username}</span>
                    <span>
                      <Link to={`${this.props.match.url}/modifyPassword`}>修改密码</Link>
                    </span>
                    <span>
                      {this.state.logoutLoading
                      ? <em styleName="disabled-link">正在退出</em>
                      : <a onClick={this.logoutClickHandler(info.exit)}>退出登录</a>}
                    </span>
                  </>
                  }
                </UserCtx.Consumer>
              </li>
            </ul>
          </header>
          <Content styleName="sty.layout-content">
            <UserCtx.Consumer>
            {info => {
              let relRoot = this.props.match.url + '/';
              return pageRoutes.reduce((accu, item) => (
                (item.access === -1 || item.access.includes(info.ident))
                && accu.push(
                  <Route path={relRoot+item.path} key={relRoot+item.path} component={item.component} />
                ),
                accu
              ), []);
            }}
            </UserCtx.Consumer>
          </Content>
        </div>
      </div>
    );
  }
}

export default Admin;
