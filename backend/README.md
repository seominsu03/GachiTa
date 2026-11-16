# GachiTa 서버

Java 21 / Spring Boot 3.5.16 / Spring Security / JPA / MySQL. 회원·택시방·참여·정산 REST API를 제공합니다.

- [실행 안내](../docs/RUN_GUIDE.md)
- [API 명세](../docs/API_SPEC.md)
- [검증 범위와 남은 작업](../docs/IMPLEMENTATION_STATUS.md)

MySQL 없이 로컬 메모리 데모:

~~~powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.useTestClasspath=true" "-Dspring-boot.run.profiles=demo"
~~~

실제 MySQL 환경 변수를 준비한 뒤 개발 서버:

~~~powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
~~~

통합 테스트는 별도의 H2 메모리 DB를 사용합니다:

~~~powershell
.\mvnw.cmd test
~~~

JAVA_HOME은 설치된 JDK 21 경로로 지정합니다. .env.example은 참고 파일이며 자동 로드되지 않습니다. demo 데이터는 종료하면 사라지고, dev는 실제 MySQL에 저장합니다.
