/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
const eventLogFixtures = {
  happyPath: {
    DeviceAddress: 255,
    EventSensorType: 15,
    EventType: 'Sensor specific event',
    EventOffset: 2,
    EventSourceType: 104,
    EventSeverity: 8,
    SensorNumber: 255,
    Entity: 34,
    EntityInstance: 0,
    EventData: [64, 19, 0, 0, 0, 0, 0, 0],
    Time: '2021-09-08T16:31:02.000Z',
    EntityStr: 'BIOS',
    Desc: 'Starting operating system boot process'
  }
}
export { eventLogFixtures }
