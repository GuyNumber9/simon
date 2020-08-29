import { resolve } from "../webpack.config";

export default class Sound {
    context: AudioContext;
    oscillator: OscillatorNode;
    gain: GainNode;

    constructor(){
        this.context = new AudioContext();
        this.oscillator = this.context.createOscillator();
        this.gain = this.context.createGain();
        
        this.oscillator.type = "sine";
        this.oscillator.connect(this.gain);
        this.gain.connect(this.context.destination);

        this.gain.gain.value = 0;
        
        this.oscillator.start(0);
        //this.context.suspend();
    }

    play(frequency: number): () => void{
        console.log(`play(${frequency})`);
        let o = this.context.createOscillator();
        o.frequency.value = frequency;
        let g = this.context.createGain();
        g.gain.value = 0.25;
        o.connect(g);
        g.connect(this.context.destination);
        o.start(0);
        //g.gain.setTargetAtTime(g.gain.value, this.context.currentTime, 0);
        //g.gain.exponentialRampToValueAtTime(0.25, this.context.currentTime + 0.04);
        /*let p = new Promise((resolve, reject) => {
            setTimeout(() => {
                
                resolve();
            }, length);
        })
        */
        
        return () => {
            g.gain.setValueAtTime(g.gain.value, this.context.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.04);
        };
    }

    stop(){
        console.log(`stop()`);
        //this.gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
        //this.oscillator.stop();
        //this.context.suspend();
    }
}