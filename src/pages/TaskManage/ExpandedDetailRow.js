import React from 'react';
import { Steps, Row, Col, Button, Icon, Popover, Modal, Message } from 'antd';
import DsSteps, { DsStep } from '@/comps/DsSteps';
import { UserCtx } from '@/contexts/contexts.js';
import apier from '@/utils/apier.js';

import './ExpandedDetailRow.md.sass';

const customedIcon = {
  clock: <svg viewBox="232 232 560 560" fill="currentColor" width="1em" height="1em"><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
};

class ExpandedDetailRow extends React.Component {
  constructor(props) {
    super(props);

    this.receiveTaskBtnClickHandler = this.receiveTaskBtnClickHandler.bind(this);

    this.state = {
      // 数据
      detailData: {
        task_detail:{
          'taskId': props.taskId || '12',
          'name': '@cname', 
          'gender': 2,
          'idcard': '@id',
          'part': '春树里',
          'method': '@word',
          'time': '@date',
          'description': '@cparagraph',
          'age': 130,
        },
        operator_detail: {
          'name': '操作员姓名',
          'tel': '125643234565',
        },
        org_detail: {
          name: 'ORG',
          tel: 'ORG123456',
        },
        task_stage: 'receiving',
        task_attachment_is_downloaded: false,
        task_attachment_url: 'https://baidu.com',
        task_report_url: 'https://weibo.com',
        can_operator_confirm: false,
      },
      // UI

    };
  }

  componentDidMount() {
    // this.fetchDetailData({
    //   taskId: this.state.detailData.task_detail.taskId,
    // });
  }

  async fetchDetailData({ taskId }) {
    // try {
      let { data, status } = await apier.fetch('taskDetail', { taskId });
      this.setState({ detailData: data });
    // } catch({ data, status }) {
      // Message.error('获取任务详情错误：' + status.frimsg);
    // }
  }

  receiveTaskBtnClickHandler() {
    let { task_detail: { taskId } } = this.state.detailData;
    Modal.confirm({
      title: '确实要领取此任务吗？',
      onOk: () => {
        return apier.fetch('receiveTask', { taskId })
        .then(({ data, status }) => {
          Message.success('此任务已被你领取');
          this.setState(prevState => {
            prevState.detailData.task_stage = 'processing';
            return { detailData: prevState.detailData };
          });
        })
        .catch(({ data, status }) => {
          Modal.warn({
            title: '无法领取此任务',
            content: status.frimsg,
          });
        });
      },
    });
  }


  render() {
    let detailData = this.state.detailData;
    let toggleStage = () => {
      const mp = {
        receiving: 'processing',
        processing: 'confirming',
        confirming: 'finished',
        finished: 'receiving',
      };
      this.setState(state => {
        state.detailData.task_stage = mp[state.detailData.task_stage];
        return { detailData: state.detailData };
      });
    };

    const computeCurrentStepIndex = taskStage => {
      let arrayFind = ({
        receiving: 2,
        processing: 3,
        confirming: 4,
        finished: 6,
      })[taskStage];
      return  arrayFind === undefined ? 0 : arrayFind;
    };

    return (
      <div styleName="box-wrap">
        <Row gutter={12} styleName="section-wrap">
          <Col span={7}>
            <p styleName="section_title" onClick={toggleStage}>基本信息{this.props.taskId}</p>
            <table styleName="section_table">
              <tr>
                <th>姓名</th>
                <td>{detailData.task_detail.name}</td>
              </tr>
              <tr>
                <th>性别 / 年龄</th>
                <td>
                  {['','男','女'][detailData.task_detail.gender]}
                  &nbsp;/&nbsp; 
                  {detailData.task_detail.age}
                </td>
              </tr>
              <tr>
                <th>证件号</th>
                <td>{detailData.task_detail.idcard}</td>
              </tr>
            </table>
          </Col>
          <Col span={7}>
            <p styleName="section_title">测量情况</p>
            <table styleName="section_table">
              <tr>
                <th>测量部位</th>
                <td>{detailData.task_detail.part}</td>
              </tr>
              <tr>
                <th>测量方法</th>
                <td>{detailData.task_detail.method}</td>
              </tr>
              <tr>
                <th>测量时间</th>
                <td>{detailData.task_detail.time}</td>
              </tr>
            </table>
          </Col>
          <Col span={10}>
            <p styleName="section_title">基本概述</p>
            <p styleName="section_para">{detailData.task_detail.description}</p>
          </Col>
        </Row>
        <div styleName="section-wrap">
          <p styleName="section_title">处理进度</p>
          <UserCtx.Consumer>
          {info => {
            let currentStepIndex = computeCurrentStepIndex(this.state.detailData.task_stage);
            return (
            <DsSteps
              styleName="step-bar-wrap"
              current={currentStepIndex}
              icons={{
                finished: <Icon type="check" theme="outlined" />,
                process: <Icon component={() => customedIcon.clock} />,
                wait: '',
              }}
            >
              <DsSteps.DsStep title="上传任务附件">上传成功</DsSteps.DsStep>
              <DsSteps.DsStep title="待领取">
              {currentStepIndex > 2
              ? '操作员已领取'
              : <>
                  此任务尚未领取 <br />
                  { info.ident == 'operator' && 
                  <Button size="small" onClick={this.receiveTaskBtnClickHandler}>
                    领取任务
                  </Button>}
                </>}
              </DsSteps.DsStep>
              <DsSteps.DsStep title="处理中">
              {currentStepIndex < 3
                ? '未开始'
                : <>
                    {this.state.detailData.task_attachment_is_downloaded
                    ? '操作员已下载附件'
                    : '操作员尚未下载附件'}
                    <a>
                      &nbsp;<Icon type="download"></Icon>
                    </a>
                    <br />
                    {this.state.detailData.task_report_url
                    ? '操作员已上传报告'
                    : '操作员尚未上传报告'}
                    {info.ident == 'operator' && currentStepIndex < 5 &&
                    <a> 
                      &nbsp;<Icon type="upload"></Icon>
                    </a>}
                    <br />
                    <Popover content={
                      <>
                        操作员：
                        {this.state.detailData.operator_detail.name}
                        {this.state.detailData.operator_detail.tel}
                        <br />
                        机构客户：
                        {this.state.detailData.org_detail.name}
                        {this.state.detailData.org_detail.tel}
                      </>
                    }>
                      <a>联系方式</a>
                    </Popover>
                  </>
              }
              </DsSteps.DsStep>
              <DsSteps.DsStep title="待确认">
                {this.state.detailData.task_report_url &&
                <a>点击下载报告</a>}
                <br />
                {currentStepIndex > 4
                ? '此任务已被确认'
                : currentStepIndex == 4
                ? <>
                  {((info.ident == 'operator' && this.state.detailData.can_operator_confirm)
                  || info.ident == 'organization' || info.ident == 'administrator') &&
                    <Button size="small">点击确认</Button>}
                  </>
                : '' }
              </DsSteps.DsStep>
              <DsSteps.DsStep title="已完结" />
            </DsSteps>
          )}}
          </UserCtx.Consumer>
        </div>
      </div>
    );
  }
}

export { ExpandedDetailRow };
