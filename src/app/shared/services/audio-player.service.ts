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
    private queue: string[];
    private queuePosition: number = 0;

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
                result ? this.song.play() : this.song.pause();
        });

        this.controlCentreEventsService.trackChange.subscribe(result => {
            if (result) {
                this.queuePosition--;
            }
            else {
                this.queuePosition++;
            }

            var sendData = {
                filePath: this.queue[this.queuePosition]
            }
            this.fetchSong(sendData);
        });

        this.ipc.on('queueFetched', (event, data) => {
            this.queue = data;
            var sendData = {
                filePath: data[this.queuePosition]
            }
            this.fetchSong(sendData);
        });

        this.ipc.on('fileFetched', (event, data) => {
            this.songMetaData = data.metaData;
            this.configureSong(data.fileContent);
        });
    }

    public fetchQueue(): void {
        this.ipc.send('fetchQueue', null);
    }

    public fetchSong(sendData: any): void {        
        this.ipc.send('fetchFile', sendData);
    }

    public configureSong(songData: any): void {
        if (this.song != null) {
            this.song.unload();
        }

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
                this.queuePosition++;
                var sendData = {
                    filePath: this.queue[this.queuePosition]
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