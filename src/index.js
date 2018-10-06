import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './styles/global.css';
import './styles/common.sass';

import MainWrapped from './WithHotLoaderMain';
// import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<MainWrapped />, document.getElementById('root'));
// registerServiceWorker();


