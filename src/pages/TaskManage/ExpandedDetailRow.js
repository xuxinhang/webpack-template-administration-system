import React from 'react';
import { Row, Col, Button, Icon, Popover, Tooltip, Modal, Message, Spin, Upload } from 'antd';
import DsSteps from '@/comps/DsSteps';
import { UserCtx } from '@/contexts/contexts.js';
import PropTypes from 'prop-types';
import moment from 'moment';
import apier from '@/utils/apier.js';
import formRules from '@/utils/commonFormRules.js';

import './ExpandedDetailRow.md.sass';

const customedIcon = {
  clock: <svg viewBox="232 232 560 560" fill="currentColor" width="1em" height="1em"><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
};

class ExpandedDetailRow extends React.Component {
  constructor(props) {
    super(props);

    this.receiveTaskBtnClickHandler = this.receiveTaskBtnClickHandler.bind(this);
    this.confirmBtnClickHandler = this.confirmBtnClickHandler.bind(this);
    this.generateDownloadBtnClickHandler = this.generateDownloadBtnClickHandler.bind(this);

    this.state = {
      // 数据
      currentTaskId: undefined,
      detailData: {
        taskDetail:{
          'taskId': props.taskId || '12',
          'name': '@cname', 
          'gender': 2,
          'idcard': '@id',
          'part': '',
          'method': '@word',
          'time': '@date',
          'description': '@cparagraph',
          'age': 130,
        },
        operatorDetail: {
          'name': '操作员姓名',
          'tel': '@tel',
        },
        orgDetail: {
          name: 'ORG',
          tel: '@tel',
        },
        taskStage: 'receiving',
        // task_attachment_is_downloaded: false,
        // task_attachment_url: '',
        // task_report_url: '',
        // can_operator_confirm: false,
        taskOperation: {
          confirmedBy: 'organization',
          allowOperatorConfirm: false,
          receivingTime: 1539959905632,
          downloadingAttachmentTime: 1539959905632,
          uploadingReportTime: 1539959905632,
          confirmingTime: 1539959905632,
          taskAttachmentUrl: 'https://baidu.com',
          taskReportUrl: 'https://weibo.com',
        },
      },
      // UI
      dataLoading: false,
      uploadBtnFileList: [],
      uploadBtnLoading: false,
    };

    this.currentTaskId = this.props.taskId;

  }

  componentDidMount() {
    this.fetchDetailData({
      taskId: this.state.detailData.taskDetail.taskId,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.active == true) {
      if(this.state.currentTaskId != this.props.taskId) {
        this.fetchDetailData({ taskId: this.props.taskId });
      }
    } else if(this.props.active == false) {
      // Do Nothing
    }

    // let prevTaskId = prevProps.taskId;
    // let prevTaskIdInState = prevState.detailData.taskDetail.taskId;
    // let prevTaskIdInState = prevState.currentTaskId;
    // let newTaskId = this.props.taskId;
    // if(prevTaskIdInState !== newTaskId && this.props.active) {
    //   if(this.currentTaskId != newTaskId) {
    //     this.currentTaskId = newTaskId;
    //     this.fetchDetailData({ taskId: newTaskId });
    //   }
    // }
  }

  async fetchDetailData({ taskId }) {
    this.setState({
      dataLoading: true,
      // 这一行很重要，没有这一行会因为componentDidUpdate陷入循环
      // 本函数(fetchDetailData) 一开始就要设置 currentTaskId
      currentTaskId: taskId,
    });
    try {
      let { data } = await apier.fetch('taskDetail', { taskId });
      this.setState({
        detailData: data,
        dataLoading: false,
        currentTaskId: taskId,
      });
    } catch({ data, stat }) {
      Message.error('获取任务详情错误：' + stat.frimsg);
      this.setState({
        dataLoading: false,
        currentTaskId: taskId,
      });
    }
  }

  receiveTaskBtnClickHandler() {
    let taskId = this.props.taskId; // [TODO]
    Modal.confirm({
      title: '确实要领取此任务吗？',
      onOk: () => { //close => {
        return apier.fetch('receiveTask', { taskId })
        .then(() => {
          Message.success('此任务已被你领取');
          this.setState(prevState => {
            prevState.detailData.taskStage = 'processing';
            prevState.detailData.taskOperation.receivingTime = Date.now();
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

  confirmBtnClickHandler() {
    Modal.confirm({
      title: '确实要确认此任务吗？',
      content: '',
      onOk: async close => {
        try {
          await apier.fetch('confirmTask', {
            taskId: this.props.taskId, // [TODO]
          });
          this.setState(prevState => {
            prevState.detailData.taskOperation.confirmingTime = Date.now();
            prevState.detailData.taskStage = 'finished';
            return { detailData: { ...prevState.detailData }};
          });
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
  }

  generateDownloadBtnClickHandler(keyName, cover) {
    return () => {
      this.setState(prevState => {
        if(cover) {
          prevState.detailData.taskOperation[keyName] = Date.now();
        } else {
          let prev = prevState.detailData.taskOperation[keyName];
          prevState.detailData.taskOperation[keyName] = prev
          ? prev
          : Date.now();
        }
        return { detailData: { ...prevState.detailData }};
      });
    };
  }

  render() {
    let detailData = this.state.detailData;

    const identNameMap = {
      operator: '操作员',
      organization: '机构用户',
      administrator: '管理员',
    };

    const toggleStage = () => {
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
      // onChange: ({ file, fileList }) => {
      //   let checker = formRules.uploadFile.validator;
      //   checker([], fileList, errors => {
      //     if(errors.length) {
      //     } else {
      //       this.setState({
      //         uploadBtnFileList: fileList.length <= 1 ? fileList : [file],
      //       });
      //     }
      //   });
      // },
      beforeUpload: file => {
        let errors = formRules.uploadFile.syncValidator([], [file]);
        if(errors.length) {
          Modal.info({
            title: '选择的文件不符合规范',
            content: errors.map(e => e.message).join('. \n'),
          });
          this.setState({ uploadBtnFileList: [] });
          return false;
        } else {
          this.setState({
            uploadBtnFileList: [file],
          });
        }

        if(this.state.detailData.task_report_url) {
          return new Promise((resolve, reject) => {
            Modal.confirm({
              title: '之前上传的文件会被覆盖',
              content: '确定继续上传吗？',
              okText: '继续上传',
              onOk: close => {
                this.setState({ uploadBtnFileList: [file] });
                close();
                resolve();
              },
              onCancel: close => {
                this.setState({ uploadBtnFileList: [] });
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
        // Request
        try {
          let { data } = await apier.fetch('uploadTaskReport', {
            ...uploadData,
            file: file,
          });
          this.setState(prevState => ({
            detailData: {
              ...prevState.detailData,
              taskOperation: {
                ...prevState.detailData.taskOperation,
                uploadingReportTime: Date.now(),
                taskReportUrl: data.task_report_url,
                allowOperatorConfirm: data.canOperatorConfirm || false,                
              },
              taskStage: 'confirming',
            },
            uploadBtnLoading: false,
          }));
          this.generateDownloadBtnClickHandler('uploadingReportTime', false)();
          onSuccess();
        } catch({ stat }) {
          onError();
          this.setState({ uploadBtnLoading: false });
        }
      },
    };

    const formatTimestamp = t => moment(new Date(t)).format('YYYY/MM/DD hh:mm');

    return (
      <Spin spinning={this.state.dataLoading}>
        <div styleName="box-wrap">
          <Row gutter={12} styleName="section-wrap">
            <Col span={7}>
              <p styleName="section_title">
                基本信息
                <small style={{color: 'transparent'}}>{this.props.taskId}</small>
              </p>
              <table styleName="section_table">
                <tbody>
                  <tr>
                    <th>姓名</th>
                    <td>{detailData.taskDetail.name}</td>
                  </tr>
                  <tr>
                    <th>性别 / 年龄</th>
                    <td>
                      {['男','女'][detailData.taskDetail.gender]}
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
                    <th>测量内容</th>
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
              let currentStepIndex = computeCurrentStepIndex(detailData.taskStage);
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
                ? <Tooltip title={
                    detailData.taskOperation.receivingTime
                    ? `领取于 ${formatTimestamp(detailData.taskOperation.receivingTime)}`
                    : undefined
                  }>
                    ✔操作员已领取
                  </Tooltip>
                : <>
                    ⚠此任务尚未领取 <br />
                    {info.ident == 'operator' && 
                    <Button size="small" onClick={this.receiveTaskBtnClickHandler}>领取任务</Button>}
                  </>}
                </DsSteps.DsStep>

                <DsSteps.DsStep
                  title={currentStepIndex > 3
                    ? ('处理用时 '
                      + moment(
                          detailData.taskOperation.uploadingReportTime
                          - detailData.taskOperation.receivingTime
                        ).format('hh时mm分')
                      )
                    : '处理中'
                  }
                  styleName="upload-file-step-block"
                >
                {currentStepIndex < 3
                ? '未开始'
                : <>
                    {detailData.taskOperation.downloadingAttachmentTime <= 0
                    ? '⚠操作员尚未下载附件'
                    : <Tooltip title={
                        detailData.taskOperation.downloadingAttachmentTime
                        ? `下载于 ${formatTimestamp(detailData.taskOperation.downloadingAttachmentTime)}`
                        : undefined
                      }>
                        ✔操作员已下载附件
                      </Tooltip>}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      href={`${detailData.taskOperation.taskAttachmentUrl}?task_id=${this.props.taskId}`}
                      onClick={this.generateDownloadBtnClickHandler('downloadingAttachmentTime', false)}
                    >
                      &nbsp;<Icon type="download" />
                    </a>
                    <br />

                    {detailData.taskOperation.uploadingReportTime <= 0
                    ? '⚠操作员尚未上传报告'
                    : <Tooltip title={
                        detailData.taskOperation.uploadingReportTime
                        ? `上传于 ${formatTimestamp(detailData.taskOperation.uploadingReportTime)}`
                        : undefined
                      }>
                        ✔操作员已上传报告
                      </Tooltip>}
                    {info.ident == 'operator' && currentStepIndex < 5 &&
                    <>
                      <Upload
                        {...uploadBtnProps}
                        data={{ taskId: this.props.taskId }}
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
                    </>}
                  </>}
                  <br />
                  <Popover content={
                    <>
                      {(info.ident == 'organization' || info.ident == 'administrator') &&
                      <>
                        操作员：<br />
                        {detailData.operatorDetail.name}<br />
                        {detailData.operatorDetail.tel}<br />
                        <br />
                      </>}
                      {(info.ident == 'operator' || info.ident == 'administrator') &&
                      <>
                        机构用户：<br />
                        {detailData.orgDetail.name}<br />
                        {detailData.orgDetail.tel}<br />
                        <br />
                      </>}
                    </>
                  }>
                    <a>📞联系方式</a>
                  </Popover>
                </DsSteps.DsStep>

                <DsSteps.DsStep title="待确认">
                  {detailData.taskOperation.taskReportUrl && 
                   detailData.taskOperation.taskReportUrl !== true &&
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    href={`${detailData.taskOperation.taskReportUrl}?task_id=${this.props.taskId}`}
                  >
                    点击下载报告&nbsp;<Icon type="download" />
                  </a>}

                  <br />
                  {currentStepIndex > 4
                  ? <Tooltip title={
                      detailData.taskOperation.confirmingTime
                      ? `确认于 ${formatTimestamp(detailData.taskOperation.confirmingTime)}`
                      : undefined
                    }>
                      ✔此任务已被{identNameMap[detailData.taskOperation.confirmedBy]}确认
                    </Tooltip>
                  : currentStepIndex == 4
                  ? <>
                    {(info.ident == 'operator' && detailData.taskOperation.allowOperatorConfirm
                    || info.ident == 'organization' || info.ident == 'administrator') &&
                      <Button size="small" onClick={this.confirmBtnClickHandler}>点击确认</Button>}
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


const FormSubmitDownload = function (props) {
  let jsonStr = JSON.stringify({ ...props.params, stupidTrash: '=' });
  let separatorIndex = jsonStr.lastIndexOf('=');

  return (
    <form method="post" encType="text/plain" action={props.url}>
      <input type="hidden"
        name={jsonStr.substr(0, separatorIndex)}
        value={jsonStr.substr(separatorIndex + 1)}
      />
      <button type="submit">
        {props.children}
      </button>
    </form>
  );
};

FormSubmitDownload.propTypes = {
  params: PropTypes.object,
};


export default ExpandedDetailRow;
export { ExpandedDetailRow };
