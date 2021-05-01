import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-canvas',
  // templateUrl: './canvas.component.html',
  // styleUrls: ['./canvas.component.css'], 
  template: `<canvas #canvas width="600" height="300"></canvas>
             <button (click)="animate()">Play</button>`,
  styles: ['canvas { border-style: solid }']
})

export class CanvasComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas?: ElementRef<HTMLCanvasElement>;  

  constructor() { 
  }

  private ctx?: CanvasRenderingContext2D;

  ngOnInit(): void {
  }

  animate() {
  }
}