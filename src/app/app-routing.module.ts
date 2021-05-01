import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CanvasComponent } from './canvas/canvas.component'; 

const routes: Routes = [{ path: '', component: HomeComponent }, 
                        { path: 'canvas', component: CanvasComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
