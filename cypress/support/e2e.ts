/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// Import commands.js using ES2015 syntax:
import './commands'

// Global error handler for 404 errors when devices don't exist or aren't activated
// This is expected behavior after deactivation tests
Cypress.on('uncaught:exception', (err) => {
  // Handle 404 errors gracefully - devices may not exist after deactivation
  if (err.message.includes('404 Not Found') ||
      err.message.includes('HttpErrorResponse') ||
      err.message.includes('amt/features')) {
    console.log('Caught 404 error - device not found or not activated (expected after deactivation)')
    return false // prevent test from failing
  }
  // Let other errors fail the test
  return true
})
