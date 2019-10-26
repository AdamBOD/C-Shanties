import { Injectable } from "@angular/core";
import { IpcRenderer } from 'electron';
import { Howl } from 'howler';
import { ControlCentreEventsService } from './control-centre-events.service';
import { SongDataViewModel } from '../models/song-data.model';
import { AudioPlayerEventsService } from './audio-player-events.service';

@Injectable()
export class AudioPlayerService {
    private ipc: IpcRenderer;
    private songMetaData: any;
    private song: Howl;


    constructor (
        private controlCentreEventsService: ControlCentreEventsService,
        private audioPlayerEventsService: AudioPlayerEventsService
    ) { 
        if ((<any>window).require) {
            try {
                this.ipc = (<any>window).require('electron').ipcRenderer;
            } catch (e) {
                throw e;
            }
        } else {
            console.warn('App not running inside Electron!');
        }

        this.init();
    }

    private init(): void {
        this.audioPlayerEventsService.playStateToggle.subscribe(result => {
            console.log(this.song)
            console.log(result)
            if (this.song != null)
                result ? this.song.play() : this.song.pause()
            // if (result)
            //     this.song.play();
            // else 
            //     this.song.pause();
        });//result ? this.song.play() : this.song.pause());

        this.ipc.on('filesFetched', (event, data) => {
            this.songMetaData = data.metaData;
            this.configureSong(data.fileContent);
        });
    }

    public fetchSong(sendData: any): void {        
        this.ipc.send('fetchFile', sendData);
    }

    public configureSong(songData: any): void {        
        songData = 'data:audio/mp3;base64,' + songData;
        this.song = new Howl({
            src: [songData],
            html5: true,
            onload: () => {
                let newSongData = new SongDataViewModel(
                    this.songMetaData.tags.title,
                    this.songMetaData.tags.artist,
                    this.songMetaData.tags.album,
                    Math.round(this.song.duration()),
                    this.songMetaData.tags.picture
                );
                this.controlCentreEventsService.emitSongData(newSongData);
                this.passAudioNodeObject();     
            },
            onplay: () => {
                this.controlCentreEventsService.emitPlayStateToggle(true);
            },
            onpause: () => {
                this.controlCentreEventsService.emitPlayStateToggle(false);
            },
            onend: () => {
                var sendData = {
                    filePath: './src/electron/Dreams & Nightmares (ft Lil Peep).mp3'
                };

                this.fetchSong(sendData)
            },
            autoplay: true
        });
    }

    private passAudioNodeObject(): void {
        const node: HTMLAudioElement = (this.song as any)._sounds[0]._node;
        this.controlCentreEventsService.emitSongNodeObject(node);
    }
}