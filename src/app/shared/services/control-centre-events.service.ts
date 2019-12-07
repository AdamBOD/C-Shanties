import { Injectable, EventEmitter } from "@angular/core";
import { SongDataViewModel } from '../models/song-data.model';

@Injectable()
export class ControlCentreEventsService {
    public playStateToggle: EventEmitter<boolean> = new EventEmitter();
    public trackChange: EventEmitter<boolean> = new EventEmitter();
    public seekChange: EventEmitter<number> = new EventEmitter();
    public shuffleChange: EventEmitter<boolean> = new EventEmitter();
    public repeatChange: EventEmitter<number> = new EventEmitter();
    public songData: EventEmitter<SongDataViewModel> = new EventEmitter();
    public songNodeObject: EventEmitter<HTMLAudioElement> = new EventEmitter();
    public controlCentreExpanded: EventEmitter<boolean> = new EventEmitter();

    constructor () {}

    public emitPlayStateToggle(playState: boolean): void {
        this.playStateToggle.emit(playState)
    }

    public emitTrackChange(trackChange: boolean): void {
        this.trackChange.emit(trackChange)
    }
    
    public emitSeekChange(seekChange: number): void {
        this.seekChange.emit(seekChange)
    }

    public emitShuffleChange(shuffleChange: boolean): void {
        this.shuffleChange.emit(shuffleChange)
    }

    public emitRepeatChange(repeatChange: number): void {
        this.repeatChange.emit(repeatChange)
    }

    public emitSongData(songData: SongDataViewModel): void {
        this.songData.emit(songData);
    }

    public emitSongNodeObject(songNodeObject: HTMLAudioElement): void {
        this.songNodeObject.emit(songNodeObject);
    }

    public emitControlCentreExpandedChange(controlCentreExpanded: boolean): void {
        this.controlCentreExpanded.emit(controlCentreExpanded);
    }
}