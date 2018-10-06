import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';

const StatusModal = function(props) {
  // console .log(props);
  const vaccantButtonStyles = {
    // 'appearance': 'none',
    background: 'none',
    border: 'none',
  }
  //
  return (
    <Modal
      {...props}
      footer={
        <>
          <button style={vaccantButtonStyles}>{props.statusTip}</button>
          <Button
            onClick={props.onCancel || undefined }
            {...(props.cancelButtonProps || {})}
          >
            {props.cancelText || '取消'}
          </Button>
          <Button
            type={props.okType || 'primary'}
            onClick={props.onOk || undefined}
            {...(props.okButtonProps || {})}
          >
            {props.okText || '确定'}
          </Button>
        </>
      }
    />
  );
}

export { StatusModal };

      /*footer={
        <>
          <div>{props.statusTip}</div>
          <Button
            onClick={props.onCancel}
            {...(props.cancelButtonProps && {})}
          >
            {props.cancelText}
          </Button>
          <Button
            okType={props.okType} onClick={props.onOk}
            {...(props.okButtonProps && {})}
          >
            {props.okText}
          </Button>
        </>
      }*/
