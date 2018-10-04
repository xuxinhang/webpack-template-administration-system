import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './styles/global.css';
import './styles/common.sass';

// import App from './App';
import Main from './Main';
// import registerServiceWorker from './registerServiceWorker';

let MainWrapped;

// react-hot-loader
if(process.env.NODE_ENV == 'development') {
  const { hot } = require('react-hot-loader');
  MainWrapped = hot(module)(Main);
} else {
  MainWrapped = Main;
}

ReactDOM.render(<MainWrapped />, document.getElementById('root'));
// registerServiceWorker();


