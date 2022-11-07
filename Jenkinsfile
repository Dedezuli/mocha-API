/*
 * This Jenkinsfile controls qa-backend-mocha docker image
 * Version 0.0.1
 * Maintained by: Investree QA
 */

def slave = "automation-test-slave"
podTemplate(
  label: slave,
  containers:[
    containerTemplate(
      name: "docker", image: "docker", command: "cat", ttyEnabled: "true")],
  volumes:[
    hostPathVolume(
      hostPath: "/var/run/docker.sock", mountPath: "/var/run/docker.sock"),
    persistentVolumeClaim(
      mountPath: "/root", claimName: "slave-root-home", readOnly: "false")]
){
  node(slave){
    try{
        dir('qa-backend-mocha') {
            git branch: "master",
            credentialsId: 'private-key-for-bitbucket',
            url: 'git@bitbucket.org:investree/qa-backend-mocha.git'
    
            IMAGE_NAME = "qa-backend-mocha"
            DOCKER_IMAGE = "registry-intl-vpc.ap-southeast-5.aliyuncs.com/investree/${IMAGE_NAME}"
            DOCKER_REGISTRY_CRED_ID = "k8s-deployer"
            
            getPackageVersion = "awk -F'\"' '/\"version\": \".+\"/{ print \$4; exit; }' package.json"
            PACKAGE_VERSION = sh(returnStdout: true, script: getPackageVersion)
            PACKAGE_VERSION = PACKAGE_VERSION.trim()
            IMAGE_VERSION = "${PACKAGE_VERSION}.${currentBuild.number}"
                
            stage('Build Docker Image'){
                container('docker'){
                    withDockerRegistry([
                        credentialsId: "${DOCKER_REGISTRY_CRED_ID}",
                        url: "https://registry-intl-vpc.ap-southeast-5.aliyuncs.com"
                    ]){
                        sh "docker build --rm -t ${DOCKER_IMAGE}:${IMAGE_VERSION} --no-cache ."
                        sh "docker tag ${DOCKER_IMAGE}:${IMAGE_VERSION} ${DOCKER_IMAGE}:latest"
                        sh "docker push ${DOCKER_IMAGE}:${IMAGE_VERSION}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                        sh "docker images -a ${DOCKER_IMAGE}:${IMAGE_VERSION} -q"
                        sh "docker rmi -f \$(docker images -a ${DOCKER_IMAGE}:${IMAGE_VERSION} -q)"
                    }
                }
            }
        }
    }
    catch (e) {
      throw e
    }
  }
}