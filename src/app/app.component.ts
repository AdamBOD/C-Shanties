import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { IpcRenderer } from 'electron';
import { DomSanitizer } from '@angular/platform-browser';
import { Howl } from 'howler';
import { jsmediatags } from 'jsmediatags';
import { ControlCentreEventsService } from './shared/services/control-centre-events.service';
import { SongDataViewModel } from './shared/models/song-data.model';
import { AudioPlayerService } from './shared/services/audio-player.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
    title = 'C-Shanties';
    private ipc: IpcRenderer;
    public imageData = './assets/images/noImage.png';
    public songData
    private controlCentreExpanded: boolean;

    public images = [];

    constructor(private sanitizer: DomSanitizer,
                private changeDetector: ChangeDetectorRef,
                private controlCentreEventsService: ControlCentreEventsService,
                private audioPlayerService: AudioPlayerService) {
        if ((<any>window).require) {
            try {
                this.ipc = (<any>window).require('electron').ipcRenderer;
            } catch (e) {
                throw e;
            }
        } else {
            console.warn('App not running inside Electron!');
        }
    }

    ngOnInit() {
        this.controlCentreEventsService.controlCentreExpanded.subscribe((result) => this.controlCentreExpanded = result);
    }

    clickButton(event) {
        this.ipc.send('setLocation', null);
    }
}
