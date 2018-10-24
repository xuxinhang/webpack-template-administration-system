import React, { Component } from 'react';
import './Login.md.sass';
import { Form, Icon, Input, Button, Checkbox, Card, Modal, message } from 'antd';

import { UserCtx } from '@/contexts/contexts.js';
import apier from '@/utils/apier.js';

class LoginPage extends Component {
  render() {
    return (
      <div styleName="login-wrapper">
        <section styleName="login-wrap">
          <Card styleName="login-card" title="🔑 登录您的账户">
            <WrappedNormalLoginForm />
          </Card>
        </section>
      </div>
    );
  }
}

class NormalLoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formLoading: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit (updater) {
    return (e) => {
      e.preventDefault();
      let validPass = false;
      this.props.form.validateFields((err, values) => {
        if (!err) {
          validPass = true;
          // Request APIs
          this.setState({formLoading: true});
          apier.fetch('login', {
            username: values.username,
            password: values.password,
          })
          .then(({data}) => {
            let result = updater({
              token: data.token,
              username: values.username,
              ident: data.ident,
              expireTime: data.expireTime,
            });
            if(result && result[0]) {
              this.props.form.resetFields(['password']);
              message.success(`${values.username}，欢迎回到系统！`);
            } else {
              throw ({ stat: { frimsg: result[1] }});
            }
          })
          .catch(({stat}) => {
            Modal.error({title: '登录遇到问题', content: `${stat.frimsg}`});
          })
          .finally(() => {
            this.setState({formLoading: false});
          });
        }
      });
      
      if(!validPass) return;
    };
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <UserCtx.Consumer>
      {loginInfo =>
        <Form onSubmit={this.handleSubmit(loginInfo.update)} className="login-form">
          <Form.Item>
            {getFieldDecorator('username', {
              rules: [{ required: true, message: '请输入用户名' }],
            })(
              <Input
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                size="large"
                placeholder="用户名"
              />
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: '请输入密码' }],
            })(
              <Input
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                type="password"
                size="large"
                placeholder="密码"
              />
            )}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('remember', {
              valuePropName: 'checked',
              initialValue: true,
            })(
              <Checkbox>记住我</Checkbox>
            )}
            <br />
            <Button
              type="primary"
              htmlType="submit"
              block size="large"
              loading={this.state.formLoading}
            >
              登录  
            </Button>
          </Form.Item>
        </Form>
      }
      </UserCtx.Consumer>
    );
  }
}

const WrappedNormalLoginForm = Form.create()(NormalLoginForm);


export default LoginPage;
export { LoginPage, WrappedNormalLoginForm as LoginForm };
