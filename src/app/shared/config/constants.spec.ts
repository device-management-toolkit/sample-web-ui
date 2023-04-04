/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { ActivationModes, ConnectionModes, DhcpModes, TlsModes, UserConsentModes } from './Constants'

describe('Test Constants Value and Label', () => {
  it('should parse ActivationModes', () => {
    expect(ActivationModes.labelForValue(ActivationModes.ADMIN.value)).toEqual(ActivationModes.ADMIN.label)
    expect(ActivationModes.labelForValue(ActivationModes.CLIENT.value)).toEqual(ActivationModes.CLIENT.label)
    expect(ActivationModes.labelForValue('expect')).toEqual('')
  })

  it('should parse ConnectionModes', () => {
    expect(ConnectionModes.labelForValue(ConnectionModes.CIRA.value)).toEqual(ConnectionModes.CIRA.label)
    expect(ConnectionModes.labelForValue(ConnectionModes.TLS.value)).toEqual(ConnectionModes.TLS.label)
    expect(ConnectionModes.labelForValue('not happening')).toEqual('')
  })

  it('should parse DhcpModes', () => {
    expect(DhcpModes.labelForValue(DhcpModes.DHCP.value)).toEqual(DhcpModes.DHCP.label)
    expect(DhcpModes.labelForValue(DhcpModes.STATIC.value)).toEqual(DhcpModes.STATIC.label)
    expect(DhcpModes.labelForValue(true)).toEqual(DhcpModes.DHCP.label)
    expect(DhcpModes.labelForValue(false)).toEqual(DhcpModes.STATIC.label)
  })

  it('should parse TlsModes', () => {
    expect(TlsModes.labelForValue(TlsModes.MUTUAL.value)).toEqual(TlsModes.MUTUAL.label)
    expect(TlsModes.labelForValue(TlsModes.MUTUAL_NON_TLS.value)).toEqual(TlsModes.MUTUAL_NON_TLS.label)
    expect(TlsModes.labelForValue(TlsModes.SERVER.value)).toEqual(TlsModes.SERVER.label)
    expect(TlsModes.labelForValue(TlsModes.SERVER_NON_TLS.value)).toEqual(TlsModes.SERVER_NON_TLS.label)
    expect(TlsModes.labelForValue(-127)).toEqual('')
  })

  it('should parse UserConsentModes', () => {
    expect(UserConsentModes.labelForValue(UserConsentModes.ALL.value)).toEqual(UserConsentModes.ALL.label)
    expect(UserConsentModes.labelForValue(UserConsentModes.KVM.value)).toEqual(UserConsentModes.KVM.label)
    expect(UserConsentModes.labelForValue(UserConsentModes.NONE.value)).toEqual(UserConsentModes.NONE.label)
    expect(UserConsentModes.labelForValue('not happening')).toEqual('')
  })
})
