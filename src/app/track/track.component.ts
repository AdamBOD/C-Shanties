import { Component, OnInit, Input, ChangeDetectorRef, OnChanges } from '@angular/core';
import { AudioPlayerEventsService } from '../shared/services/audio-player-events.service';

@Component({
    selector: '[app-track]',
    templateUrl: './track.component.html'
})
export class TrackComponent implements OnInit, OnChanges {
    @Input() trackData;
    @Input() currentlyPlaying: boolean = false;
    private playing: boolean;

    constructor(
        private audioPlayerEventsService: AudioPlayerEventsService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.audioPlayerEventsService.playStateToggle.subscribe(playState => {
            if (this.currentlyPlaying) {
                this.playing = playState;
                this.changeDetector.detectChanges();
            }
        });
    }

    ngOnChanges() {
        this.playing = this.currentlyPlaying;
    }

    public togglePlay(event: Event): void {
        if (this.currentlyPlaying) {
            this.audioPlayerEventsService.emitPlayStateToggle(!this.playing);
        }
        else {
            var songData = {
                Id: this.trackData.Id
            }
            this.audioPlayerEventsService.emitPlaySong(songData);
        }
    }
}
