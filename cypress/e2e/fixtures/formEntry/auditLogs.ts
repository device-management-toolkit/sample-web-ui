/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const auditLogFixtures = {
  happyPath: {
    totalCnt: 1,
    records: [
      {
        AuditAppID: 16,
        EventID: 11,
        InitiatorType: 0,
        AuditApp: 'Security Admin',
        Event: 'KVM enabled',
        Initiator: 'admin',
        Time: '2021-09-08T16:31:02.000Z',
        MCLocationType: 0,
        NetAddress: '127.0.0.1',
        Ex: '\u0004`g\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000',
        ExStr: null
      }
    ]
  }
}
export { auditLogFixtures as eventLogFixtures }
