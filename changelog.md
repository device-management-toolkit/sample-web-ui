<a name="v1.3.0"></a>
## [v1.3.0]

### Build
- **dep:** bump ui-toolkit version to latest
- **deps:** Bump tslib from 2.1.0 to 2.2.0
- **deps:** Bump zone.js from 0.10.3 to 0.11.4
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin-template
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin from 2.1.0 to 4.0.0
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/schematics from 2.0.2 to 4.0.0
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.2.9 to 11.2.11 ([#202](https://github.com/open-amt-cloud-toolkit/rps/issues/202))
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.2.8 to 11.2.9
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.9 to 11.2.10
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin from 2.0.2 to 2.1.0
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#197](https://github.com/open-amt-cloud-toolkit/rps/issues/197))
- **deps-dev:** Bump eslint from 7.23.0 to 7.24.0
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin-template
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.8 to 11.2.9
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.2.7 to 11.2.8
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.20.0 to 4.21.0
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular ([#203](https://github.com/open-amt-cloud-toolkit/rps/issues/203))
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.2.6 to 11.2.7
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.7 to 11.2.8
- **version:** update package.json to v1.3.0

### Ci
- bump cypress to 6.9.1
- point it to the right Protex project

### Docs
- added documentation for Cypress ([#194](https://github.com/open-amt-cloud-toolkit/rps/issues/194))
- **changelog:** add v1.2.0 ([#161](https://github.com/open-amt-cloud-toolkit/rps/issues/161))

### Feat
- **authentication:** add stateless authentication ([#162](https://github.com/open-amt-cloud-toolkit/rps/issues/162))

### Fix
- upgrade multiple dependencies with Snyk ([#201](https://github.com/open-amt-cloud-toolkit/rps/issues/201))
- reworked ui tests to work with cypress 7
- **jenkins:** fixed checkmarx and snyk targets
- **kvm:** add encoding options to kvm page ([#189](https://github.com/open-amt-cloud-toolkit/rps/issues/189))
- **kvm:** make amt features call synchronous in kvm page ([#152](https://github.com/open-amt-cloud-toolkit/rps/issues/152))
- **mpsapi:** update setAMTFeatures
- **routing:** use correct url when in dev or prod mode
- **websocket:** fix server url for kvm and sol

### Refactor
- updated device obj to match mps ([#192](https://github.com/open-amt-cloud-toolkit/rps/issues/192))
- updated lock for pr
- **api:** updated mps api routes ([#187](https://github.com/open-amt-cloud-toolkit/rps/issues/187))

### Test
- **cy:** cypress update for 1.2 ([#154](https://github.com/open-amt-cloud-toolkit/rps/issues/154))


<a name="v1.2.0"></a>
## [v1.2.0] - 2021-04-02
### Build
- fix scripts for docker
- **deps:** Bump cypress from 6.6.0 to 6.7.1
- **deps:** Bump ui-toolkit from `69b92e6` to `2976fde`
- **deps:** Bump rxjs from 6.6.6 to 6.6.7
- **deps:** Bump xterm from 4.10.0 to 4.11.0
- **deps:** update angular to 11.2
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.19.0 to 4.20.0
- **deps-dev:** Bump eslint from 7.22.0 to 7.23.0
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.2.4 to 11.2.6
- **deps-dev:** Bump [@types](https://github.com/types)/jasmine from 3.6.7 to 3.6.8
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump karma from 6.2.0 to 6.3.1
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.5 to 11.2.7
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.18.0 to 4.19.0
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/schematics from 1.2.0 to 2.0.2
- **deps-dev:** Bump [@types](https://github.com/types)/jasmine from 3.6.6 to 3.6.7
- **deps-dev:** Bump typescript from 4.0.7 to 4.1.5
- **deps-dev:** Bump jasmine-core from 3.6.0 to 3.7.1
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/builder from 1.2.0 to 2.0.2
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/template-parser
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.17.0 to 4.18.0
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin-template
- **deps-dev:** Bump [@angular](https://github.com/angular)-eslint/eslint-plugin from 2.0.1 to 2.0.2
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** Bump [@types](https://github.com/types)/jasmine from 3.6.8 to 3.6.9
- **deps-dev:** Bump [@types](https://github.com/types)/node from 14.14.34 to 14.14.35
- **deps-dev:** Bump eslint from 7.21.0 to 7.22.0
- **deps-dev:** Bump [@types](https://github.com/types)/node from 14.14.33 to 14.14.34
- **deps-dev:** Bump karma from 6.3.1 to 6.3.2
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.4 to 11.2.5
- **deps-dev:** Bump karma from 6.1.2 to 6.2.0
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.16.1 to 4.17.0
- **deps-dev:** Bump karma from 6.1.1 to 6.1.2
- **deps-dev:** Bump [@angular](https://github.com/angular)/cli from 11.0.7 to 11.2.3
- **deps-dev:** Bump [@types](https://github.com/types)/node from 14.14.31 to 14.14.33
- **deps-dev:** Bump [@angular](https://github.com/angular)/localize from 11.2.3 to 11.2.4
- **deps-dev:** Bump [@angular](https://github.com/angular)-devkit/build-angular
- **deps-dev:** Bump eslint-plugin-jsdoc from 32.1.1 to 32.2.0
- **deps-dev:** Bump [@types](https://github.com/types)/node from 14.14.31 to 14.14.32
- **deps-dev:** Bump [@types](https://github.com/types)/jasmine from 3.6.4 to 3.6.6
- **deps-dev:** Bump eslint-plugin-prefer-arrow from 1.2.2 to 1.2.3
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** Bump cypress from 6.5.0 to 6.6.0
- **deps-dev:** Bump [@types](https://github.com/types)/node from 14.14.35 to 14.14.37
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.3.0 to 4.16.1
- **deps-dev:** Bump eslint-plugin-jsdoc from 30.7.6 to 32.1.1 ([#47](https://github.com/open-amt-cloud-toolkit/rps/issues/47))
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.3.0 to 4.16.1
- **deps-dev:** Bump [@types](https://github.com/types)/node from 12.19.15 to 14.14.31
- **deps-dev:** Bump typescript from 4.0.5 to 4.0.7
- **deps-dev:** Bump [@typescript](https://github.com/typescript)-eslint/parser from 4.3.0 to 4.16.1

### Ci
- remove node 10 from build matrix
- add initial Jenkinsfile
- add cypress to github actions
- set codecov action to v1.2.1

### Docs
- add changelog

### Feat
- **audit-log:** add audit-log table
- **device:** add display of tags, entry of tags and device details
- **devices:** add filtering by tags
- **devices:** add bulk power actions
- **docker:** add back docker ci
- **domains:** indicate when cert has been uploaded
- **help:** add hints for each field
- **kvm:** add kvm functionality
- **kvm:** kvm updates ([#120](https://github.com/open-amt-cloud-toolkit/rps/issues/120))
- **kvm:** add power status check flow
- **metadata:** add metadata display
- **nginx:** add conf files for nginx
- **sol:** sol-component
- **sol:** sol-updates
- **sol:** creted app-tool-bar component
- **sol:** sol updates
- **validation:** add input validation
- **websockets:** add websocket example

### Fix
- add better support for error handling
- CCM validation logic on UI
- **docker:** init.sh execute permissions
- **errors:** display snackbar on error
- **kvm:** remove redundant code from device toolbar
- **kvm:** url pulls from environment
- **kvm:** fix navigation issues while connecting kvm
- **kvm:** added throttle time for mouse movement
- **power actions:** shows visual bios when reset to bios is called out of sol window
- **profile:** doesn't allow cira profile on static network selection
- **scripts:** line endings not correct for docker
- **sol:** resolve lint issues
- **sol:** bios screen fix
- **sol:** updates from master
- **sol:** resolve conflicts
- **sol:** fixed issues
- **sol:** updated package-lock.json file
- **sol:** review comments
- **sol:** resolved conflicts
- **sol:** resolve conflicts
- **sol:** review comments
- **validation:** updated http calls with error messages from server

### Refactor
- **content:** incorporate feedback from tech writer
- **kvm:** address feedbacks
- **logo:** change to non-intel branding
- **review:** address feedbacks
- **site:** switch to Angular

### Test
- enhance unit tests coverage
- add Cypress UI tests for login
- **devices:** send power action call


<a name="v1.1.0"></a>
## v1.1.0 - 2021-02-11
### Build
- **deps:** update immer
- **deps:** remove recompose
- **deps:** bump ui-toolkit
- **deps:** bump ui-toolkit
- **deps:** Bump sass from 1.32.1 to 1.32.2
- **deps:** Bump [@fortawesome](https://github.com/fortawesome)/react-fontawesome from 0.1.12 to 0.1.14
- **deps:** update mps-ui-toolkit to ui-toolkit

### Ci
- add types for conventional commits
- add docker ci
- add github actions for tests

### Docs
- add apache 2.0 license
- add changelog
- add status badges
- add release disclaimer

### Feat
- cors support
- network configs
- **cors:** allow toggle of withCredentials for ajax requests
- **docker:** add back docker support w/ build arg

### Fix
- init.sh script not udpating auth field
- browser crash issue fix
- **ciraconfig:** Add mps api key to ciraconfig and profile components context
- **ciraconfig:** root cert not loading from MPS
- **dashbord:** browswer crash fix
- **docker:** init script +x
- **profile:** passing mpsServer prop
- **ui-toolkit:** updated version

### Refactor
- migrate webui from mps
- **docker:** optimize how server is set

