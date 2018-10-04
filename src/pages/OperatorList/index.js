import React from 'react';
import { Table, Input, Button, Modal, Message } from 'antd';
const { Column } = Table;
import { PageHeader } from '@/comps/PageHeader';
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
    };

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

  // freezeBtnClickGenerator(freezeTarget) {
  //   return e => {
  //     
  //   }
  // }

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

    const freezeBtnClickHandler = e => {
      let el = e.target;
      let mo = Modal.confirm({
        title: `你是要将操作员"${el.dataset.recordName}"冻结吗?`,
        content: '他将无法登录系统并进行操作',
        okText: 'hha',
        okButtonProps: { disabled: true },
        confirmLoading: true,
      });
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
    }

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
          <Button size="small" type="primary">新建操作员账号</Button>
        </PageHeader>
        <Table
          styleName="ds-ant-table-wrapper"
          dataSource={this.state.listData}
          rowClassName="ds-table-row"
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
            render={(text, record) => (
              <>{[0, 
                <Button
                  size="small" ghost type="danger"
                  data-record-id={record.operator_id}
                  data-record-name={record.name}
                  onClick={freezeBtnClickHandler}
                  children="冻结账号"
                ></Button>,
                <Button size="small" ghost type="primary">解冻账号</Button>][+record.frozen]}
              </>  
            )}
          />
        </Table>
      </>
    );
  }
}


export { OperatorList };

