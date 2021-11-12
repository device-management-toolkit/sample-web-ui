/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
  
      setup: () => Chainable<Element>
      login: (user: string, password: string) => Chainable<Element>
      myIntercept: (method: string, url: string | RegExp, body: any) => Chainable<Element>
      goToPage: (pageName: string) => Chainable<Element>
      enterCiraInfo: (name:string, format:string, addr:string, user:string) => Chainable<Element>
      enterDomainInfo: (name:string, domain:string, file:string, pass:string) => Chainable<Element>
      enterWirelessInfo: (name:string, ssid:string, password:string) => Chainable<Element>
      enterProfileInfo: (name:string, activation:string, randAmt:boolean, randMebx:boolean, network:boolean, connection:string, connectionConfig:string) => Chainable<Element>
    }
  }
  