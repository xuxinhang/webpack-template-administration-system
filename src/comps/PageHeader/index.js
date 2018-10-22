import React from 'react';
import './PageHeader.md.sass';

export function PageHeader(props) {
  return (
    <div styleName="page-header">
      {props.title && <div styleName="page-title">{props.title}</div>}
      {props.children}
    </div>
  );
}
