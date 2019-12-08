import { Injectable, EventEmitter } from "@angular/core";

@Injectable()
export class AudioPlayerEventsService {
    public playStateToggle: EventEmitter<boolean> = new EventEmitter();

    public emitPlayStateToggle(playState: boolean): void {
        this.playStateToggle.emit(playState)
    } 
}
