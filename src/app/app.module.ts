import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonRangeSliderModule } from 'ng2-ion-range-slider';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ControlCentreComponent } from './control-centre/control-centre.component';

@NgModule({
  declarations: [
    AppComponent,
    ControlCentreComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    IonRangeSliderModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
