import React from 'react';
import './DsSteps.sass';

const innerDefaultIcons = {
  wait: ' ',
  finished: '✔',
  process: '⏳',
};

const computeDefaultStepType = (ind, cur) => {
  if(ind < cur) return 'finished';
  else if(ind == cur) return 'process';
  else if(ind > cur) return 'wait';
};

function DsSteps(props) {

  const filteredChildren = React.Children.toArray(props.children).filter(c => !!c);
  let { className: classString, ...restProps } = props;
  let stepIndexStart = 1;
  // let totalStepNumber = filteredChildren.length || 1;
  let currentStepIndex = +props.current;

  return (
    <div
      className={'ds-step-bar ' + classString}
      {...restProps}
    >
    {React.Children.map(filteredChildren, (child, index) => {
      let stepIndex = stepIndexStart + index;
      // Compute Default Step Type
      let childStepType = child.props.type
                          || computeDefaultStepType(stepIndex, currentStepIndex);
      let iconSets = {...innerDefaultIcons, ...props.icons};
      let childProps = {
        type: childStepType,
        icon: iconSets[childStepType],
        ...child.props,
        stepIndex,
      };
      return React.cloneElement(child, childProps);
    })}
    </div>
  );
}

function DsStep(props) {
  let classPrefix = 'ds-step-bar_indicator';
  return (
    <div className={'ds-step-bar_block ' + props.className}>
      <div
        className={`${classPrefix} ${classPrefix}--${props.type}`}
      >
        <span>
          {props.icon || innerDefaultIcons[props.type]}
        </span>
      </div>
      <div className="ds-step-bar_title">{props.title}</div>
      <div className="ds-step-bar_content">{props.children}</div>
    </div>
  );
}

DsSteps.DsStep = DsStep;
export default DsSteps;


