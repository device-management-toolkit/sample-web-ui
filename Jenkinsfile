pipeline{
    agent {
        label 'docker-amt'
    }
    options {
        buildDiscarder(logRotator(numToKeepStr: '5', daysToKeepStr: '30'))
        timestamps()
        timeout(unit: 'HOURS', time: 2)
    }
    stages{
        stage('Scan'){
            environment {
                PROJECT_NAME               = 'OpenAMT - sample-web-ui'
                SCANNERS                   = 'checkmarx,snyk'

                // publishArtifacts details
                PUBLISH_TO_ARTIFACTORY     = true

                SNYK_MANIFEST_FILE         = 'package-lock.json'
                SNYK_PROJECT_NAME          = 'openamt-sample-web-ui'
            }
            when {
                anyOf {
                    branch 'main';
                }
            }
            steps {
                script{
                    scmCheckout { 
                        clean = true
                    }
                }
                rbheStaticCodeScan()
            }
        }
    }
    post{
        failure {
             script{
                slackBuildNotify {
                    slackFailureChannel = '#open-amt-cloud-toolkit-build'
                }
            }
        }
    }
}
