/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import {
  ActivationModes,
  ConnectionModes,
  DhcpModes,
  TlsModes,
  TlsSigningAuthorities,
  UserConsentModes
} from './profiles.constants'

describe('Profile Constants', () => {
  describe('ActivationModes', () => {
    ActivationModes.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value}`, () => {
        expect(ActivationModes.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
  describe('ConnectionModes', () => {
    ConnectionModes.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value}`, () => {
        expect(ConnectionModes.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
  describe('DhcpModes', () => {
    DhcpModes.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value.toString()}`, () => {
        expect(DhcpModes.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
  describe('TlsModes', () => {
    TlsModes.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value}`, () => {
        expect(TlsModes.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
  describe('TlsSigningAuthorities', () => {
    TlsSigningAuthorities.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value}`, () => {
        expect(TlsSigningAuthorities.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
  describe('ActivationModes', () => {
    UserConsentModes.all().forEach(m => {
      it(`should have label: ${m.label} for value: ${m.value}`, () => {
        expect(UserConsentModes.labelForValue(m.value)).toEqual(m.label)
      })
    })
  })
})
