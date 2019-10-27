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
        var sendData = {
            filePath: './src/electron/Lil Peep - Cut Myself (Slowed).mp3'
        };
        //this.ipc.send('fetchFile', sendData);
        this.audioPlayerService.fetchQueue();

        // this.ipc.on('filesFetched', (event, data) => {
        //     this.renderImage(data.metaData);
        //     console.log (data.metaData);
        //     let newSongData = new SongDataViewModel(
        //         data.metaData.tags.title,
        //         data.metaData.tags.artist,
        //         data.metaData.tags.album,
        //         data.metaData.tags.artist,
        //         data.metaData.tags.picture
        //     );
        //     console.log (newSongData);
        //     this.controlCentreEventsService.songData.emit(newSongData);
        //     this.startSong(data.fileContent);
        // });
    }

    renderImage (data) {
        console.log ('Rendering Image');
        var picture = data.tags.picture;
        var base64String = '';
        for (var i = 0; i < picture.data.length; i++) {
            base64String += String.fromCharCode(picture.data[i]);
        }
        this.imageData = 'data:' + picture.format + ';base64,' + window.btoa(base64String);        
        this.changeDetector.detectChanges();
        
        console.log ('Rendered Image');
    }

    startSong (data) {
        console.log ('Starting song');
        var song = 'data:audio/mp3;base64,' + data;
        var sound = new Howl({
            src: [song]//,
            //autoplay: true
        });

        //sound.play();
        console.log ('Started song');
    }
}
