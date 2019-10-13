import { Component, ChangeDetectorRef } from '@angular/core';
import { IpcRenderer } from 'electron';
import { DomSanitizer } from '@angular/platform-browser';
import { Howl } from 'howler';
import { jsmediatags } from 'jsmediatags';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {
    title = 'C-Shanties';
    private ipc: IpcRenderer;
    public imageData = './assets/images/noImage.png';
    public songData

    public images = [];

    constructor(private sanitizer: DomSanitizer,
                private changeDetector: ChangeDetectorRef) {
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

    clickButton(event) {
        var sendData = {
            filePath: './src/electron/Lil Peep - Cut Myself (Slowed).mp3'
        }
        this.ipc.send('fetchFile', sendData);

        this.ipc.on('filesFetched', (event, data) => {
            this.renderImage(data.metaData);
            this.startSong(data.fileContent);
        });
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
            src: [song],
            autoplay: true
        });

        sound.play();
        console.log ('Started song');
    }
}
