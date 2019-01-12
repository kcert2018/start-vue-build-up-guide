# Vue 프로젝트 시작 안내서

Vue로 개발하려는 초보자들을 위한 가이드 문서입니다.  

> 유영창 : frog@falinux.com

## 들어가며

Vue 와 관련 소개글을 읽으면, 쉽다는 생각이 듭니다. 도전 의지도 마구 마구 생깁니다.  

맞습니다. 남들이 하는 거 보면 쉽습니다!  

내가 하며? 어렵습니다. 

> 왜?  
> 처음에 어떻게 시작해야 할지 막막하기 때문입니다.  

그래서 처음 하시는 분들이 따라 하도록 문서를 만들어 봤습니다. 그동안 최신 트랜드에 따라가기 위해 제가 했던 삽질을 여러분이 하면 안되잖아요?

그리고 생각보다 초기 개발 환경 빌드 과정은 쉽습니다!

### 최소 필요 지식

이 글을 읽고 따라하시려면 우분투와 도커는 아셔야 합니다. 

* ubuntu(mint 포함) 명령 사용법
* docker 와 docker-compose 사용법
* git 사용법

전문가 수준이 필요한 것이 아닙니다. 필요할 때 구글 검색하면서 배워 가실 정도면 됩니다.

### 개발 환경

개인적으로 저는 민트를 씁니다. 우분투 기반이라 우분투와 호환되면서 GUI 환경이 좋습니다. 윈도우를 쓰시는 분들은 말리고 싶습니다. 맥은? 부럽습니다. 

이 후에 실행될 명령들은 모두 리눅스 명령입니다. 

### 도커를 알아야 하는 이유 

프런트 앤드 개발자로 사시려면 도커를 학습할 것을 강력하게 권장합니다.  

그 이유는 자신의 PC 를 보호하기 하기 위한 것이고, 개발 과정에서 필수적으로 요구 되기 때문입니다. 

프런트앤드 개발을 하시면 다양한 공개 소프트웨어와 툴들을 사용하실 겁니다. 공개 소프트는 반드시 필요한 패키지가 있습니다. 각 요구 버전도 다릅니다.

그래서 여러분의 개발 PC 는 언젠가는 너덜 너덜 해 집니다. 결국 PC 초기화를 하시는 자신의 모습을 보시게 될 겁니다. 이런것이 싫으면 도커 컨테이너로 개발 환경을 구축하는 것이 수명 연장의 지름길입니다. 

프런트엔드 개발자지만 필수적으로 백 엔드도 다루게 됩니다. 개발 단계를 따라가거나 자동화를 쫒다보면 반드시 도커 컨테이너를 알아야 할 것이고 결국 쿠버네티스를 만나 큐브를 만지작 거리는 자신을 발견하게 되실 겁니다.

반드시! 도커 공부하십시오!

## 개발 환경 구축

가장 처음 해야 할 일은 개발 환경을 구축 하는 것입니다. 

최소한의 개발 환경은 다음과 같습니다. 

* 우분투가 설치된 개발 PC 1 대 
* docker 및 docker-compose
* 에디터 : Visual Studio Code 권장
* 크롬브라우저 

위에 나열된 개발 환경 설명은 언젠가(?) 쓰도록 하겠습니다. 

### project 폴더 생성 

오랬동안 삽질한 결과, 항상 project 폴더를 홈디렉토리 밑에 만듭니다. 
초보자시라면 당분간 그냥 project 폴더를 홈디렉토리 밑에 만드십시오

여기서는 start-study 라는 폴더로 만들고 이후에는 이 폴더명을 따로 언급하지 않을 겁니다. 

다음과 같이 만들기 바랍니다. 

~~~ shell
$ cd ~
$ mkdir start-study
$ cd start-study
~~~

github 의 문서로 이글을 보시고 계시다면 이 프로젝트 자체가 위 폴더명으로 clone 된 것입니다. 

### project 폴더 구성 

이제 폴더 하부에 다음 폴더들를 만드십시오

* apps - 프런트 앤드 개발 소스들 넣을 곳
* doc - 프로젝트 관련 문서들 넣을 곳
* docker - 도커 및 명령들 넣을 곳
* kube - 쿠버네티스 관리에 필요한 환경 파일 및 스크립트들 넣을 곳

왜 이렇게 만드는지를 설명하지 않겠습니다. 앞으로 진행하다보면 다 필요한 폴더들입니다. 
물론 나중에 고수가 되시면 자신만의 방법으로 하시면 됩니다. 

초보자님들은 그냥 묻지도 따지지도 마시고 따라 오십시오.

다음 명령을 사용하시면 됩니다. 

~~~ shell
$ cd ~/start-study
$ mkdir apps
$ mkdir doc
$ mkdir docker
$ mkdir kube
~~~

### docker-compose.yml 작성

개발 환경을 도커 환경을 만들기 위해서 docker-compose 를 사용합니다. 
이때 필요한 파일이 docker-compose.yml 입니다. 

docker 폴더 밑에 docker-compose.yml을 다음과 같이 작성합니다. 

> [docker/docker-compose.yml](https://github.com/kcert2018/start-vue-build-up-guide/blob/master/docker/docker-compose.yml)

~~~ yaml
#
# 이 파일은 도커를 관리하는 파일입니다. 
#
version: '2'
services:
  start-home-main-ds:
    image: start/home-main-ds:0.1
    container_name: start-home-main-ds
    volumes:
      - ../apps/:/apps
    network_mode: "host"
    privileged: true
    environment:
      NODE_ENV: development
      CYPRESS_CACHE_FOLDER: /apps/.cypress-cache
    command: bash

  vue-cli-3-ds:
    build:
      context: ./development
      dockerfile: Dockerfile
    image: start/home-main-ds:0.1

# end of file
~~~

따라하는 과정에서 이 파일을 당장 이해할 필요는 없습니다. 여기서는 어떤 것을 정의 하는지 간단하게만 정리합니다. 

도커 이미지 생성 관련된 것은 vue-cli-3-ds 섹션에서 정의합니다.

* development/Dockerfile 을 이용하여 start/home-main-ds:0.1 라는 이름으로 아미지가 만들어집니다. 

개발 환경 컨네이너는 start-home-main-ds 섹션에서 정의 합니다. 

* 개발 환경 컨테이너는 호스트 PC와 포트를 공유하고 root 권한으로 실행됩니다. 
* "apps" 폴더를 컨테이너 내부에 "/apps" 로 연결합니다. 
* 개발 환경임을 알리기 위해서 환경 변수 NODE_ENV 를 development 로 설정합니다. 
* E2E 테스트를 위한 캐쉬 폴더를 /apps/.cypress-cache 로 사용하기 위해 CYPRESS_CACHE_FOLDER 환경 변수를 설정합니다.

### docker-compose.yml 작성


