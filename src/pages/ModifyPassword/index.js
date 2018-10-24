import React, { Component } from 'react';
import { Form, Input, Button, Alert, Modal } from 'antd';
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';

import './ModifyPassword.md.sass';

class ModifyPassword extends Component {
  render() {
    return (
      <>
        <PageHeader title="修改账户密码" />
        <div styleName="form-wrap">
          <WrappedForm />
        </div>
      </>
    );
  }
}

class InitialForm extends Component {
  constructor(props) {
    super(props);
    
    this.state= {
      formLoading: 0,
      formResult: ['', ''],
    };

    this.formSubmitHandler = this.formSubmitHandler.bind(this);
  }

  formSubmitHandler(e) {
    e.preventDefault();
    const formOp = this.props.form;

    formOp.validateFields((errors, values) => {
      if(errors) return;

      if(values.newPwd !== values.reptPwd) {
        formOp.setFields({
          reptPwd: { errors: [new Error('两次输入的新密码不匹配')] },
        });
        return false;
      }

      this.setState({
        formLoading: 1,
        formResult: ['', ''],
      });
      apier.fetch('modifyPassword', {...values})
      .then(() => {
        this.setState({
          formLoading: 2,
          formResult: ['success', '密码修改成功！'],
        });
        Modal.info({ title: '密码修改成功！', content: '下一次请使用新密码登录系统。' });
      })
      .catch(({stat}) => {
        this.setState({
          formLoading: 0,
          formResult: ['error', '修改失败：' + stat.frimsg],
        });
      });
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      colon: false,
      labelCol: { xs: { span: 24 }, sm: { span: 6 } },
      wrapperCol: { xs: { span: 24 }, sm: { span: 18 } },
    };
    const tailFormItemLayout = {
      colon: false,
      wrapperCol: { xs: { span: 24, offset: 0 }, sm: { span: 16, offset: 8 } },
    };

    return (
      <Form hideRequiredMark onSubmit={this.formSubmitHandler}>
        <Alert
          style={{
            visibility:
              (Array.isArray(this.state.formResult)
              && this.state.formResult[0])
              ? 'visible'
              : 'hidden',
          }}
          styleName="form-alert-bar"
          type={this.state.formResult[0]}
          message={this.state.formResult[1] || '-'}
          showIcon
        />
        <Form.Item label="原来的密码" {...formItemLayout}>
        {getFieldDecorator('prevPwd', {
          rules: [{ required: true, message: '请输入旧密码'}],
          validateTrigger: 'onBlur',
        })(
          <Input type="password" autoComplete="current-password" />
        )}
        </Form.Item>

        <Form.Item label="新的密码" {...formItemLayout}>
        {getFieldDecorator('newPwd', {
          rules: [{ required: true, message: '请输入新密码'}],
          validateTrigger: 'onBlur',
        })(
          <Input type="password" autoComplete="new-password" />
        )}
        </Form.Item>

        <Form.Item label="再输入新密码" {...formItemLayout}>
        {getFieldDecorator('reptPwd', {
          rules: [{ required: true, message: '请再次输入新密码'}],
          validateTrigger: 'onBlur',
        })(
          <Input type="password" autoComplete="new-password" />
        )}
        </Form.Item>

        <Form.Item {...tailFormItemLayout}>
          <Button
            type="primary" htmlType="submit"
            loading={this.state.formLoading === 1}
            disabled={this.state.formLoading > 0}
          >
            {['修改密码', '处理中', '密码已修改'][this.state.formLoading]}
          </Button>
        </Form.Item>

      </Form>
    );
  }
}

const WrappedForm = Form.create({})(InitialForm);


export default ModifyPassword;
export { ModifyPassword };
