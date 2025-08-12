import React from 'react';
import TestRef from './test-ref/TestRef';
import TestStateCallback from './test-state/TestStateCallback';
import Goods from './test-state/Goods';
import App from './test-element';
import TestTextElement from './test-element/TestTextElement';
import TestNormalDiff from './test-diff';

const DEFAULT_DESC = '注意查看控制台的日志输出';

const Components = {
  'test-element': {
    component: App,
    title: '测试 JSX VNode 是否可以正常解析',
    props: {
      msg: 'hello react',
    },
  },
  'test-ref': {
    component: TestRef,
  },
  'test-state-callback': {
    component: TestStateCallback,
    desc: '点击按钮查看控制台的回调是否按照顺序执行了！',
  },
  'test-normal-state': {
    component: Goods,
    props: {
      name: '苹果',
    },
  },
  'test-text-element': {
    component: TestTextElement,
  },
  'test-normal-diff': {
    component: TestNormalDiff,
  },
};

function Example(props) {
  const { componentName } = props;

  if (!Object.prototype.hasOwnProperty.call(Components, componentName)) {
    console.warn(`Component ${componentName} not found`);
    return null;
  }

  const {
    component: Component,
    props: ComponentProps,
    title = componentName,
    desc = DEFAULT_DESC,
  } = Components[componentName];

  if (!Component) {
    // 组件不能空
    console.warn(`Component ${componentName} not found`);
    return null;
  }

  return (
    <div>
      <h1>当前测试项: {title}</h1>
      <p style={{ color: 'red' }}>{desc}</p>
      <hr />
      <div style={{ border: 'solid 1px #ccc', padding: '16px' }}>
        <Component {...ComponentProps} />
      </div>
    </div>
  );
}

export default Example;
