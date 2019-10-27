import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ControlCentreEventsService } from '../shared/services/control-centre-events.service';
import { SongDataViewModel } from '../shared/models/song-data.model';
import { MatSlider } from '@angular/material/slider';
import { AudioPlayerEventsService } from '../shared/services/audio-player-events.service';

@Component({
  selector: 'app-control-centre',
  templateUrl: './control-centre.component.html'
})
export class ControlCentreComponent implements OnInit {
  private startTime = "0:00";
  private endTime = "0:00";
  private songName: string;
  private artistName: string;
  private imageData: string = './assets/images/noImage.png';
  private playing = false;
  private currentTime = 0;
  private controlCentreExpanded: boolean;
  @ViewChild('seekbar', {static: false}) seekbar: MatSlider;

  constructor(
    private controlCentreEventsService: ControlCentreEventsService,
    private audioPlayerEventsService: AudioPlayerEventsService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.controlCentreEventsService.songData.subscribe(songData => this.setupControlCentre(songData))
    this.controlCentreEventsService.songNodeObject.subscribe(songNodeObject => this.configureProgressListener(songNodeObject))
    this.controlCentreEventsService.playStateToggle.subscribe(playState => this.playing = playState);
  }

  public togglePlay(event: Event): void {
    this.audioPlayerEventsService.emitPlayStateToggle(!this.playing)
  }

  private setupControlCentre(songData: SongDataViewModel): void {
    this.seekbar.max = songData.duration;
    this.endTime = `${Math.floor(songData.duration / 60)}:${songData.duration % 60 < 10 ? "0" + (songData.duration % 60).toString() : songData.duration % 60}`
    this.currentTime = 0;
    this.songName = songData.title;
    this.artistName = songData.artist

    var albumArtData = songData.albumArt
    var base64String = '';
    for (var i = 0; i < albumArtData.data.length; i++) {
        base64String += String.fromCharCode(albumArtData.data[i]);
    }
    this.imageData = 'data:' + albumArtData.format + ';base64,' + window.btoa(base64String);
  }

  private configureProgressListener(songNodeObject: HTMLAudioElement): void {
    songNodeObject.addEventListener('timeupdate', (event: any) => {
      this.seekbar.value = parseFloat(songNodeObject.currentTime.toFixed(1));
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
}
