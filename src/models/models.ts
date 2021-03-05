/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export interface Device{
  host: string
  amtuser: string
  icon: number
  conn: number
}
export interface Domain{
  profileName: string
  domainSuffix: string
  provisioningCert: string
  provisioningCertPassword: string
  provisioningCertStorageFormat: string
}

export interface Profile {
  profileName: string
  amtPassword: null
  generateRandomPassword: boolean
  passwordLength: number
  configurationScript: null
  activation: string
  ciraConfigName: string
  networkConfigName: string
  mebxPassword: string
  generateRandomMEBxPassword: boolean
  mebxPasswordLength: number
}
export interface CIRAConfig {
  configName: string
  mpsServerAddress: string
  mpsPort: number
  username: string
  password: string
  commonName: string
  serverAddressFormat: number
  authMethod: number
  mpsRootCertificate: string
  proxyDetails: string
}
export interface AuditLog{
  AuditApp: string
  AuditAppID: number
  Event: string
  EventID: number
  Ex: string
  ExStr: string
  Initiator: string
  InitiatorType: number
  MCLocationType: number
  NetAddress: string
  Time: string
}
export interface AuditLogResponse{
  totalCnt: number
  records: AuditLog[]
}

export interface APIResponse{
  error: string
  message: string
}

export interface AmtFeatures{
  userConsent: string
  redirection: boolean
  KVM: boolean
  SOL: boolean
  IDER: boolean
}

export interface AmtFeaturesResponse{
  statusCode: number
  payload: AmtFeatures
}

export interface PowerState{
  powerstate: number
}
