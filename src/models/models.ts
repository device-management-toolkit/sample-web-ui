/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export interface Device {
  hostname: string
  icon: number
  connectionStatus: boolean
  guid: string
  tags: string[]
}

export interface DeviceResponse {
  data: Device[]
  totalCount: number
}

export interface DeviceStats {
  totalCount: number
  connectedCount: number
  disconnectedCount: number
}
export interface Domain {
  profileName: string
  domainSuffix: string
  provisioningCert: string
  provisioningCertPassword: string
  provisioningCertStorageFormat: string
}

export interface DomainsResponse {
  data: Domain[]
  totalCount: number
}

export interface Profile {
  profileName: string
  generateRandomPassword: boolean
  amtPassword: null
  configurationScript: null
  activation: string
  ciraConfigName: string
  dhcpEnabled: boolean
  generateRandomMEBxPassword: boolean
  mebxPassword: string
  tags: string[]
  wifiConfigs: any[]
}

export interface ProfileResponse {
  data: Profile[]
  totalCount: number
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

export interface CIRAConfigResponse {
  data: CIRAConfig[]
  totalCount: number
}

export interface AuditLog {
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
export interface AuditLogResponse {
  totalCnt: number
  records: AuditLog[]
}

export interface EventLog {
  DeviceAddress: number
  EventSensorType: number
  EventType: number
  EventOffset: number
  EventSourceType: number
  EventSeverity: number
  SensorNumber: number
  Entity: number
  EntityInstance: number
  EventData: number[]
  Time: string
  EntityStr: string
  Desc: string
  eventTypeDesc: string
}

export interface APIResponse {
  error: string
  message: string
}

export interface AmtFeaturesResponse {
  userConsent: string
  optInState: number
  redirection: boolean
  KVM: boolean
  SOL: boolean
  IDER: boolean
}

export interface PowerState {
  powerstate: number
}

export interface CIMChassis {
  ChassisPackageType: number
  CreationClassName: string
  ElementName: string
  Manufacturer: string
  Model: string
  OperationalStatus: number
  PackageType: number
  SerialNumber: string
  Tag: string
  Version: string
}

export interface CIMChip {
  CanBeFRUed: boolean
  CreationClassName: string
  ElementName: string
  Manufacturer: string
  OperationalStatus: number
  Tag: any
  Version: string
  BankLabel: string
  Capacity?: number
  ConfiguredMemoryClockSpeed?: number
  FormFactor?: number
  IsSpeedInMhz?: boolean
  MaxMemorySpeed?: number
  MemoryType?: number
  PartNumber: string
  SerialNumber: string
  Speed?: number
}

export interface CIMCard {
  CanBeFRUed: boolean
  CreationClassName: string
  ElementName: string
  Manufacturer: string
  Model: string
  OperationalStatus: number
  PackageType: number
  SerialNumber: string
  Tag: string
  Version: string
}

export interface CIMBIOSElement {
  ElementName: string
  Manufacturer: string
  Name: string
  OperationalStatus: number
  PrimaryBIOS: boolean
  ReleaseDate: any
  SoftwareElementID: string
  SoftwareElementState: number
  TargetOperatingSystem: number
  Version: string
}

export interface CIMProcessor {
  CPUStatus: number
  CreationClassName: string
  CurrentClockSpeed: number
  DeviceID: string
  ElementName: string
  EnabledState: number
  ExternalBusClockSpeed: number
  Family: number
  HealthState: number
  MaxClockSpeed: number
  OperationalStatus: number
  RequestedState: number
  Role: string
  Stepping: number
  SystemCreationClassName: string
  SystemName: string
  UpgradeMethod: number
}

export interface CIMPhysicalMemory {
  BankLabel: string
  Capacity: any
  ConfiguredMemoryClockSpeed: number
  CreationClassName: string
  ElementName: string
  FormFactor: number
  IsSpeedInMhz: boolean
  Manufacturer: string
  MaxMemorySpeed: number
  MemoryType: number
  PartNumber: string
  SerialNumber: string
  Speed: number
  Tag: any
}

export interface CIMMediaAccessDevice {
  Capabilities: number[]
  CreationClassName: string
  DeviceID: string
  ElementName: string
  EnabledDefault: number
  EnabledState: number
  MaxMediaSize: number
  OperationalStatus: number
  RequestedState: number
  Security: number
  SystemCreationClassName: string
  SystemName: string
}

export interface CIMPhysicalPackage {
  CanBeFRUed: boolean
  CreationClassName: string
  ElementName: string
  Manufacturer: string
  Model: string
  OperationalStatus: number
  PackageType: number
  SerialNumber: string
  Tag: string
  Version: string
  ManufactureDate: any
  ChassisPackageType?: number
}

export interface HardwareResponse<T> {
  response: T
  responses: any
  status: number
}
export interface HardwareInformation {
  CIM_Chassis: HardwareResponse<CIMChassis>
  CIM_Chip: HardwareResponse<CIMChip>
  CIM_Card: HardwareResponse<CIMCard>
  CIM_BIOSElement: HardwareResponse<CIMBIOSElement>
  CIM_Processor: HardwareResponse<CIMProcessor>
  CIM_PhysicalMemory: HardwareResponse<CIMPhysicalMemory>
  CIM_MediaAccessDevice: HardwareResponse<CIMMediaAccessDevice[]>
  CIM_PhysicalPackage: HardwareResponse<CIMPhysicalPackage[]>
}

export interface WiFiProfile {
  profileName: string
  priority: number
}
export interface WirelessConfig {
  profileName: string
  authenticationMethod: number
  encryptionMethod: number
  ssid: string
  pskValue: string
  linkPolicy: number[]
}

export interface WirelessConfigResponse {
  data: WirelessConfig[]
  totalCount: number
}

export interface ValidatorError {
  msg: string
  param: string
  location: string
  value: string
}

export interface PageEventOptions {
  pageSize: number
  startsFrom: number
  count: string
  tags?: string[]
}

export interface Header {
  To: string
  RelatesTo: string
  Action: string
  MessageID: string
  ResourceURI: string
  Method: string
}
export interface Body {
  ReturnValue: number
  ReturnValueStr: string
}

export interface userConsentResponse {
  Header: Header
  Body: Body
}

export interface userConsentData {
  deviceId: string
  results: any
}

export interface errorResponse {
  error: string
  errorDescription: string
}

export interface EventChannelResponse {
  guid: string
  message: string
  timestamp: number
  type: string
  methods: string[]
}

export interface EventChannel {
  data: EventChannelResponse[]
}
