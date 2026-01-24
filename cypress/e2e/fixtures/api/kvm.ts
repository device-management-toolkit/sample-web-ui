/*********************************************************************
 * Copyright (c) Intel Corporation 2026
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

const kvm = {
  displaySelection: {
    success: {
      response: {
        displays: [
          {
            displayIndex: 0,
            resolutionX: 1920,
            resolutionY: 1080,
            isDefault: true,
            isActive: true
          },
          {
            displayIndex: 1,
            resolutionX: 1920,
            resolutionY: 1080,
            isDefault: false,
            isActive: true
          },
          {
            displayIndex: 2,
            resolutionX: 0,
            resolutionY: 0,
            isDefault: false,
            isActive: false
          },
          {
            displayIndex: 3,
            resolutionX: 0,
            resolutionY: 0,
            isDefault: false,
            isActive: false
          }
        ]
      }
    },
    singleDisplay: {
      response: {
        displays: [
          {
            displayIndex: 0,
            resolutionX: 1920,
            resolutionY: 1080,
            isDefault: true,
            isActive: true
          }
        ]
      }
    },
    error: {
      response: {
        error: 'Failed to get display selection'
      }
    }
  },
  powerState: {
    poweredOn: {
      response: {
        powerState: 2
      }
    },
    poweredOff: {
      response: {
        powerState: 8
      }
    }
  },
  redirectionStatus: {
    available: {
      response: {
        isKVMRedirectionAvailable: true,
        isSOLRedirectionAvailable: true,
        isIDERRedirectionAvailable: true
      }
    },
    unavailable: {
      response: {
        isKVMRedirectionAvailable: false,
        isSOLRedirectionAvailable: false,
        isIDERRedirectionAvailable: false
      }
    }
  },
  amtFeatures: {
    kvmEnabled: {
      response: {
        userConsent: 'none',
        redirection: true,
        optInState: 0,
        kvmAvailable: true,
        solAvailable: true,
        iderAvailable: true
      }
    },
    kvmDisabled: {
      response: {
        userConsent: 'none',
        redirection: true,
        optInState: 0,
        kvmAvailable: false,
        solAvailable: true,
        iderAvailable: true
      }
    },
    userConsentRequired: {
      response: {
        userConsent: 'kvm',
        redirection: true,
        optInState: 1,
        kvmAvailable: true,
        solAvailable: true,
        iderAvailable: true
      }
    }
  },
  userConsent: {
    granted: {
      response: {
        consentGiven: true,
        message: 'User consent granted'
      }
    },
    denied: {
      response: {
        consentGiven: false,
        message: 'User consent denied'
      }
    }
  },
  kvmConnection: {
    success: {
      response: {
        status: 'connected',
        encodingOptions: {
          encoding: 1
        }
      }
    },
    error: {
      response: {
        error: 'Failed to establish KVM connection'
      }
    }
  }
}

export { kvm }
