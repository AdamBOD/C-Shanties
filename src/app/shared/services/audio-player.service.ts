import { Injectable } from "@angular/core";
import { IpcRenderer } from 'electron';
import { Howl } from 'howler';
import { ControlCentreEventsService } from './control-centre-events.service';
import { SongDataViewModel } from '../models/song-data.model';
import { AudioPlayerEventsService } from './audio-player-events.service';

@Injectable()
export class AudioPlayerService {
    private ipc: IpcRenderer;
    private songData: any;
    private songMetaData: any;
    private song: Howl;
    private queue: string[];
    private receivedQueue: string[];
    private queuePosition: number = 0;
    private progressTimer;
    private progressTimerPaused: boolean;
    private progress = 0;

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
            if (this.song != null)
                result ? this.song.play() : this.song.pause();
            else 
                this.fetchQueue();
        });

        this.controlCentreEventsService.trackChange.subscribe(result => {
            if (result) {
                if (this.queuePosition == this.queue.length - 1)
                    return;

                this.queuePosition++;
            }
            else {
                if (this.progress <= 3500) {
                    if (this.queuePosition == 0)
                        return;

                    this.queuePosition--;
                }
                else {
                    this.restartSong();
                }
            }

            var sendData = {
                filePath: this.queue[this.queuePosition]
            }
            this.fetchSong(sendData);
        });

        this.controlCentreEventsService.seekChange.subscribe(result => {
            this.song.seek(result);
            this.progress = result * 1000;
        });

        this.ipc.on('queueFetched', (event, data) => {
            this.queue = data;
            this.receivedQueue = data;
            //console.log(this.queue);

            this.queue = this.shuffle(this.queue);
            //console.log(this.queue);

            var sendData = {
                filePath: data[this.queuePosition]
            }
            this.fetchSong(sendData);
        });

        this.ipc.on('fileFetched', (event, data) => {
            this.songMetaData = data.metaData;
            this.songData = data.fileContent;
            this.configureSong(this.songData);
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

        this.progressTimer = null;
        this.progressTimerPaused = false;
        this.progress = 0;

        var extensionExtraction = /[^\\]*\.(\w+)$/;
        var extension = extensionExtraction.exec(this.queue[this.queuePosition])[1];

        if (extension != 'mp3') {
            extension = 'mp4';
        }

        songData = `data:audio/${extension};base64,${songData}`;
        this.song = new Howl({
            src: [songData],
            html5: true,
            format: [extension],
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
                if (this.progress == 0) {
                    this.progressTimer = setInterval(() => {
                        if (!this.progressTimerPaused) {
                            this.progress += 100;
                        }
                    }, 100);
                }
                else {
                    this.progressTimerPaused = false;
                }
                
            },
            onpause: () => {
                this.controlCentreEventsService.emitPlayStateToggle(false);
                this.progressTimerPaused = true;
            },
            onend: () => {
                this.setupNextSong();
            },
            onloaderror: (id, err) => {
                console.error(err);
                this.setupNextSong();
            },
            onplayerror: (id, err) => {
                console.error(err);
                this.setupNextSong();
            },
            autoplay: true
        });
    }

    private setupNextSong () {
        if (this.queuePosition == this.queue.length - 1) {
            return;
        }

        this.progress = 0;
        this.progressTimer = null;
        this.queuePosition++;
        var sendData = {
            filePath: this.queue[this.queuePosition]
        };

        this.fetchSong(sendData);
    }

    private restartSong () {
        this.configureSong(this.songData);
    }

    private passAudioNodeObject(): void {
        const node: HTMLAudioElement = (this.song as any)._sounds[0]._node;
        this.controlCentreEventsService.emitSongNodeObject(node);
    }

    /**
    * Shuffles array in place.
    * @param {Array} a items An array containing the items.
    */
    private shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}