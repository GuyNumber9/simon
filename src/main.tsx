import * as React from 'react';
import { render } from 'react-dom';

import Sound from './Sound';

import './styles/main.css';

enum Color {
    RED = "R",
    GREEN = "G",
    BLUE = "B",
    YELLOW = "Y"
}

const Notes = {
    "R": 252,
    "G": 209,
    "B": 415,
    "Y": 310
};

interface ISimonState {
    round: number,
    sequence: Color[],
    playerIndex: number,
    started: boolean,
    playerTurn: boolean,
    timeFactor: number,
    btnUpHandlers: {
        R: () => void,
        G: () => void,
        B: () => void,
        Y: () => void
    }
}

const initialState: ISimonState = {
    round: 0,
    sequence: [],
    playerIndex: 0,
    started: false,
    playerTurn: false,
    timeFactor: 1,
    btnUpHandlers: {
        R: () => {},
        G: () => {},
        B: () => {},
        Y: () => {}
    }
}

class App extends React.PureComponent<{}, ISimonState>{
    constructor(props: Readonly<{}>){
        super(props);

        this.state = {
            ...initialState
        }

        // setup refs
        this.colorRefs = {};
        this.colorRefs[Color.RED] = React.createRef();
        this.colorRefs[Color.GREEN] = React.createRef();
        this.colorRefs[Color.BLUE] = React.createRef();
        this.colorRefs[Color.YELLOW] = React.createRef();


        // setup audio
        this.sound = new Sound();
    }

    colorRefs: any;
    sound: Sound;

    start(){
        this.setState({
            started: true,
            round: 1
        });
    }

    reset(){
        this.sound.context.close();
        this.sound = new Sound();

        this.setState({
            ...initialState,
            started: true,
            round: 1,
            sequence: []
        });
    }

    getNextColor(): Color {
        let values: Color[] = Object.values(Color) as Color[];
        let rand = Math.floor(Math.random()*values.length);
        return values[rand];
    }

    inputSequence(color: Color){
        if(this.state.started && this.state.playerTurn){
            if(this.state.sequence[this.state.playerIndex] === color){
                if(this.state.sequence.length - 1 === this.state.playerIndex){
                    this.setState({
                        playerIndex: 0,
                        playerTurn: false,
                        round: this.state.round + 1
                    });
                }
                else {
                    this.setState({
                        playerIndex: this.state.playerIndex + 1
                    });
                }
            }
            else {
                // game over
                // play losing sound and reset state
                this.sound.play(176);
                setTimeout(() => {
                    this.sound.context.close();
                    this.sound = new Sound();

                    this.setState({
                        ...initialState
                    });
                }, 1500);
                
            }
        }
        
    }

    playSequence(colors: Array<Color>, timeFactor: number){

        let p = new Promise((resolve, reject) => {

            let animate = (index: number) => {
                let p = new Promise((resolve, reject) => {
                    // if the game was reset then abort the animation
                    if(this.state.round < colors.length){
                        reject();
                    }
                    else {
                        if(index < colors.length){
                            let color = colors[index];
                            this.colorRefs[color].current.className = this.colorRefs[color].current.className + " active";
                            let stop = this.sound.play(Notes[color]);
    
                            setTimeout(() => {
                                this.colorRefs[color].current.className = this.colorRefs[color].current.className.split(' ').filter((className:string) => className != 'active').join(' ');
                                stop();
                                setTimeout(() => {
                                    animate(index+1).then(() => resolve(), () => reject());
                                }, 200);
                            }, timeFactor*1000);
                        }
                        else {
                            resolve();
                        }
                    }
                    
                });

                return p;
            }

            animate(0).then(() => resolve(), () => {
                console.log('animate rejected');
                reject();
            });
        });

        return p; 
    }

    componentDidUpdate(){
        if(this.state.started && !this.state.playerTurn){
            // first, get the next color
            let next = this.getNextColor();
            console.log(`next turn: ${next}`);
            // play the sequence with the next color
            let sequencePromise = this.playSequence([...this.state.sequence, next], this.state.timeFactor);
            sequencePromise.then(() => {
                // update the state
                this.setState({
                    sequence: [...this.state.sequence, next],
                    playerTurn: true,
                    timeFactor: this.state.timeFactor > 0.2 ? this.state.timeFactor - 0.1 : this.state.timeFactor
                });
            }, () => {
                // play sequence aborted due to game reset
            });
        }
    }

    simonButtonDown(color: Color){
        if(this.state.started && this.state.playerTurn){
            this.colorRefs[color].current.className = this.colorRefs[color].current.className + " active";
            let stop = this.sound.play(Notes[color]);
            let newState = {
                btnUpHandlers: {
                    ...this.state.btnUpHandlers
                }
            }
            newState.btnUpHandlers[color] = () => {
                stop();
                this.colorRefs[color].current.className = this.colorRefs[color].current.className.split(' ').filter((className:string) => className != 'active').join(' ');
                
                setTimeout(() => this.inputSequence(color), 500);
            }
            this.setState(newState); 
        }
        
    }

    componentWillUnmount(){
        this.sound.context.close();
    }

    render(){
        return (<div className="simon">
          <div className="simon-buttons">
            <div className="simon-btn red" ref={this.colorRefs[Color.RED]} onPointerDown={() => this.simonButtonDown(Color.RED)} onPointerUp={() => this.state.btnUpHandlers[Color.RED]()}>
            </div>
            <div className="simon-btn blue" ref={this.colorRefs[Color.BLUE]} onPointerDown={() => this.simonButtonDown(Color.BLUE)} onPointerUp={() => this.state.btnUpHandlers[Color.BLUE]()}>
            </div>
            <div className="simon-btn yellow" ref={this.colorRefs[Color.YELLOW]} onPointerDown={() => this.simonButtonDown(Color.YELLOW)} onPointerUp={() => this.state.btnUpHandlers[Color.YELLOW]()}>
            </div>
            <div className="simon-btn green" ref={this.colorRefs[Color.GREEN]}  onPointerDown={() => this.simonButtonDown(Color.GREEN)} onPointerUp={() => this.state.btnUpHandlers[Color.GREEN]()}>
            </div>
          </div>
          <div className="simon-controls">
            <h1>Simon</h1>
            <div className="simon-round">{(this.state.round+'').padStart(2, '0')}</div>
            {!this.state.started && <button onClick={() => this.start()}>Start</button>}
            {this.state.started && <button onClick={() => this.reset()}>Reset</button>}
          </div>
        </div>);
    }
}

interface ISimonButtonProps {
    isActive: boolean,
    buttonClick: () => void,
    frequency: number
}

interface ISimonButtonState {
    audioGain: GainNode,
    oscillator: OscillatorNode
}

class SimonButton extends React.Component<ISimonButtonProps, ISimonButtonState> {
    constructor(props: ISimonButtonProps){
        super(props);

        this.state = {} as ISimonButtonState;

        this.audioctx = new AudioContext();
    }

    audioctx: AudioContext

    handleBtnDown(){
        

    }

    handleBtnUp(){
        
    }

    componentWillReceiveProps(props: ISimonButtonProps){
        if(props.isActive){
            let o = this.audioctx.createOscillator();
            o.frequency.value = this.props.frequency;

            let g = this.audioctx.createGain();
            g.gain.value = 0.25;

            o.connect(g);
            g.connect(this.audioctx.destination);

            o.start(0);

            this.setState({
                oscillator: o,
                audioGain: g
            });
        }
        else {
            if(this.state.audioGain && this.state.oscillator) {
                this.state.audioGain.gain.setValueAtTime(this.state.audioGain.gain.value, this.audioctx.currentTime);
                this.state.audioGain.gain.exponentialRampToValueAtTime(0.0001, this.audioctx.currentTime + 0.04);
            }
        }
    }

    componentWillUnmount(){
        this.audioctx.close();
    }

    render(){
        return (<div className="simon-btn" onMouseUp={() => this.handleBtnUp()}></div>);
    }
}

render(<App />, document.getElementById('simon-app'));