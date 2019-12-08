import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TrackListEventsService } from '../shared/services/track-list-events.service';
import { AudioPlayerEventsService } from '../shared/services/audio-player-events.service';
import { ControlCentreEventsService } from '../shared/services/control-centre-events.service';

@Component({
    selector: 'app-track-list',
    templateUrl: './track-list.component.html'
})
export class TrackListComponent implements OnInit, AfterViewInit {
    private trackList;
    private controlCentreExpanded: boolean;

    constructor(
        private trackListEventsService: TrackListEventsService,
        private audioPlayerEventsService: AudioPlayerEventsService,
        private controlCentreEventsService: ControlCentreEventsService
    ) { }

    ngOnInit() {
        this.trackListEventsService.trackListReceived.subscribe(trackList => {
            this.trackList = trackList;
        });

        this.controlCentreEventsService.controlCentreExpanded.subscribe(result => {
            this.controlCentreExpanded = result;
        })
    }

    ngAfterViewInit() {
        this.audioPlayerEventsService.emitFetchTracks();
    }

}
