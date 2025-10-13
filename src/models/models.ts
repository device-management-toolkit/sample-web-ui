/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export interface Device {
  connectionStatus: boolean
  mpsInstance: string
  hostname: string
  guid: string
  mpsusername: string
  tags: string[]
  tenantId: string
  friendlyName: string
  dnsSuffix: string
  lastConnected?: Date
  lastSeen?: Date
  lastDisconnected?: Date
  deviceInfo?: DeviceInfo
  icon: number
  username?: string
  password?: string
  useTLS?: boolean
  allowSelfSigned?: boolean
  certHash?: string
}
export interface DeviceInfo {
  fwVersion: string
  fwBuild: string
  fwSku: string
  currentMode: string
  features: string
  ipAddress: string
  lastUpdated?: Date
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
  expirationDate: Date
}

export interface WirelessConfig {
  profileName: string
  authenticationMethod: number
  encryptionMethod: number
  ssid: string
  pskPassphrase?: string
  ieee8021xProfileName?: string
  version?: string
}

export interface IEEE8021xConfig {
  profileName: string
  authenticationProtocol: number
  pxeTimeout: number
  wiredInterface: boolean
  version?: string
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

export interface EventLogResponse {
  hasMoreRecords: boolean
  records: EventLog[]
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

export interface BootParams {
  instanceID: string
  biosBootString: string
  bootString: string
}

export interface AMTFeaturesResponse {
  userConsent: string
  optInState: number
  redirection: boolean
  kvmAvailable: boolean
  KVM: boolean
  SOL: boolean
  IDER: boolean
  ocr: boolean
  httpsBootSupported: boolean
  winREBootSupported: boolean
  localPBABootSupported: boolean
  remoteErase: boolean
  pbaBootFilesPath: BootParams[]
  winREBootFilesPath: BootParams
}
export interface AMTFeaturesRequest {
  userConsent: string
  enableKVM: boolean
  enableSOL: boolean
  enableIDER: boolean
  ocr: boolean
  remoteErase: boolean
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

export interface IPSAlarmClockOccurrence {
  ElementName: string
  InstanceID: string
  StartTime: any
  Interval?: any
  IntervalInMinutes?: number
  DeleteOnCompletion: boolean
}

export interface IPSAlarmClockOccurrenceInput {
  ElementName: string
  InstanceID?: string
  StartTime: string
  Interval?: number
  DeleteOnCompletion: boolean
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

export interface DiskResponse<T> {
  responses: T | any
}

export interface DiskInformation {
  CIM_MediaAccessDevice: DiskResponse<CIMMediaAccessDevice[]>
  CIM_PhysicalPackage: DiskResponse<CIMPhysicalPackage[]>
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
}
export interface Body {
  ReturnValue: number
  ReturnValueStr: string
}

export interface UserConsentResponse {
  Header: Header
  Body: Body
  error?: any
}

export interface UserConsentData {
  deviceId: string
  results: any
}

export interface RedirectionToken {
  token: string
}

export interface Certificates {
  profileAssociation: any
  certificates: any
  publicKeys: any
}
interface Ieee8021x {
  enabled: string
  availableInS0: boolean
  pxeTimeout: number
}

export interface TLSSettings {
  ElementName: string
  InstanceID: string
  MutualAuthentication: boolean
  Enabled: boolean
  AcceptNonSecureConnections: boolean
  NonSecureConnectionsSupported: boolean
}

interface WiFiPortConfigService {
  requestedState: number
  enabledState: number
  healthState: number
  elementName: string
  systemCreationClassName: string
  systemName: string
  creationClassName: string
  name: string
  localProfileSynchronizationEnabled: number
  lastConnectedSsidUnderMeControl: string
  noHostCsmeSoftwarePolicy: number
  uefiWiFiProfileShareEnabled: boolean
}

interface WiredNetworkSettings {
  elementName: string
  instanceID: string
  vlanTag: number
  sharedMAC: boolean
  macAddress: string
  linkIsUp: boolean
  linkPolicy: string[]
  linkPreference: string
  linkControl: string
  sharedStaticIP: boolean
  sharedDynamicIP: boolean
  ipSyncEnabled: boolean
  dhcpEnabled: boolean
  ipAddress: string
  subnetMask: string
  defaultGateway: string
  primaryDNS: string
  secondaryDNS: string
  physicalConnectionType: string
  physicalNICMedium: string
  ieee8021x: Ieee8021x
}

interface WirelessNetworkSettings {
  elementName: string
  instanceID: string
  vlanTag: number
  sharedMAC: boolean
  macAddress: string
  linkIsUp: boolean
  linkPolicy: string[]
  linkPreference: string
  linkControl: string
  sharedStaticIP: boolean
  sharedDynamicIP: boolean
  ipSyncEnabled: boolean
  dhcpEnabled: boolean
  ipAddress: string
  subnetMask: string
  defaultGateway: string
  primaryDNS: string
  secondaryDNS: string
  consoleTCPMaxRetransmissions: number
  wlanLinkProtectionLevel: string
  physicalConnectionType: string
  physicalNICMedium: string
  wifiNetworks: any[]
  ieee8021xSettings: any[]
  wifiPortConfigService: WiFiPortConfigService
}

export interface NetworkConfig {
  wired: WiredNetworkSettings
  wireless: WirelessNetworkSettings
}

export interface RedirectionStatus {
  isKVMConnected: boolean
  isSOLConnected: boolean
  isIDERConnected: boolean
}

export interface FormOption<T> {
  value: T
  mode?: string
  label: string
}

export interface DataWithCount<T> {
  data: T[]
  totalCount: number
}

export interface MPSVersion {
  serviceVersion: string
  latest : {
    tag_name: string
  }
}

export interface RPSVersion {
  serviceVersion: string
  protocolVersion: string
}

export interface CertInfo {
  cert: string
  isTrusted: boolean
}

export interface BootDetails {
  url?: string
  username?: string
  password?: string
  bootPath?: string
  enforceSecureBoot: boolean
}

export interface ProxyConfig {
  name: string
  address: string
  infoFormat: number
  port: number
  networkDnsSuffix: string
  creationDate?: Date
  tenantId?: string
}

export interface BootSource {
  biosBootString: string
  bootString: string
  elementName: string
  failThroughSupported: number
  instanceID: string
  structuredBootString: string
}

export interface DisplayInfo {
  displayIndex: number
  isActive: boolean
  resolutionX: number
  resolutionY: number
  upperLeftX: number
  upperLeftY: number
  role?: string
  isDefault?: boolean
}

export interface DisplaySelectionResponse {
  displays: DisplayInfo[]
}

export interface DisplaySelectionRequest {
  displayIndex: number
}
