import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Message } from 'antd';
const { Column } = Table;
import { PageHeader } from '@/comps/PageHeader';
import { StatusModal } from '@/comps/StatusModal';
import apier from '@/utils/apier.js';

import './OrganizationList.md.css';

class OrganizationList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formState: 0,
      formTip: ['', ''],
      listData: [/* {
        'orgId': 9,
        'num': 9,
        'name': '@cname',
        'createdTime': '@date',
        'tel': '13853321909',
        'password': '@word',
        'belong': '法医中心',
        'email': 'we@we.com',
        'taskNumber': 0,
        'frozen': 1,
      } */],
      pageSize: 10,
      currentPage: 1,
      totalRecord: 100,
      tableLoading: false,
      // Staged Modal
      freezeModalProps: { visible: false },
    };

    this.freezeBtnClickHandler = this.freezeBtnClickHandler.bind(this);
  }

  fetchListData(fedData) {
    // Prepare loading icon
    this.setState({ tableLoading: true });
    // Launch network request
    apier.fetch('listOrganizations', fedData)
    .then(({data}) => {
      this.setState({
        listData: data.list,
        totalRecord: data.pageInfo.totalRecord,
      });
    })
    .catch(({stat}) => {
      Message.warning(<>发生错误:<br />{stat.frimsg}</>);
    })
    .finally(() => {
      this.setState({ tableLoading: false });
    });
  }

  freezeBtnClickHandler(e) {
    let updateState = newState => this.setState({ freezeModalProps: newState });
    let { recordId, recordName, action, rowIndex } = e.target.dataset;
    let commonProps = {
      title: `你是要将机构账户“${recordName}”${['','解冻','冻结'][action]}吗?`,
      children: ['','账号将可正常使用','他将无法登录系统并进行操作'][action],
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
      apier.fetch('freezeOrganization', {
        orgId: recordId,
        action: action, // 2 = 冻结
      })
      .then(() => {
        Message.success('此账户的冻结状态已更改');
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
    };

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
    // const taskStatisticsColumnRender = (text, record) => {
    //   let val = record.task_statistics;
    //   return `${val.received} / ${val.processing} / ${val.confirming} / ${val.finished}`;
    // };

    const onPaginationChange = (currentPage, pageSize) => {
      this.setState({ currentPage, pageSize });
      this.fetchListData({
        pagination: { pageNumber: currentPage, pageSize },
      });
    };

    const paginationProps = {
      current: this.state.currentPage,
      pageSize: this.state.pageSize,
      showQuickJumper: true,
      showSizeChanger: true,
      total: this.state.totalRecord,
      onChange: onPaginationChange,
      onShowSizeChange: onPaginationChange,
    };

    return (
      <>
        <PageHeader title="机构客户账号管理">
          <Link to="/admin/addOrganization">
            <Button className="button--deep-gray-primary" size="small" type="primary">
              新建机构客户账号
            </Button>
          </Link>
        </PageHeader>
        <Table
          styleName="ds-ant-table-wrapper"
          dataSource={this.state.listData}
          rowClassName="ds-table-row"
          rowKey="orgId"
          size="small"
          pagination={paginationProps}
          loading={this.state.tableLoading}
        >
          <Column title="编号" dataIndex="num" align="right" width={56}/>
          <Column title="姓名" dataIndex="name" />
          <Column title="创建时间" dataIndex="createdTime" />
          <Column title="账号" dataIndex="tel" />
          <Column title="密码" dataIndex="password" />
          <Column title="来自机构" dataIndex="belong" />
          <Column title="邮箱" dataIndex="email" />
          <Column title="任务数" dataIndex="taskNumber" />
          <Column title="操作" key="op" align="right"
            className="ds-table-last-column"
            render={(text, record, index) => (
              <>
                <Button
                  size="small" ghost
                  type={['','danger','primary'][record.frozen]}
                  data-record-id={record.orgId}
                  data-record-name={record.name}
                  data-action={[0,2,1][record.frozen]}
                  data-row-index={index}
                  onClick={this.freezeBtnClickHandler}
                >
                  {['','冻结账号', '解冻账号'][record.frozen]}
                </Button>
              </>  
            )}
          />
        </Table>
        {/* 冻结账户功能 */}
        <StatusModal {...this.state.freezeModalProps} />
      </>
    );
  }
}


export default OrganizationList;
export { OrganizationList };

