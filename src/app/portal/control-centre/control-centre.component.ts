import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ControlCentreEventsService } from '../../shared/services/control-centre-events.service';
import { SongDataViewModel } from '../../shared/models/song-data.model';
import { MatSlider } from '@angular/material/slider';
import { AudioPlayerEventsService } from '../../shared/services/audio-player-events.service';

@Component({
    selector: 'app-control-centre',
    templateUrl: './control-centre.component.html'
})
export class ControlCentreComponent implements OnInit, AfterViewInit {
    private startTime = "0:00";
    private endTime = "0:00";
    private songName: string;
    private artistName: string;
    private imageData: string = './assets/images/noImage.png';
    private playing = false;
    private currentTime = 0;
    private controlCentreExpanded: boolean;
    private seekbarThumb: HTMLDivElement;
    private seekbarThumbHeld: boolean;
    private seekbarThumbValue;
    @ViewChild('seekbar', { static: false }) seekbar: MatSlider;

    constructor(
        private controlCentreEventsService: ControlCentreEventsService,
        private audioPlayerEventsService: AudioPlayerEventsService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.controlCentreEventsService.songData.subscribe(songData => this.setupControlCentre(songData))
        this.controlCentreEventsService.songNodeObject.subscribe(songNodeObject => this.configureProgressListener(songNodeObject))
        this.controlCentreEventsService.playStateToggle.subscribe(playState => {
            this.playing = playState;
            this.changeDetector.detectChanges();
        });
    }

    ngAfterViewInit() {
        this.seekbarThumb = this.seekbar._elementRef.nativeElement.children[0].children[2].children[1];
        this.seekbar._elementRef.nativeElement.addEventListener("mousedown", () => this.seekbarThumbHeld = true, false);
        this.seekbar._elementRef.nativeElement.addEventListener("mouseup", () => this.seekbarThumbHeld = false, false);

        this.seekbar._elementRef.nativeElement.addEventListener("click", () => {
            this.seekbarThumbHeld = false;
            this.controlCentreEventsService.emitSeekChange(this.seekbarThumbValue);
        }, false);
    }

    public togglePlay(event: Event): void {
        this.audioPlayerEventsService.emitPlayStateToggle(!this.playing)
    }

    private setupControlCentre(songData: SongDataViewModel): void {
        this.seekbar.max = songData.duration;
        this.endTime = this.parseTime(songData.duration);
        this.currentTime = 0;
        this.songName = songData.title;
        this.artistName = songData.artist
        this.imageData = songData.albumArt;
    }

    private configureProgressListener(songNodeObject: HTMLAudioElement): void {
        songNodeObject.addEventListener('timeupdate', (event: any) => {
            this.startTime = this.parseTime(Math.round(songNodeObject.currentTime));

            if (!this.seekbarThumbHeld) {
                this.seekbar.value = parseFloat(songNodeObject.currentTime.toFixed(1));
            }

            this.changeDetector.detectChanges();
        });
    }

    public expandControlCentre(event): void {
        this.controlCentreExpanded = !this.controlCentreExpanded;
        this.controlCentreEventsService.emitControlCentreExpandedChange(this.controlCentreExpanded);
    }

    public backTrack(event): void {
        this.controlCentreEventsService.emitTrackChange(false);
    }

    public skipTrack(event): void {
        this.controlCentreEventsService.emitTrackChange(true);
    }

    public seekTrack(event): void {
        this.seekbarThumbValue = event.value;
    }

    public parseTime(time: number): string {
        return `${Math.floor(time / 60)}:${time % 60 < 10 ? "0" + (time % 60).toString() : time % 60}`;
    }
}
