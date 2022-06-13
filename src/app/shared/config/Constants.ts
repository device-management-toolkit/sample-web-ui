/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

type EventTypeMap = Record<number, string>
const EVENTTYPEMAP: EventTypeMap = {
  1: 'Threshold based event',
  7: 'Generic severity event',
  10: 'Linkup Event',
  111: 'Sensor specific event'
}

export default {
  ACMActivate: 'acmactivate',
  CCMActivate: 'ccmactivate',
  WPAPSK: 4,
  WPA2PSK: 6,
  TKIP: 3,
  CCMP: 4,
  NORESULTS: 'No Wifi Configs Found',
  EVENTTYPEMAP: EVENTTYPEMAP
}
