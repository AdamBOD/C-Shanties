import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSliderModule } from '@angular/material/slider';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ControlCentreComponent } from './portal/control-centre/control-centre.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ControlCentreEventsService } from './shared/services/control-centre-events.service';
import { AudioPlayerService } from './shared/services/audio-player.service';
import { AudioPlayerEventsService } from './shared/services/audio-player-events.service';
import { TrackListComponent } from './shared/components/track-list/track-list.component';
import { TrackListEventsService } from './shared/services/track-list-events.service';
import { TrackComponent } from './shared/components/track/track.component';
import { SidebarComponent } from './portal/sidebar/sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    ControlCentreComponent,
    TrackListComponent,
    TrackComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot ([
      {path: 'home', component: TrackListComponent},
      {path: '', redirectTo: 'home', pathMatch: 'full'}
    ]),
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSliderModule
  ],
  providers: [
    ControlCentreEventsService,
    AudioPlayerEventsService,
    AudioPlayerService,
    TrackListEventsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
