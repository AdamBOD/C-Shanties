import { Injectable, EventEmitter } from "@angular/core";

@Injectable()
export class TrackListEventsService {
    public trackListReceived: EventEmitter<any> = new EventEmitter();

    public emitTrackListReceived(trackList: any): void {
        console.log ("Emitting TrackList event")
        this.trackListReceived.emit(trackList);
    } 
}
