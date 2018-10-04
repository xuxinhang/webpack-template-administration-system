import React from 'react';
import { Row, Col, Form, Input, Button, DatePicker, Select, Modal } from 'antd';
const { TextArea } = Input;
import { PageHeader } from '@/comps/PageHeader';
import apier from '@/utils/apier.js';

import '../../styles/common.sass';
import './AddItem.md.sass';

class AddItem extends React.Component {
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
    apier.fetch('addItem', {
      ...values,
      time: values.time.format('YYYY-MM-DD'),
    }) // 可能以后要改？
    .then(() => {
      this.setState({
        formState: 2,
        formTip: ['success', '操作成功'],
      });
      Modal.success({
        title: '此项已被添加',
        content: '您可以在浏览页进行查看和其他操作。',
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
        <PageHeader title="新建数据" />
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
    }
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
        <div className="line-decorated-text" styleName="form-section-title">测量对象</div>
        <Row gutter={36} styleName="form-row">
          <Col span={8}>
            <Form.Item label="姓名">
            {getFieldDecorator('name', {
              rules: [{ min: 2, max: 30, required: true, message: '请输入合法的姓名' }],
            })(
              <Input />
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="性别">
            {getFieldDecorator('gender', {
              rules: [{ required: true, message: '请选择性别' }],
            })(
              <Select style={{width: '100%'}} placeholder="点击选择">
                <Option value={0}>男</Option>
                <Option value={1}>女</Option>
              </Select>
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="身份证">
            {getFieldDecorator('idcard', {
              rules: [{ required: true, message: '需输入证件号' }],
            })(
              <Input />
            )} 
            </Form.Item>          
          </Col>
        </Row>
        <div className="line-decorated-text" styleName="form-section-title">测量情况</div>  
        <Row gutter={36}>
          <Col span={8}>
            <Form.Item label="测量部位">
            {getFieldDecorator('part', {
              rules: [
                { max: 40, message: '内容过长' },
                { required: true, message: '必填' },
              ],
            })(
              <Input />
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="测量方法">
            {getFieldDecorator('method', {
              rules: [
                { max: 40, message: '内容过长' },
                { required: true, message: '必填' },
              ],
            })(
              <Input />
            )}
            </Form.Item>          
          </Col>
          <Col span={8}>
            <Form.Item label="测量时间">
            {getFieldDecorator('time', {
              rules: [{ required: true, message: '必需填写检测日期' }],
            })(
              <DatePicker style={{ width: '100%' }} placeholder="点击选择日期" format="YYYY/MM/DD" />
            )} 
            </Form.Item>          
          </Col>
        </Row>
        <Row>
          <Col span={36} styleName="form-row">
            <Form.Item label="测量情况概述">
            {getFieldDecorator('description', {
              rules: [{ max: 6, message: '内容请控制在600字以内' }], // [TODO]
            })(
              <TextArea autosize={{ minRows: 5 }} placeholder="选填，600字以内" />
            )} 
            </Form.Item>          
          </Col>
        </Row>
        <Form.Item styleName="form-submit-bar">
          {[
          <Button {...submitBtnProps} htmlType="submit">提交</Button>,
          <Button {...submitBtnProps} disabled loading >正在提交</Button>,
          <Button {...submitBtnProps} disabled>提交成功</Button>,
          ][this.props.submitStage]}
        </Form.Item>
      </Form>
    );
  }
}

const WrappedForm = Form.create()(RawForm);



export { AddItem };
