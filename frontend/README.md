도커 테스트
docker build -t mra .
docker run -d -p 8080:8080 --name mra-container mra

이미지 삭제
docker images 확인

해당 이미지의 Image ID를 찾아서 삭제 (강제삭제)
docker rmi -f [Image ID] 