import { Injectable, EventEmitter } from "@angular/core";

@Injectable()
export class TrackListEventsService {
    public trackListReceived: EventEmitter<any> = new EventEmitter();

    public emitTrackListReceived(trackList: any): void {
        this.trackListReceived.emit(trackList);
    } 
}
