import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { TrackListEventsService } from '../../services/track-list-events.service';
import { AudioPlayerEventsService } from '../../services/audio-player-events.service';
import { ControlCentreEventsService } from '../../services/control-centre-events.service';

@Component({
    selector: 'app-track-list',
    templateUrl: './track-list.component.html'
})
export class TrackListComponent implements OnInit, AfterViewInit {
    private trackList;
    private tracksLoaded: boolean;
    private controlCentreExpanded: boolean;
    private currentPlayingSong: string;

    constructor(
        private trackListEventsService: TrackListEventsService,
        private audioPlayerEventsService: AudioPlayerEventsService,
        private controlCentreEventsService: ControlCentreEventsService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.trackListEventsService.trackListReceived.subscribe(trackList => {
            this.trackList = trackList;
            this.tracksLoaded = true;
            this.changeDetector.detectChanges();
        });

        this.trackListEventsService.currentlyPlayingSongChanged.subscribe(currentPlayingSong => {
            this.currentPlayingSong = currentPlayingSong;
            this.changeDetector.detectChanges();
        });

        this.controlCentreEventsService.controlCentreExpanded.subscribe(result => {
            this.controlCentreExpanded = result;
        })
    }

    ngAfterViewInit() {
        this.audioPlayerEventsService.emitFetchTracks();
    }

}
