import React from 'react';
import { PageHeader } from '@/comps/PageHeader';
import { Table, Button, Icon, Message } from 'antd';
const { Column } = Table;
import { ExpandedDetailRow } from './ExpandedDetailRow';
import apier from '@/utils/apier';
// import bindThis from '@/utils/bind-this-decorator';

import _ from 'lodash';

import './TaskManage.md.sass';


class TaskManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 过滤条件
      taskListFilters: { ...props.defaultFilters },
      // UI
      tableLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalRecord: 10,
      // 数据
      tableData: [/* {
        'taskId': 16,
        'num': 16,
        'name': '@cname',
        'gender': 1,
        'createdTime': '@date',
        'orgName': '@cname',
        'operatorName': '@cname',
        'orgBelong': '法医中心',
        'part': '腹部',
        'taskStage': 'receiving',
      } */],
      tableExpandedRowKeys: [],
    };

    this.paginationChangeHandler = this.paginationChangeHandler.bind(this);

  }

  paginationChangeHandler(currentPage, pageSize) {
    this.setState({ currentPage, pageSize });
    this.fetchListData({
      pagination: { pageNumber: currentPage, pageSize },
    });
  }

  fetchListData({ pagination }) {
    this.setState({ tableLoading: true });
    // 计算过滤器的取值 more in furture
    let filters = {
      taskStage: this.state.taskListFilters.taskStage,
    };

    apier.fetch('listTasks', { pagination, filters })
    .then(({ data }) => {
      this.setState({
        tableData: data.list,
        totalRecord: data.pageInfo.totalRecord,
      });
    })
    .catch(({ stat }) => {
      Message.warn('获取数据出错：' + stat.frimsg);
    })
    .finally(() => {
      this.setState({ tableLoading: false });
    });
  }

  componentDidMount() {
    this.paginationChangeHandler(1, 10);
  }

  componentDidUpdate(prevProps) {
    // [NOTICE] 千万不要比较对象是否相等
    if(!_.isEqual(prevProps.defaultFilters, this.props.defaultFilters)) {
      this.setState({
        taskListFilters: {...this.props.defaultFilters},
      }, () => { // Run after states having been updated
        this.paginationChangeHandler(1, 10);
      });
    }
  }


  render() {
    const genderMap = { male: '男', female: '女', 0: '男', 1: '女' };
    const taskStageMap = {
      'receiving': '待领取',
      'processing': '处理中',
      'confirming': '待确认',
      'finished': '已完结',
    };

    const toggleExpandClickHandler = e => {
      let ds = e.target.dataset;
      toggleExpandedRow(ds.key, ds.index, ds.tar);
    };

    const toggleExpandedRow = (key, index, tar) => {
      this.setState(state => {
        let tkeys = state.tableExpandedRowKeys;
        let opind = tkeys.indexOf(key);
        if(opind === -1 && tar !== false) {
          tkeys.push(key);
        } else if(opind !== -1 && tar !== true) {
          tkeys.splice(opind, 1);
        }
        return { tableExpandedRowKeys: tkeys };
      });
    };

    const tableExpandedRowRender = (record, index, indent, expanded) => {
      return (
        <ExpandedDetailRow active={expanded} taskId={record.taskId} />
      );
    };

    return (
      <>
        <PageHeader title="任务管理"></PageHeader>
        {/* <ExpandedDetailRow /> */}
        <Table
          className="ds-ant-table-wrapper"
          styleName="table-task-list"
          dataSource={this.state.tableData}
          rowClassName="ds-table-row"
          rowKey="taskId"
          size="small"
          pagination={{
            current: this.state.currentPage,
            pageSize: this.state.pageSize,
            total: this.state.totalRecord,
            onChange: this.paginationChangeHandler,
            onShowSizeChange: this.paginationChangeHandler,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          loading={this.state.tableLoading}
          expandedRowRender={tableExpandedRowRender}
          expandIconAsCell={false}
          expandIconColumnIndex={9}
          expandedRowClassName={() => 'ds-table-expanded-row'}
        >
          {/**/}
          <Column title="编号" dataIndex="num" align="right" width={60}/>
          <Column title="姓名" dataIndex="name" />
          <Column title="性别" dataIndex="gender" render={text => genderMap[text] || ''} />
          <Column title="创建时间" dataIndex="createdTime" />
          <Column title="机构客户" dataIndex="orgName" />
          <Column title="上传机构" dataIndex="orgBelong" />
          <Column title="操作员" dataIndex="operatorName" />
          <Column title="测量部位" dataIndex="part" />
          <Column title="任务状态" dataIndex="taskStage" render={text => taskStageMap[text] || ''} />
          <Column title="操作" key="op" align="right"
            render={(text, record, index) => (
              <>
                {/*this.state.tableExpandedRowKeys.includes(record.taskId)
                  ? <Button size="small"
                      data-key={record.taskId}
                      data-index={index}
                      data-tar={false}
                    >
                      收起
                    </Button>
                  : <Button size="small"
                      data-key={record.taskId}
                      data-index={index}
                      data-tar={true}
                    >
                      查看更多
                    </Button>
                */}
              </>  
            )}
          />
        </Table>
      </>
    ); // () => toggleExpandedRow(record.taskId, index, false)
  }

}


export default TaskManage; 
export { TaskManage };
