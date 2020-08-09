import * as React from 'react';
import { render } from 'react-dom';

import './styles/main.css';

class App extends React.PureComponent<{}, {}>{
    render(){
        return <h1>SIMON</h1>;
    }
}

render(<App />, document.getElementById('simon-game'));