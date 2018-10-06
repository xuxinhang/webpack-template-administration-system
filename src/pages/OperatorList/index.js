import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Input, Button, Modal, Message } from 'antd';
const { Column } = Table;
import { PageHeader } from '@/comps/PageHeader';
import { StatusModal } from '@/comps/StatusModal';
import apier from '@/utils/apier.js';

import './OperatorList.md.css';

class OperatorList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formState: 0,
      formTip: ['', ''],
      listData: [{
        'operator_id': 16,
        'num': 16,
        'name': '@cname',
        'created_time': '@date',
        'tel': '13853321909',
        'password': '@word',
        'task_statistics': {
          'received': 0,
          'processing': 0,
          'confirming': 0,
          'finished': 0,
        },
        'frozen': 1,
      }],
      pageSize: 10,
      currentPage: 1,
      totalRecord: 100,
      tableLoading: false,
      // Staged Modal
      freezeModalProps: {
        visible: false,
      },
    };

    this.freezeBtnClickHandler = this.freezeBtnClickHandler.bind(this);
  }

  fetchListData(fedData) {
    // Prepare loading icon
    this.setState({ tableLoading: true });
    // Launch network request
    apier.fetch('listOperators', fedData)
    .then(({data, stat}) => {
      this.setState({
        listData: data.list,
        totalRecord: data.pageInfo.totalRecord,
      });
    })
    .catch(({data, stat}) => {
      Message.warning(<>发生错误:<br />{stat.frimsg}</>);
    })
    .finally(() => {
      this.setState({ tableLoading: false });
    })
  }

  freezeBtnClickHandler(e) {
    let updateState = newState => this.setState({ freezeModalProps: newState });
    let { recordId, recordName, action, rowIndex } = e.target.dataset;
    let commonProps = {
      title: `你是要将操作员“${recordName}”${[,'解冻','冻结'][action]}吗?`,
      children: [,'账号将可正常使用','他将无法登录系统并进行操作'][action],
      visible: true,
      closable: false,
    };

    let freezeModalInit = () => updateState({
      ...commonProps,
      onOk: freezeModalSubmit,
      onCancel: freezeModalClose,
    });

    let freezeModalClose = () => updateState({ ...commonProps, visible: false });

    let freezeModalSubmit = () => {
      // show loading icon
      updateState({
        ...commonProps,
        okButtonProps: { loading: true },
        cancelButtonProps: { disabled: true },
        maskClosable: false,
      });
      // network request
      apier.fetch('freezeOperator', {
        operator_id: recordId,
        action: action, // 2 = 冻结
      })
      .then(() => {
        Message.success('此用户的冻结状态已更改');
        freezeModalClose();
        this.setState(state => {
          state.listData[rowIndex].frozen = action;
          return { listData: state.listData };
        });
      })
      .catch(({stat}) => {
        updateState({
          ...commonProps,
          statusTip: <span style={{color: 'red'}}>遇到错误：{stat.frimsg}</span>,
          onOk: freezeModalSubmit,
          onCancel: freezeModalClose,
        });
      });
    }

    freezeModalInit();
  }

  componentDidMount() {
    this.fetchListData({
      pagination: {
        pageNumber: this.state.currentPage,
        pageSize: this.state.pageSize,
      },      
    });
  }

  render() {
    const taskStatisticsColumnRender = (text, record) => {
      let val = record.task_statistics;
      return `${val.received} / ${val.processing} / ${val.confirming} / ${val.finished}`;
    }

    /* const freezeBtnClickHandler = e => {
      let el = e.target;
      let mo = Modal.confirm({
        title: `你是要将操作员"${el.dataset.recordName}"冻结吗?`,
        content: '他将无法登录系统并进行操作',
        okButtonProps: { disabled: true },
      });
      return;
      mo.update({
        onOk: close => {
          mo.update({
            cancelButtonProps: { disabled: true },
            okButtonProps: { loading:  true },
          });
          apier.fetch('freezeOperator', {
            operator_id: el.dataset.recordId,
            action: 2, // = 冻结
          })
          .then(() => close())
          .catch(({stat}) => mo.update({
            content: '遇到错误:' + stat.frimsg,
          }))
          .finally(() => {
            mo.update({
              cancelButtonProps: { disabled: false },
              okButtonProps: { loading:  false },
              okText: '重试',
            });
          });
        },
      });
    } */

    const onPaginationChange = (currentPage, pageSize) => {
      this.setState({ currentPage, pageSize });
      this.fetchListData({
        pagination: { pageNumber: currentPage, pageSize },
      });
    }

    const paginationProps = {
      current: this.state.currentPage,
      pageSize: this.state.pageSize,
      showQuickJumper: true,
      showSizeChanger: true,
      total: this.state.totalRecord,
      onChange: onPaginationChange,
      onShowSizeChange: onPaginationChange,
    }

    return (
      <>
        <PageHeader title="新建操作员账号">
          <Link to="/admin/addOperator">
            <Button className="button--deep-gray-primary" size="small" type="primary">
              新建操作员账号
            </Button>
          </Link>
        </PageHeader>
        <Table
          styleName="ds-ant-table-wrapper"
          dataSource={this.state.listData}
          rowClassName="ds-table-row"
          rowKey="operator_id"
          size="small"
          pagination={paginationProps}
          loading={this.state.tableLoading}
        >
          <Column title="编号" dataIndex="num" align="right" width={60}/>
          <Column title="姓名" dataIndex="name" />
          <Column title="创建时间" dataIndex="created_time" />
          <Column title="账号" dataIndex="tel" />
          <Column title="密码" dataIndex="password" />
          <Column
            title="领取数/处理中/待确认/已完结"
            key="taskStatistics"
            render={taskStatisticsColumnRender}
          />
          <Column title="操作" key="op" align="right"
            className="ds-table-last-column"
            render={(text, record, index) => (
              <>
                <Button
                  size="small" ghost
                  type={[,'danger','primary'][record.frozen]}
                  data-record-id={record.operator_id}
                  data-record-name={record.name}
                  data-action={[,2,1][record.frozen]}
                  data-row-index={index}
                  onClick={this.freezeBtnClickHandler}
                  children={[,'冻结账号', '解冻账号'][record.frozen]}
                />
              </>  
            )}
          />
        </Table>
        {/* For 冻结账户功能 */}
        <StatusModal {...this.state.freezeModalProps} />
      </>
    );
  }
}


export { OperatorList };

