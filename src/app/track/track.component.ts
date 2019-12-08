import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: '[app-track]',
    templateUrl: './track.component.html'
})
export class TrackComponent implements OnInit {
    @Input() trackData;

    constructor() { }

    ngOnInit() {
    }

}
