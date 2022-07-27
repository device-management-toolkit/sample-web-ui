/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const devices = {
  getAll: {
    success: {
      response: {
        data: [
          {
            guid: '123e4567-e89b-12d3-a456-426614174000',
            hostname: 'AMTDEVICENUC1',
            connectionStatus: 1,
            tags: [
              'Texas',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: '123e4567-e89b-12d3-a456-426614174001',
            hostname: 'AMTDEVICENUC2',
            connectionStatus: 0,
            tags: [
              'Windows',
              'NUC',
              'Store #124'
            ]
          }
        ],
        totalCount: 2
      }
    },
    tags: {
      response: {
        data: [
          {
            guid: '123e4567-e89b-12d3-a456-426614174000',
            hostname: 'Win7-machine1',
            connectionStatus: 1,
            tags: [
              'Windows',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
            hostname: 'AMTDEVICENUC1',
            connectionStatus: 1,
            tags: [
              'Windows',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
            hostname: 'AMTDEVICENUC1',
            connectionStatus: 1,
            tags: [
              'Linux',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
            hostname: 'Win7-machine2',
            connectionStatus: 1,
            tags: [
              'Windows',
              'DELL',
              'Store #123'
            ]
          },
          {
            guid: 'bf49cf00-9164-11e4-952b-b8aeed7ec595',
            hostname: 'AMTDEVICENUC1',
            connectionStatus: 1,
            tags: [
              'Linux',
              'DELL',
              'Store #456'
            ]
          }
        ],
        totalCount: 4
      }
    },
    windows: {
      response: {
        data: [
          {
            guid: '123e4567-e89b-12d3-a456-426614174000',
            hostname: 'Win7-machine1',
            connectionStatus: 1,
            tags: [
              'Windows',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: '8dad96cb-c3db-11e6-9c43-bc0000d20001',
            hostname: 'Win7-machine2',
            connectionStatus: 1,
            tags: [
              'Windows',
              'NUC',
              'Store #123'
            ]
          }
        ],
        totalCount: 2
      }
    },
    forPaging: {
      response: {
        data: [
          {
            guid: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
            hostname: 'Win7-machine',
            connectionStatus: 1,
            tags: [
              'Windows',
              'NUC',
              'Store #123'
            ]
          },
          {
            guid: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
            hostname: 'Ubuntu-machine',
            connectionStatus: 1,
            tags: [
              'not',
              'me'
            ]
          },
          {
            hostname: 'Win7-machine',
            guid: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
            connectionStatus: 1,
            tags: [
              'pick',
              'me'
            ]
          },
          {
            hostname: 'Ubuntu-machine',
            guid: 'bf49cf00-9164-11e4-952b-b8aeed7ec594',
            connectionStatus: 0,
            tags: [
              'not',
              'me'
            ]
          },
          {
            hostname: 'Win7-machine',
            guid: '8dad96cb-c3db-11e6-9c43-bc0000d20000',
            connectionStatus: 1,
            tags: [
              'pick',
              'me'
            ]
          }
        ],
        totalCount: 100
      }
    }
  }
}

export { devices }
