/*********************************************************************
* Copyright (c) Intel Corporation 2022
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

const badRequest = {
  response: {
    error: 'string',
    message: 'string'
  }
}
const empty = {
  response: {
    data: [],
    totalCount: 0
  }
},
const error = {
  response: {
    error: 'string',
    message: 'string'
  }
}
export { badRequest, error, empty }
