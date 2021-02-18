/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core'
@Component({
  selector: 'app-kvm',
  templateUrl: './kvm.component.html',
  styleUrls: ['./kvm.component.scss']
})
export class KvmComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef | undefined
  public context!: CanvasRenderingContext2D

  // constructor () { }

  // setting a width and height for the canvas
  @Input() public width = 400
  @Input() public height = 400
  module: any

  ngOnInit (): void {
  }

  ngAfterViewInit (): void {
    this.context = this.canvas?.nativeElement.getContext('2d')
    // this.module = new AMTDesktop(this.logger, this.context)
  }

  @HostListener('mouseup')
  onMouseup (): void {
    console.log('mouseup')
  }

  @HostListener('mousemove', ['$event'])
  onMousemove (event: MouseEvent): void {
    console.log('mouseMove')
  }

  @HostListener('mousedown', ['$event'])
  onMousedown (event: MouseEvent): void {
    console.log('mousedown')
  }
}
