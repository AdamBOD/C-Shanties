import { Component, OnInit } from '@angular/core';
import { TrackListEventsService } from '../shared/services/track-list-events.service';

@Component({
    selector: 'app-track-list',
    templateUrl: './track-list.component.html'
})
export class TrackListComponent implements OnInit {
    private trackList;

    constructor(private trackListEventsService: TrackListEventsService) { }

    ngOnInit() {
        console.log ("Tracklist component")
        this.trackListEventsService.trackListReceived.subscribe(trackList => {
            console.log("Received Tracklist")
            this.trackList = trackList;
            console.log (trackList);
        });
    }

}
