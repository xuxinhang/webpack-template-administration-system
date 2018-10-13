import React from 'react';
import { Row, Col, Form, Input, Button, Modal } from 'antd';
// const { TextArea } = Input;
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';
import formRules from '@/utils/commonFormRules.js';


import sty from './AddOperator.md.sass';
// import '../../styles/common.sass';

class AddOperator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formState: 0,
      formTip: ['', ''],
    };

    this.formSubmitHandler = this.formSubmitHandler.bind(this);
  }

  formSubmitHandler(errors, values) {
    this.setState({
      formState: 1,
      formTip: ['info', '提交中'],
    });
    apier.fetch('addOperator', {
      ...values, // 可能以后要改？
    })
    .then(() => {
      this.setState({
        formState: 2,
        formTip: ['success', '已添加新的操作员账号'],
      });
      Modal.success({
        title: '已添加新的操作员账号',
        content: '您可以在操作员账号管理页进行查看和其他操作。',
      });
    })
    .catch(({stat}) => {
      this.setState({
        formState: 0,
        formTip: ['error', `遇到问题，请重试。${stat.frimsg}`],
      });
      Modal.error({
        title: '遇到了一些问题',
        content: <>{stat.frimsg}<br />请重试。</>,
      });
    });
  }

  render() {
    return (
      <>
        <PageHeader title="新建操作员账号" />
        <section styleName="form-wrap">
          <WrappedForm
            onSubmit={this.formSubmitHandler}
            submitStage={this.state.formState}
          />
        </section>
      </>
    );
  }
}

class RawForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.formOp = this.props.form;
    // 提交数据
    this.submitHandler = e => {
      e.preventDefault();
      this.formOp.validateFields((errors, values) => {
        if(errors) return;
        this.props.onSubmit.call(e.currentTarget, errors, values);
      });
    };
  }

  render() {
    const { getFieldDecorator } = this.formOp;
    const submitBtnProps = {
      style: { width: '8em' },
      type: 'primary',
      size: 'large',
    };

    return (
      <Form onSubmit={this.submitHandler}>
        <div className="line-decorated-text" styleName="form-section-title">基本信息</div>
        <Row gutter={36}>
          <Col span={8}>
            <Form.Item label="姓名">
            {getFieldDecorator('name', {
              validateTrigger: 'onBlur',
              rules: [
                formRules.personName,
                { min: 2, max: 30, required: true, message: '请输入合法的姓名' }
              ],
            })(
              <Input />
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="联系电话">
            {getFieldDecorator('tel', {
              validateTrigger: 'onBlur',
              rules: [
                { max: 30, message: '内容过长' },
                formRules.tel,
                { required: true, message: '必填' },
              ],
            })(
              <Input type="tel" />
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="初始密码">
              <Input value="电话号码后六位" disabled />
            </Form.Item>          
          </Col>
        </Row>
        <Form.Item styleName="form-submit-bar">
          {[
          <Button {...submitBtnProps} key="submit" htmlType="submit">提交</Button>,
          <Button {...submitBtnProps} key="submit" disabled loading >正在处理</Button>,
          <Button {...submitBtnProps} key="submit" disabled>添加成功</Button>,
          ][this.props.submitStage]}
        </Form.Item>
      </Form>
    );
  }
}

const WrappedForm = Form.create()(RawForm);


export default AddOperator;
export { AddOperator };
