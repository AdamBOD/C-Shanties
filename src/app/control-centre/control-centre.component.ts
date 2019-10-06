import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-control-centre',
  templateUrl: './control-centre.component.html'
})
export class ControlCentreComponent implements OnInit {
  private startTime = "0:00";
  private endTime = "3:25";

  constructor() { }

  ngOnInit() {
  }

}
