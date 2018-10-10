import React from 'react';
import { Row, Col, Button, Icon, Popover, Modal, Message, Spin, Upload } from 'antd';
import DsSteps from '@/comps/DsSteps';
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
        taskDetail:{
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
        operatorDetail: {
          'name': '操作员姓名',
          'tel': '125643234565',
        },
        orgDetail: {
          name: 'ORG',
          tel: 'ORG123456',
        },
        taskStage: 'receiving',
        task_attachment_is_downloaded: false,
        task_attachment_url: 'https://baidu.com',
        task_report_url: 'https://weibo.com',
        can_operator_confirm: false,
      },
      // UI
      dataLoading: false,
      uploadBtnFileList: [],
      uploadBtnLoading: false,
    };
  }

  componentDidMount() {
    this.fetchDetailData({
      taskId: this.state.detailData.taskDetail.taskId,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log(prevProps, this.props);
    // let prevTaskId = prevProps.taskId;
    let prevTaskIdInState = prevState.detailData.taskDetail.taskId;
    let newTaskId = this.props.taskId;
    if(prevTaskIdInState != newTaskId && this.props.active) {
      this.fetchDetailData({ taskId: newTaskId });
    }
  }

  async fetchDetailData({ taskId }) {
    this.setState({ dataLoading: true });
    try {
      let { data } = await apier.fetch('taskDetail', { taskId });
      this.setState({ detailData: data });
    } catch({ data, stat }) {
      Message.error('获取任务详情错误：' + stat.frimsg);
    } finally {
      this.setState({ dataLoading: false });
    }
  }

  receiveTaskBtnClickHandler() {
    let { taskDetail: { taskId } } = this.state.detailData;
    Modal.confirm({
      title: '确实要领取此任务吗？',
      onOk: () => { //close => {
        return apier.fetch('receiveTask', { taskId })
        .then(() => {
          Message.success('此任务已被你领取');
          this.setState(prevState => {
            prevState.detailData.taskStage = 'processing';
            return { detailData: prevState.detailData };
          });
        })
        .catch(({ stat }) => {
          Modal.error({
            title: '无法领取此任务',
            content: stat.frimsg,
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
        state.detailData.taskStage = mp[state.detailData.taskStage];
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

    const uploadBtnProps = {
      onChange: ({ file, fileList }) => {
        this.setState({
          uploadBtnFileList: fileList.length <= 1 ? fileList : [file],
        });
      },
      beforeUpload: file => {
        // [TODO] 文件过滤规则
        if(file.size > 50 * 1024 * 1024) {
          Modal.info({
            title: '选择的文件不符合规范',
            content: '文件大小不应超过50MB',
          });
          this.setState({ uploadBtnFileList: [] });
          return false;
        }

        if(this.state.detailData.task_report_url) {
          return new Promise((resolve, reject) => {
            Modal.confirm({
              title: '之前上传的文件会被覆盖',
              content: '确定继续上传吗？',
              okText: '继续上传',
              onOk: close => {
                close();
                resolve();
              },
              onCancel: close => {
                reject();
                close();
              },
            });
          });
        } else {
          return true;
        }
      },
      customRequest: async ({ onProgress, onError, onSuccess, data: uploadData, file }) => {
        onProgress();
        this.setState({ uploadBtnLoading: true });
        // File Object
        let fd = new FormData();
        fd.append('task_report_raw_file_type', file.type);
        fd.append('task_report_raw_file_name', file.name);
        fd.append('task_report_file', file);
        // Request
        try {
          let { data } = await apier.fetch('uploadTaskReport', {
            ...uploadData,
            formdata: fd,
          });
          this.setState(prevState => ({
            detailData: {
              ...prevState.detailData,
              task_report_url: data.taskReportUrl,
              can_operator_confirm: data.canOperatorConfirm || false,
              taskStage: 'confirming',
            },
            uploadBtnLoading: false,
          }));
          onSuccess();
        } catch({ stat }) {
          onError();
          this.setState({ uploadBtnLoading: false });
        }
      },
    };

    const confirmBtnClickHandler = () => {
      Modal.confirm({
        title: '确实要确认此任务吗？',
        content: '',
        onOk: async close => {
          try {
            await apier.fetch('confirmTask', {
              taskId: this.state.detailData.taskDetail.taskId,
            });
            this.setState(prevState => ({
              detailData: { ...prevState.detailData, taskStage: 'finished' },
            }));
            close();
          } catch({ stat }) {
            close();
            Modal.error({
              title: '暂时无法确认此任务',
              content: stat.frimsg,
            });
          }
        },
      });
    };

    return (
      <Spin spinning={this.state.dataLoading}>
        <div styleName="box-wrap">
          <Row gutter={12} styleName="section-wrap">
            <Col span={7}>
              <p styleName="section_title">基本信息{this.props.taskId}</p>
              <table styleName="section_table">
                <tbody>
                  <tr>
                    <th>姓名</th>
                    <td>{detailData.taskDetail.name}</td>
                  </tr>
                  <tr>
                    <th>性别 / 年龄</th>
                    <td>
                      {['','男','女'][detailData.taskDetail.gender]}
                      &nbsp;/&nbsp; 
                      {detailData.taskDetail.age}
                    </td>
                  </tr>
                  <tr>
                    <th>证件号</th>
                    <td>{detailData.taskDetail.idcard}</td>
                  </tr>
                </tbody>
              </table>
            </Col>
            <Col span={7}>
              <p styleName="section_title">测量情况</p>
              <table styleName="section_table">
                <tbody>
                  <tr>
                    <th>测量部位</th>
                    <td>{detailData.taskDetail.part}</td>
                  </tr>
                  <tr>
                    <th>测量方法</th>
                    <td>{detailData.taskDetail.method}</td>
                  </tr>
                  <tr>
                    <th>测量时间</th>
                    <td>{detailData.taskDetail.time}</td>
                  </tr>
                </tbody>
              </table>
            </Col>
            <Col span={10}>
              <p styleName="section_title">基本概述</p>
              <p styleName="section_para">{detailData.taskDetail.description}</p>
            </Col>
          </Row>
          <div styleName="section-wrap">
            <p styleName="section_title">处理进度</p>
            <UserCtx.Consumer>
            {info => {
              let currentStepIndex = computeCurrentStepIndex(this.state.detailData.taskStage);
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
                <DsSteps.DsStep title="上传任务附件">
                  上传成功
                  <span styleName="toggle-stage-btn" onDoubleClick={toggleStage}>😂</span>
                </DsSteps.DsStep>
                <DsSteps.DsStep title="待领取">
                {currentStepIndex > 2
                ? '操作员已领取'
                : <>
                    ⚠此任务尚未领取 <br />
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
                      ? '✔操作员已下载附件'
                      : '⚠操作员尚未下载附件'}
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        download={'task_' + this.state.detailData.taskDetail.taskId + '_attchment'}
                        href={this.state.detailData.task_attachment_url}>
                        &nbsp;
                        <Icon type="download"></Icon>
                      </a>
                      <br />
                      {this.state.detailData.task_report_url
                      ? '✔操作员已上传报告'
                      : '⚠操作员尚未上传报告'}
                      {info.ident == 'operator' && currentStepIndex < 5 &&
                      <>
                        <Upload
                          {...uploadBtnProps}
                          data={{ taskId: this.state.detailData.taskDetail.taskId }}
                          disabled={this.state.uploadBtnLoading}
                          showUploadList={false}
                        > 
                          <a>&nbsp;<Icon type="upload"></Icon></a>
                        </Upload>
                        <Upload
                          styleName="upload-file-list"
                          fileList={this.state.uploadBtnFileList}
                          showUploadList={{ showRemoveIcon: false }}
                        />
                      </>
                      }
                      <br />
                      <Popover content={
                        <>
                          操作员：
                          {this.state.detailData.operatorDetail.name}
                          <br />
                          {this.state.detailData.operatorDetail.tel}
                          <br />
                          机构客户：
                          {this.state.detailData.orgDetail.name}
                          <br />
                          {this.state.detailData.orgDetail.tel}
                        </>
                      }>
                        <a>联系方式</a>
                      </Popover>
                    </>
                }
                </DsSteps.DsStep>
                <DsSteps.DsStep title="待确认">
                  {this.state.detailData.task_report_url &&
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    download={'task_' + this.state.detailData.taskDetail.taskId + '_report'}
                    href={this.state.detailData.task_report_url}>
                    点击下载报告
                  </a>}
                  <br />
                  {currentStepIndex > 4
                  ? '此任务已被确认'
                  : currentStepIndex == 4
                  ? <>
                    {((info.ident == 'operator' && this.state.detailData.can_operator_confirm)
                    || info.ident == 'organization' || info.ident == 'administrator') &&
                      <Button size="small" onClick={confirmBtnClickHandler}>点击确认</Button>}
                    </>
                  : '' }
                </DsSteps.DsStep>
                <DsSteps.DsStep title="已完结" />
              </DsSteps>
            );}}
            </UserCtx.Consumer>
          </div>
        </div>
      </Spin>
    );
  }
}

export { ExpandedDetailRow };
