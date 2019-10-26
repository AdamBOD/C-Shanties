import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ControlCentreComponent } from './control-centre/control-centre.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ControlCentreEventsService } from './shared/services/control-centre-events.service';
import { AudioPlayerService } from './shared/services/audio-player.service';
import { AudioPlayerEventsService } from './shared/services/audio-player-events.service';

@NgModule({
  declarations: [
    AppComponent,
    ControlCentreComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSliderModule
  ],
  providers: [
    ControlCentreEventsService,
    AudioPlayerEventsService,
    AudioPlayerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
