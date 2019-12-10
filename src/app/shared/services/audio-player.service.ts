import { Injectable } from "@angular/core";
import { IpcRenderer } from 'electron';
import { Howl } from 'howler';
import { ControlCentreEventsService } from './control-centre-events.service';
import { SongDataViewModel } from '../models/song-data.model';
import { AudioPlayerEventsService } from './audio-player-events.service';
import { TrackListEventsService } from './track-list-events.service';

@Injectable()
export class AudioPlayerService {
    private ipc: IpcRenderer;
    private songData: any;
    private song: Howl;
    private queue: any[];
    private receivedQueue: any[];
    private queuePosition: number = 0;
    private progressTimer;
    private progressTimerPaused: boolean;
    private progress = 0;

    private requestedSong: string;

    constructor (
        private controlCentreEventsService: ControlCentreEventsService,
        private audioPlayerEventsService: AudioPlayerEventsService,
        private trackListEventsService: TrackListEventsService
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
            if (this.song != null){
                result ? this.song.play() : this.song.pause();
            }
            else {
                if (this.queue == null || this.queue.length == 0){
                    this.fetchQueue();
                }
                else {
                    var sendData = {
                        filePath: this.queue[this.queuePosition].Location
                    }

                    this.fetchSong(sendData);
                }
            }
        });

        this.audioPlayerEventsService.playSong.subscribe(result => {
            this.requestedSong = result.Id;

            if (this.queue == null || this.queue.length == 0)
                this.fetchQueue();
            else
                this.configureQueue();
        });

        this.audioPlayerEventsService.fetchQueue.subscribe(result => {
            this.fetchQueue();
        });

        this.audioPlayerEventsService.fetchTracks.subscribe(result => {
            this.fetchTracks();
        });

        this.controlCentreEventsService.trackChange.subscribe(result => {
            this.handleTrackChange(result);
        });

        this.controlCentreEventsService.seekChange.subscribe(result => {
            this.song.seek(result);
            this.progress = result * 1000;
        });

        this.ipc.on('queueFetched', (event, data) => {
            this.queue = data;
            this.receivedQueue = data;
            this.configureQueue();
        });

        this.ipc.on('tracksFetched', (event, data) => {
            this.trackListEventsService.emitTrackListReceived(data);
        });

        this.ipc.on('fileFetched', (event, data) => {
            this.songData = data.fileContent;
            this.configureSong(this.songData);
        });

        this.ipc.on('mediaPreviousTrack', (event, data) => {
            this.handleTrackChange(false);
        });

        this.ipc.on('mediaPlayPause', (event, data) => {
            if (this.progressTimerPaused)
                this.song.play();
            else
                this.song.pause();
        });

        this.ipc.on('mediaNextTrack', (event, data) => {
            this.handleTrackChange(true);
        });
    }

    private fetchQueue(): void {
        this.ipc.send('fetchQueue', null);
    }

    private fetchTracks(): void {
        this.ipc.send('fetchTracks', null);
    }

    private fetchSong(sendData: any): void {
        this.ipc.send('fetchFile', sendData);
    }

    private handleTrackChange(trackChangeState: boolean) {
        if (trackChangeState) {
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
            filePath: this.queue[this.queuePosition].Location
        }
        this.fetchSong(sendData);
    }

    private configureQueue() {
        var index = null;
        if (this.requestedSong != "") {
            var queueLength = this.receivedQueue.length;
            for (var i = 0; i < queueLength; i++) {
                if (this.receivedQueue[i].Id == this.requestedSong) {
                    index = i;
                    this.requestedSong = "";
                    break;
                }
            }
        }

        this.queue = this.shuffle(this.receivedQueue, index);
        this.queuePosition = 0;

        var sendData = {
            filePath: this.queue[this.queuePosition].Location
        }

        this.fetchSong(sendData);
    }

    private configureSong(songData: any): void {
        if (this.song != null) {
            this.song.unload();
        }

        this.progressTimer = null;
        this.progressTimerPaused = false;
        this.progress = 0;

        var extensionExtraction = /[^\\]*\.(\w+)$/;
        var extension = extensionExtraction.exec(this.queue[this.queuePosition].Location)[1];

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
                    this.queue[this.queuePosition].SongTitle,
                    this.queue[this.queuePosition].ArtistName,
                    this.queue[this.queuePosition].AlbumTitle,
                    Math.round(this.song.duration()),
                    this.queue[this.queuePosition].Artwork
                );
                this.controlCentreEventsService.emitSongData(newSongData);
                this.trackListEventsService.emitCurrentlyPlayingSongChanged(this.queue[this.queuePosition].Id);
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
            filePath: this.queue[this.queuePosition].Location
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
    private shuffle(a, b = null) {
        var firstSong;

        if (b != null) {
            firstSong = a[b];
            a.splice(b, 1);
        }

        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }

        if (b != null && firstSong != null) {
            a.unshift(firstSong);
        }

        return a;
    }
}
