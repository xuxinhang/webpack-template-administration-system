import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';

class StagedModal extends React.Component {
  constructor(props) {
    super(props);

    this.commonDefaultProps = {
      okType: 'primary',
      okText: '确定',
      cancelText: '取消',
    };

    this.defaultProps = {
      waiting: {  },
      loading: {
        okText: '加载中',
        okButtonProps: { loading: true },
        cancelButtonProps: { disabled: true },
        maskClosable: false,
      },
      success: {
        // okButtonProps: {  }
      },
      error: {

      }
    };

  }

  render() {
    let stage = this.props.stage;
    let mp = {
      ...(this.commonDefaultProps),           // 以下缺省 props
      ...(this.defaultProps[stage] && {}),
      ...(this.props.baseProps && {}), // 以下传入的 props
      ...(this.props.stageProps[stage] && {}),
    };

    return (
      <Modal
        {...mp}
        footer={
          <>
            <div>{mp.statusTip}</div>
            <Button
              onClick={mp.onCancel}
              {...(mp.cancelButtonProps && {})}
            >
              {mp.cancelText}
            </Button>
            <Button
              okType={mp.okType} onClick={mp.onOk}
              {...(mp.okButtonProps && {})}
            >
              {mp.okText}
            </Button>
          </>
        }
      />
    );
  }
}

StagedModal.propTypes = {
  baseProps: PropTypes.object,
  stageProps: PropTypes.objectOf(PropTypes.object),
};

export { StagedModal };

