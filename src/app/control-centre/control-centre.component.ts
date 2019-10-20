import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-control-centre',
  templateUrl: './control-centre.component.html'
})
export class ControlCentreComponent implements OnInit {
  private startTime = "0:00";
  private endTime = "3:25";
  private playing = false;
  private currentTime = 0;

  constructor() { }

  ngOnInit() {
  }

  public togglePlay(event: Event): void {
    this.playing = !this.playing;

    window.setInterval(() => {
      if (this.playing) {
        console.log(this.currentTime);
        this.currentTime++;
      }
    }, 1000)
  }
}
